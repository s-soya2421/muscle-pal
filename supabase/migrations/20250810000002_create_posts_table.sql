-- supabase/migrations/20250810000003_create_posts_related_tables.sql
-- MusclePal Posts Related Tables (Likes & Comments) - Revised

BEGIN;

-- ========== TABLES ==========

-- いいねテーブル
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,  -- いいね対象の投稿ID
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- いいねしたユーザーID
  deleted_at timestamptz,                                                -- 論理削除（取り消し）
  created_at timestamptz DEFAULT now() NOT NULL                          -- いいね日時
);

-- コメントテーブル
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,   -- コメント対象の投稿ID
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- コメント作成者
  parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE, -- 親コメント（NULL=トップレベル）
  content text NOT NULL,                                                 -- 本文
  deleted_at timestamptz,                                                -- 論理削除
  created_at timestamptz DEFAULT now() NOT NULL,                         -- 作成日時
  updated_at timestamptz DEFAULT now() NOT NULL                          -- 更新日時
);

-- 空白のみコメントを禁止（存在しなければ追加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'post_comments_nonempty_content'
      AND conrelid = 'public.post_comments'::regclass
  ) THEN
    ALTER TABLE public.post_comments
      ADD CONSTRAINT post_comments_nonempty_content
      CHECK (trim(coalesce(content, '')) <> '');
  END IF;
END$$;

-- ========== INDEXES ==========

-- いいね：アクティブ一意（同じ投稿に同じユーザーが2回いいね不可）
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_likes_unique_active
  ON public.post_likes(post_id, user_id)
  WHERE deleted_at IS NULL;

-- いいね：投稿のいいね数/存在確認を高速化
CREATE INDEX IF NOT EXISTS idx_post_likes_post_active
  ON public.post_likes(post_id)
  WHERE deleted_at IS NULL;

-- いいね：ユーザーがいいねした投稿一覧・存在確認用（左端を user_id にした版）
CREATE INDEX IF NOT EXISTS idx_post_likes_user_active
  ON public.post_likes(user_id, post_id)
  WHERE deleted_at IS NULL;

-- コメント：投稿ごとの時系列取得（active）
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created_active
  ON public.post_comments(post_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- コメント：スレッド表示向け（active）
CREATE INDEX IF NOT EXISTS idx_post_comments_thread_active
  ON public.post_comments(post_id, parent_comment_id, created_at)
  WHERE deleted_at IS NULL;

-- （任意）ユーザーのコメント一覧を出すなら
CREATE INDEX IF NOT EXISTS idx_post_comments_author_active
  ON public.post_comments(author_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ========== RLS ENABLE ==========

ALTER TABLE public.post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES (REDEFINE) ==========

-- 既存ポリシーを落としてから再作成（冪等）
DROP POLICY IF EXISTS "Users can view likes on visible posts"         ON public.post_likes;
DROP POLICY IF EXISTS "Users can insert likes on visible posts"       ON public.post_likes;
DROP POLICY IF EXISTS "Users can update own likes"                    ON public.post_likes;

DROP POLICY IF EXISTS "Users can view comments on visible posts"      ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert comments on visible posts"    ON public.post_comments;
DROP POLICY IF EXISTS "Users can update own comments"                 ON public.post_comments;

-- いいね：閲覧（投稿可視性をフル反映）
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

-- いいね：追加（自分のレコード かつ 投稿が見える時のみ）
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

-- いいね：更新（自分のレコードのみ）※トグルでdeleted_atを切替えるため deleted_at 条件は付けない
CREATE POLICY "Users can update own likes"
ON public.post_likes
FOR UPDATE
USING (auth.uid() = user_id);

-- コメント：閲覧（投稿可視性をフル反映）
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

-- コメント：追加（自分のレコード かつ 投稿が見える時のみ）
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

-- コメント：更新（自分のレコードのみ）
CREATE POLICY "Users can update own comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = author_id);

-- ========== updated_at TRIGGER (comment) ==========

-- set_updated_at が無い環境でも動くように再定義（冪等）
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
