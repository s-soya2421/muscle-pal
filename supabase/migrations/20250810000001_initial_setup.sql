-- MusclePal Initial Database Setup
-- Migration: 20250810000001_initial_setup

-- プロフィールテーブル（Supabaseの認証ユーザーと連携）
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username varchar(30) NOT NULL,
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
  deleted_at timestamptz, -- 論理削除用
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- フォロー関係
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  deleted_at timestamptz, -- 論理削除用
  created_at timestamptz DEFAULT now(),
  CHECK (follower_id != following_id)
);

-- パフォーマンス最適化インデックス
-- アクティブユーザーのみのusername一意制約（部分UNIQUE制約）
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_active 
  ON public.profiles(username) WHERE deleted_at IS NULL;

-- アクティブなフォロー関係のみの一意制約
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_active_unique 
  ON public.follows(follower_id, following_id) WHERE deleted_at IS NULL;

-- 検索性能向上用の部分インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_active 
  ON public.profiles(created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_follows_follower_active 
  ON public.follows(follower_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_follows_following_active 
  ON public.follows(following_id) WHERE deleted_at IS NULL;

-- RLS（Row Level Security）の有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（論理削除を考慮）
CREATE POLICY "Users can view active profiles" ON public.profiles 
  FOR SELECT USING (deleted_at IS NULL);
  
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view active follows" ON public.follows 
  FOR SELECT USING (deleted_at IS NULL);
  
CREATE POLICY "Users can manage own follows" ON public.follows 
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
  
CREATE POLICY "Users can update own follows" ON public.follows 
  FOR UPDATE USING (auth.uid() = follower_id);

-- プロフィール自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 論理削除用ヘルパー関数
CREATE OR REPLACE FUNCTION public.soft_delete_user(user_id uuid)
RETURNS void AS $$
BEGIN
  -- ユーザープロフィールを論理削除
  UPDATE public.profiles 
  SET deleted_at = now(), 
      username = username || '_deleted_' || extract(epoch from now())::bigint -- username重複回避
  WHERE id = user_id AND deleted_at IS NULL;
  
  -- フォロー関係を論理削除
  UPDATE public.follows 
  SET deleted_at = now()
  WHERE (follower_id = user_id OR following_id = user_id) AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;