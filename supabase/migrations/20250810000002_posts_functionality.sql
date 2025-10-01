-- MusclePal Posts Functionality (Revised)
-- Migration: 20250810000002_posts_functionality_fix

BEGIN;

-- ========== SCHEMA HARDENING ==========

-- NOT NULLの厳密化（NULL三値論理でCHECKを素通りしないように）
ALTER TABLE public.posts
  ALTER COLUMN privacy SET NOT NULL,
  ALTER COLUMN post_type SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.post_comments
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.post_likes
  ALTER COLUMN created_at SET NOT NULL;

-- 内容バリデーション：本文が空白のみのときは media が必要
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_nonempty_content_or_media'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_nonempty_content_or_media
    CHECK (
      (trim(coalesce(content, '')) <> '')
      OR array_length(media_urls, 1) IS NOT NULL
    );
  END IF;
END$$;

-- ========== INDEXES (追加/補強) ==========

-- 既存：ユーザー別投稿一覧（active）
CREATE INDEX IF NOT EXISTS idx_posts_author_created_active 
  ON public.posts(author_id, created_at DESC) WHERE deleted_at IS NULL;

-- 追加：全体タイムライン用（active）
CREATE INDEX IF NOT EXISTS idx_posts_created_active
  ON public.posts(created_at DESC) WHERE deleted_at IS NULL;

-- 既存：いいね一意（active）
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_likes_unique_active 
  ON public.post_likes(post_id, user_id) WHERE deleted_at IS NULL;

-- 追加：いいね数集計・存在確認を高速化（active）
CREATE INDEX IF NOT EXISTS idx_post_likes_post_active
  ON public.post_likes(post_id) WHERE deleted_at IS NULL;

-- 既存：コメント一覧（active）
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created_active 
  ON public.post_comments(post_id, created_at ASC) WHERE deleted_at IS NULL;

-- 追加：スレッド表示向け（active）
CREATE INDEX IF NOT EXISTS idx_post_comments_thread_active
  ON public.post_comments(post_id, parent_comment_id, created_at)
  WHERE deleted_at IS NULL;

-- ========== RLS ENABLE ==========

ALTER TABLE public.posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES (再定義) ==========

-- 既存ポリシーの削除（あれば）
DROP POLICY IF EXISTS "Users can view active public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view active posts from followed users" ON public.posts;
DROP POLICY IF EXISTS "Users can insert own posts"  ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts"  ON public.posts;

DROP POLICY IF EXISTS "Users can view active likes on visible posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON public.post_likes;

DROP POLICY IF EXISTS "Users can view active comments on visible posts" ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert comments on visible posts"     ON public.post_comments;
DROP POLICY IF EXISTS "Users can update own comments"                  ON public.post_comments;

-- posts: SELECT 可視性（1本化）
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

-- posts: INSERT/UPDATE（自分の投稿のみ）
CREATE POLICY "Users can insert own posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = author_id);

-- post_likes: SELECT（投稿可視性をフル反映）
CREATE POLICY "Users can view likes on visible posts"
ON public.post_likes
FOR SELECT
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.deleted_at IS NULL
      AND (
        p.privacy = 'public'
        OR p.author_id = auth.uid()
        OR (
          p.privacy = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows f
            WHERE f.follower_id = auth.uid()
              AND f.following_id = p.author_id
              AND f.deleted_at IS NULL
          )
        )
      )
  )
);

-- post_likes: INSERT（自分のいいね + 投稿が見えるときのみ）
CREATE POLICY "Users can insert likes on visible posts"
ON public.post_likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.deleted_at IS NULL
      AND (
        p.privacy = 'public'
        OR p.author_id = auth.uid()
        OR (
          p.privacy = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows f
            WHERE f.follower_id = auth.uid()
              AND f.following_id = p.author_id
              AND f.deleted_at IS NULL
          )
        )
      )
  )
);

-- post_likes: UPDATE（自分のレコードのみ）
CREATE POLICY "Users can update own likes"
ON public.post_likes
FOR UPDATE
USING (auth.uid() = user_id);

-- post_comments: SELECT（投稿可視性をフル反映）
CREATE POLICY "Users can view comments on visible posts"
ON public.post_comments
FOR SELECT
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.deleted_at IS NULL
      AND (
        p.privacy = 'public'
        OR p.author_id = auth.uid()
        OR (
          p.privacy = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows f
            WHERE f.follower_id = auth.uid()
              AND f.following_id = p.author_id
              AND f.deleted_at IS NULL
          )
        )
      )
  )
);

-- post_comments: INSERT（自分のコメント + 投稿が見えるときのみ）
CREATE POLICY "Users can insert comments on visible posts"
ON public.post_comments
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.deleted_at IS NULL
      AND (
        p.privacy = 'public'
        OR p.author_id = auth.uid()
        OR (
          p.privacy = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows f
            WHERE f.follower_id = auth.uid()
              AND f.following_id = p.author_id
              AND f.deleted_at IS NULL
          )
        )
      )
  )
);

-- post_comments: UPDATE（自分のコメントのみ）
CREATE POLICY "Users can update own comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = author_id);

-- ========== updated_at TRIGGERS ==========

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;
CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS post_comments_set_updated_at ON public.post_comments;
CREATE TRIGGER post_comments_set_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== TOGGLE LIKE FUNCTION (競合に強い版) ==========

CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id uuid)
RETURNS boolean AS $$
DECLARE
  acted boolean := false;
BEGIN
  -- 1) 既存の有効いいねがあれば「取り消し」
  UPDATE public.post_likes
  SET deleted_at = now()
  WHERE post_id = p_post_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  RETURNING true INTO acted;

  IF acted THEN
    RETURN false; -- 取り消し
  END IF;

  -- 2) 過去の取り消しがあれば「復活」
  UPDATE public.post_likes
  SET deleted_at = NULL, created_at = now()
  WHERE post_id = p_post_id
    AND user_id = auth.uid()
    AND deleted_at IS NOT NULL
  RETURNING true INTO acted;

  IF acted THEN
    RETURN true; -- 再いいね
  END IF;

  -- 3) なければ新規作成
  INSERT INTO public.post_likes (post_id, user_id)
  VALUES (p_post_id, auth.uid());

  RETURN true;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

COMMIT;
