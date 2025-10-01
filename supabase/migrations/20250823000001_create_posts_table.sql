-- MusclePal Posts Table Updates
-- Migration: 20250823000001_create_posts_table

BEGIN;

-- 既存のpostsテーブルに不足しているカラムを追加
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS workout_data jsonb DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location varchar(100);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS post_type varchar(50) DEFAULT 'general';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS share_count integer DEFAULT 0 NOT NULL;

-- 制約の追加（既存データがある場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_privacy_check' AND table_name = 'posts'
  ) THEN
    ALTER TABLE public.posts ADD CONSTRAINT posts_privacy_check 
    CHECK (privacy IN ('public', 'followers', 'private'));
  END IF;
END$$;

-- 既存のpost_type制約は変更せず、既存の値 ('workout', 'progress', 'motivation', 'general') を使用

-- インデックス
CREATE INDEX IF NOT EXISTS idx_posts_author_created_active 
  ON public.posts(author_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_created_active
  ON public.posts(created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_type_created_active
  ON public.posts(post_type, created_at DESC) WHERE deleted_at IS NULL;

-- 既存のRLSポリシーを更新（存在しない場合は作成）
DO $$
BEGIN
  -- "Users can view posts" ポリシーの更新
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can view posts'
  ) THEN
    DROP POLICY "Users can view posts" ON public.posts;
  END IF;
  
  CREATE POLICY "Users can view posts"
  ON public.posts
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      author_id = auth.uid()
      OR privacy = 'public'
      OR (
        privacy = 'followers' AND EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = auth.uid()
            AND f.following_id = author_id
            AND f.deleted_at IS NULL
        )
      )
    )
  );

  -- "Users can insert own posts" ポリシーの更新
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can insert own posts'
  ) THEN
    DROP POLICY "Users can insert own posts" ON public.posts;
  END IF;
  
  CREATE POLICY "Users can insert own posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

  -- "Users can update own posts" ポリシーの更新
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can update own posts'
  ) THEN
    DROP POLICY "Users can update own posts" ON public.posts;
  END IF;
  
  CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  USING (auth.uid() = author_id);
END$$;

-- updated_atトリガーの安全な更新
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーがあれば削除してから再作成
DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;
CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- いいね数更新関数
CREATE OR REPLACE FUNCTION public.update_post_like_count(p_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts 
  SET like_count = (
    SELECT COUNT(*) 
    FROM public.post_likes 
    WHERE post_id = p_post_id AND deleted_at IS NULL
  )
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 内容バリデーション：本文が空白のみのときは media が必要（既存制約チェック）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_nonempty_content_or_media' AND table_name = 'posts'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_nonempty_content_or_media
    CHECK (
      (trim(coalesce(content, '')) <> '')
      OR array_length(media_urls, 1) IS NOT NULL
    );
  END IF;
END$$;

COMMIT;