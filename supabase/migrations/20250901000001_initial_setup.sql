-- MusclePal Initial Database Setup
-- Migration: 20250915000001_initial_setup

BEGIN;

-- プロフィールテーブル（Supabaseの認証ユーザーと連携）
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username varchar(30) NOT NULL UNIQUE,
  display_name varchar(50) NOT NULL,
  bio text,
  avatar_url text,
  fitness_level varchar(20) CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  preferred_workout_types text[] DEFAULT '{}',
  location varchar(100),
  timezone varchar(50) DEFAULT 'Asia/Tokyo',
  role varchar(20) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  is_verified boolean DEFAULT false,
  privacy_settings jsonb DEFAULT '{"profile_visibility": "public", "activity_visibility": "public"}',
  stats jsonb DEFAULT '{"total_workouts": 0, "total_challenges": 0, "streak_days": 0}',
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- フォロー関係
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- チャレンジテーブル
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text,
  category varchar(100),
  difficulty varchar(20) CHECK (difficulty IN ('初級', '中級', '上級')),
  duration integer NOT NULL, -- 日数
  participants integer DEFAULT 0,
  current_day integer DEFAULT 1,
  progress integer DEFAULT 0,
  reward varchar(255),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 投稿テーブル
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  workout_data jsonb DEFAULT '{}',
  location varchar(100),
  post_type varchar(50) DEFAULT 'general' CHECK (post_type IN ('workout', 'progress', 'motivation', 'general')),
  tags text[] DEFAULT '{}',
  privacy varchar(20) DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'private')),
  like_count integer DEFAULT 0 NOT NULL,
  comment_count integer DEFAULT 0 NOT NULL,
  share_count integer DEFAULT 0 NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- いいねテーブル
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- コメントテーブル
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  reply_to_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);

-- RLS (Row Level Security) 設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: プロフィールは公開設定に従って表示
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (privacy_settings->>'profile_visibility' = 'public');

CREATE POLICY "Users can view and update own profile" ON public.profiles
FOR ALL USING (auth.uid() = id);

-- RLS ポリシー: 公開投稿は全員が閲覧可能
CREATE POLICY "Public posts are viewable by everyone" ON public.posts
FOR SELECT USING (privacy = 'public' AND deleted_at IS NULL);

CREATE POLICY "Users can manage their own posts" ON public.posts
FOR ALL USING (auth.uid() = author_id);

-- RLS ポリシー: いいねは認証ユーザーのみ
CREATE POLICY "Users can manage their own likes" ON public.post_likes
FOR ALL USING (auth.uid() = user_id);

-- RLS ポリシー: コメントは認証ユーザーのみ
CREATE POLICY "Users can manage their own comments" ON public.post_comments
FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Comments are viewable on public posts" ON public.post_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = post_comments.post_id 
    AND posts.privacy = 'public' 
    AND posts.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

COMMIT;