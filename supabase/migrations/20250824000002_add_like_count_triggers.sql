-- Add like count update triggers
-- Migration: 20250824000002_add_like_count_triggers

BEGIN;

-- 既存のupdate_post_like_count関数をSECURITY DEFINERに変更
CREATE OR REPLACE FUNCTION public.update_post_like_count(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.posts 
  SET like_count = (
    SELECT COUNT(*)::int
    FROM public.post_likes 
    WHERE post_id = p_post_id AND deleted_at IS NULL
  )
  WHERE id = p_post_id;
END;
$$;

-- いいね挿入時にいいね数を更新するトリガー関数
CREATE OR REPLACE FUNCTION public.handle_like_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.update_post_like_count(NEW.post_id);
  RETURN NEW;
END;
$$;

-- いいね更新時（削除/復活）にいいね数を更新するトリガー関数
CREATE OR REPLACE FUNCTION public.handle_like_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- deleted_atが変更された場合のみ実行
  IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR 
     (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    PERFORM public.update_post_like_count(NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

-- トリガーの作成（既存があれば削除してから再作成）
DROP TRIGGER IF EXISTS post_likes_insert_trigger ON public.post_likes;
CREATE TRIGGER post_likes_insert_trigger
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_insert();

DROP TRIGGER IF EXISTS post_likes_update_trigger ON public.post_likes;
CREATE TRIGGER post_likes_update_trigger
  AFTER UPDATE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_update();

-- 既存データのいいね数を修正（全投稿について）
UPDATE public.posts 
SET like_count = (
  SELECT COUNT(*) 
  FROM public.post_likes 
  WHERE post_id = posts.id AND deleted_at IS NULL
)
WHERE deleted_at IS NULL;

-- EXECUTE権限の適切な制御
REVOKE ALL ON FUNCTION public.update_post_like_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_like_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_like_update() FROM PUBLIC;

-- 必要な場合のみ特定のロールにGRANT（トリガーは自動実行されるためここでは不要）

COMMIT;