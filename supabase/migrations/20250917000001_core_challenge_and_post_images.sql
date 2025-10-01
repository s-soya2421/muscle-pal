-- Core tables for challenges progress and post images

BEGIN;

-- Add is_active to challenges if missing
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Post images intermediate table
CREATE TABLE IF NOT EXISTS public.post_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  file_size integer NOT NULL,
  width integer,
  height integer,
  alt_text text,
  display_order integer DEFAULT 0 NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Challenge participations
CREATE TABLE IF NOT EXISTS public.challenge_participations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active',
  current_day integer DEFAULT 0,
  completion_rate integer DEFAULT 0,
  started_at timestamptz,
  paused_at timestamptz,
  resumed_at timestamptz,
  last_check_in timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, challenge_id)
);

-- Daily progress per user per challenge
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  target_date date,
  status text DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  performance_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, challenge_id, day_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS post_images_post_id_idx ON public.post_images(post_id);
CREATE INDEX IF NOT EXISTS challenge_participations_user_id_idx ON public.challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS daily_progress_user_id_idx ON public.daily_progress(user_id);

-- RLS enable
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies (simplified)
DROP POLICY IF EXISTS "Post images viewable on public posts or by owner" ON public.post_images;
CREATE POLICY "Post images viewable on public posts or by owner" ON public.post_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_images.post_id
      AND (
        p.author_id = auth.uid()
        OR (p.privacy = 'public' AND p.deleted_at IS NULL)
      )
  )
);

DROP POLICY IF EXISTS "Post images manageable by post owner" ON public.post_images;
CREATE POLICY "Post images manageable by post owner" ON public.post_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_images.post_id AND p.author_id = auth.uid()
  )
);

-- challenge_participations: only the user can manage/view
DROP POLICY IF EXISTS "Own participation view" ON public.challenge_participations;
CREATE POLICY "Own participation view" ON public.challenge_participations
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Own participation manage" ON public.challenge_participations;
CREATE POLICY "Own participation manage" ON public.challenge_participations
FOR ALL USING (user_id = auth.uid());

-- daily_progress: only the user can manage/view
DROP POLICY IF EXISTS "Own daily progress view" ON public.daily_progress;
CREATE POLICY "Own daily progress view" ON public.daily_progress
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Own daily progress manage" ON public.daily_progress;
CREATE POLICY "Own daily progress manage" ON public.daily_progress
FOR ALL USING (user_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_images_updated_at ON public.post_images;
CREATE TRIGGER trg_post_images_updated_at
BEFORE UPDATE ON public.post_images
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_challenge_participations_updated_at ON public.challenge_participations;
CREATE TRIGGER trg_challenge_participations_updated_at
BEFORE UPDATE ON public.challenge_participations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_daily_progress_updated_at ON public.daily_progress;
CREATE TRIGGER trg_daily_progress_updated_at
BEFORE UPDATE ON public.daily_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Leaderboard helper (security definer RPC)
CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(
  target_challenge_id uuid,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  fitness_level text,
  current_day integer,
  completion_rate integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.user_id,
    p.display_name::text,
    p.avatar_url::text,
    p.fitness_level::text,
    cp.current_day,
    cp.completion_rate
  FROM challenge_participations cp
  JOIN profiles p ON p.id = cp.user_id
  WHERE cp.challenge_id = target_challenge_id
    AND cp.status IN ('active', 'paused', 'completed')
  ORDER BY cp.completion_rate DESC, cp.current_day DESC, p.display_name ASC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_challenge_leaderboard(uuid, integer) TO authenticated;

COMMIT;
