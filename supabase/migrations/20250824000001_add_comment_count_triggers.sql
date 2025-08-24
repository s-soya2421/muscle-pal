-- Migration: 20250824000001_add_comment_count_triggers
BEGIN;

-- 再計算関数：search_path を固定 & （任意）::int 明示
CREATE OR REPLACE FUNCTION public.update_post_comment_count(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.posts p
  SET comment_count = (
    SELECT COUNT(*)::int
    FROM public.post_comments c
    WHERE c.post_id = p_post_id
      AND c.deleted_at IS NULL
  )
  WHERE p.id = p_post_id;
END;
$$;

-- INSERT 時
CREATE OR REPLACE FUNCTION public.handle_comment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.update_post_comment_count(NEW.post_id);
  RETURN NEW;
END;
$$;

-- UPDATE 時（deleted_at トグル＆post_id 変更の両方に対応）
CREATE OR REPLACE FUNCTION public.handle_comment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- post_id が変わったら旧・新の両方を再計算
  IF NEW.post_id IS DISTINCT FROM OLD.post_id THEN
    PERFORM public.update_post_comment_count(OLD.post_id);
    PERFORM public.update_post_comment_count(NEW.post_id);
    RETURN NEW;
  END IF;

  -- deleted_at の NULL/NOT NULL が変化したときだけ再計算
  IF (OLD.deleted_at IS NULL) <> (NEW.deleted_at IS NULL) THEN
    PERFORM public.update_post_comment_count(NEW.post_id);
  END IF;

  RETURN NEW;
END;
$$;

-- DELETE 時（ハードデリート対応）
CREATE OR REPLACE FUNCTION public.handle_comment_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.update_post_comment_count(OLD.post_id);
  RETURN OLD;
END;
$$;

-- 既存トリガー張替え
DROP TRIGGER IF EXISTS post_comments_insert_trigger ON public.post_comments;
CREATE TRIGGER post_comments_insert_trigger
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_insert();

DROP TRIGGER IF EXISTS post_comments_update_trigger ON public.post_comments;
CREATE TRIGGER post_comments_update_trigger
  AFTER UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_update();

DROP TRIGGER IF EXISTS post_comments_delete_trigger ON public.post_comments;
CREATE TRIGGER post_comments_delete_trigger
  AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_delete();

-- バックフィル（論理削除されてない投稿のみ）
UPDATE public.posts p
SET comment_count = (
  SELECT COUNT(*)::int
  FROM public.post_comments c
  WHERE c.post_id = p.id
    AND c.deleted_at IS NULL
)
WHERE p.deleted_at IS NULL;

-- EXECUTE権限の適切な制御
REVOKE ALL ON FUNCTION public.update_post_comment_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_comment_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_comment_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_comment_delete() FROM PUBLIC;

-- 必要な場合のみ特定のロールにGRANT（トリガーは自動実行されるためここでは不要）

COMMIT;
