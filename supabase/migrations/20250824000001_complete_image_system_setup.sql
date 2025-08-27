-- Complete Image Upload System Setup - All-in-one Migration
-- Migration: 20250824000001_complete_image_system_setup
-- Description: Creates Supabase Storage bucket, post_images table, and all related functionality

BEGIN;

-- ========== SUPABASE STORAGE BUCKET ==========

-- Create posts-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts-images',
  'posts-images',
  true, -- Public bucket for easy access
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========== STORAGE POLICIES ==========

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'posts-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text -- Users can only upload to their own folder
);

-- Allow public read access to all images
CREATE POLICY "Public read access for post images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'posts-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images (for metadata)
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'posts-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ========== POST IMAGES TABLE ==========

CREATE TABLE IF NOT EXISTS public.post_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL, -- Path in Supabase Storage (e.g., "posts/user123/1724486400000-0.jpg")
  original_filename text NOT NULL, -- Original filename for reference
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')),
  file_size integer NOT NULL CHECK (file_size > 0 AND file_size <= 5242880), -- Max 5MB
  width integer, -- Image width in pixels (optional, for optimization)
  height integer, -- Image height in pixels (optional, for optimization)
  alt_text text, -- Accessibility alt text
  display_order integer NOT NULL DEFAULT 0, -- Order for displaying multiple images (0, 1, 2, 3)
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz -- Soft delete for image management
);

-- ========== POST IMAGES CONSTRAINTS & FUNCTIONS ==========

-- Ensure max 4 images per post
CREATE OR REPLACE FUNCTION check_post_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.post_images
    WHERE post_id = NEW.post_id
      AND deleted_at IS NULL
  ) >= 4 THEN
    RAISE EXCEPTION 'Posts can have maximum 4 images';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for image limit
DROP TRIGGER IF EXISTS post_images_limit_trigger ON public.post_images;
CREATE TRIGGER post_images_limit_trigger
  BEFORE INSERT ON public.post_images
  FOR EACH ROW
  EXECUTE FUNCTION check_post_image_limit();

-- Ensure display_order is within valid range (0-3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'post_images_display_order_check'
      AND conrelid = 'public.post_images'::regclass
  ) THEN
    ALTER TABLE public.post_images
    ADD CONSTRAINT post_images_display_order_check
    CHECK (display_order >= 0 AND display_order <= 3);
  END IF;
END $$;

-- Ensure unique display_order per post (among active images)
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_images_unique_order
  ON public.post_images(post_id, display_order)
  WHERE deleted_at IS NULL;

-- ========== POST IMAGES INDEXES ==========

-- Primary lookup: get images for a post
CREATE INDEX IF NOT EXISTS idx_post_images_post_order
  ON public.post_images(post_id, display_order ASC)
  WHERE deleted_at IS NULL;

-- Storage path lookup (for cleanup operations)
CREATE INDEX IF NOT EXISTS idx_post_images_storage_path
  ON public.post_images(storage_path)
  WHERE deleted_at IS NULL;

-- Created date lookup
CREATE INDEX IF NOT EXISTS idx_post_images_created
  ON public.post_images(created_at DESC)
  WHERE deleted_at IS NULL;

-- ========== POST IMAGES RLS POLICIES ==========

-- Enable RLS
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Users can view images for posts they can see
CREATE POLICY "Users can view images for visible posts"
ON public.post_images
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

-- Users can insert images for their own posts
CREATE POLICY "Users can insert images for own posts"
ON public.post_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.author_id = auth.uid()
      AND p.deleted_at IS NULL
  )
);

-- Users can update their own post images
CREATE POLICY "Users can update own post images"
ON public.post_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.author_id = auth.uid()
      AND p.deleted_at IS NULL
  )
);

-- Users can delete their own post images
CREATE POLICY "Users can delete own post images"
ON public.post_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.author_id = auth.uid()
      AND p.deleted_at IS NULL
  )
);

-- ========== UPDATED_AT TRIGGER ==========

-- Ensure set_updated_at function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_images_set_updated_at ON public.post_images;
CREATE TRIGGER post_images_set_updated_at
  BEFORE UPDATE ON public.post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ========== HELPER FUNCTIONS ==========

-- Function to get image URLs for a post (with proper ordering)
CREATE OR REPLACE FUNCTION get_post_image_urls(p_post_id uuid)
RETURNS text[] AS $$
DECLARE
  base_url text;
  bucket_name text;
  result text[];
BEGIN
  -- Get configuration (these should match your environment variables)
  SELECT current_setting('app.storage_base_url', true) INTO base_url;
  SELECT current_setting('app.storage_bucket', true) INTO bucket_name;
  
  -- Fallback values if settings not configured
  IF base_url IS NULL OR base_url = '' THEN
    base_url := 'https://your-project.supabase.co/storage/v1/object/public';
  END IF;
  
  IF bucket_name IS NULL OR bucket_name = '' THEN
    bucket_name := 'posts-images';
  END IF;
  
  -- Build URLs array
  SELECT array_agg(base_url || '/' || bucket_name || '/' || storage_path ORDER BY display_order)
  INTO result
  FROM public.post_images
  WHERE post_id = p_post_id
    AND deleted_at IS NULL;
  
  RETURN COALESCE(result, ARRAY[]::text[]);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Function to soft delete images and clean up storage
CREATE OR REPLACE FUNCTION soft_delete_post_images(p_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.post_images
  SET deleted_at = now()
  WHERE post_id = p_post_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ========== UPDATE POSTS TABLE CONSTRAINTS ==========

-- Remove any existing image-related constraints from posts table
DO $$
BEGIN
  -- Remove old constraint if exists
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_nonempty_content_or_media'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_nonempty_content_or_media;
  END IF;
  
  -- Remove image_paths column if it exists (from previous attempts)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'image_paths'
  ) THEN
    ALTER TABLE public.posts DROP COLUMN image_paths;
  END IF;
END$$;

-- Add simple content validation (images are now optional via post_images table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'posts_nonempty_content'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_nonempty_content
    CHECK (trim(coalesce(content, '')) <> '');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, skip
    NULL;
END$$;

COMMIT;

-- ========== POST-MIGRATION SETUP INSTRUCTIONS ==========

-- After running this migration, complete the setup:

-- 1. Set environment variables in your .env.local:
-- NEXT_PUBLIC_STORAGE_BASE_URL=https://your-project-id.supabase.co/storage/v1/object/public
-- SUPABASE_STORAGE_BUCKET=posts-images

-- 2. Verify bucket creation in Supabase Dashboard:
-- Go to Storage → Buckets → posts-images should exist and be Public

-- 3. Test image upload:
-- Try uploading an image through the application

-- 4. File organization:
-- Images are stored as: posts-images/posts/{user_id}/{timestamp}-{index}.{ext}
-- Example: posts-images/posts/12345678-1234-1234-1234-123456789012/1724486400000-0.jpg

-- 5. Database structure:
-- posts table: Contains post content and metadata
-- post_images table: Contains image metadata and storage paths
-- Relationship: posts.id → post_images.post_id (1:many, max 4)

SELECT 'Image upload system setup completed successfully!' as result;