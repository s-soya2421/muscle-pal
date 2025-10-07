// Server-side functions for post images management using intermediate table
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { IMAGE_CONFIG } from './image-upload-client';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik02MCA3MEg4MFY5MEg2MFY3MFpNMTAwIDcwSDEyMFY5MEgxMDBWNzBaTTEwMCAxMTBIMTIwVjEzMEgxMDBWMTEwWk02MCA5MEg4MFYxMTBINjBWOTBaTTgwIDEzMEgxNDBWMTUwSDgwVjEzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';

function resolvePublicUrl(storagePath: string, supabase: SupabaseClient): string {
  if (!storagePath) {
    return PLACEHOLDER_IMAGE;
  }

  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL?.replace(/\/$/, '');
  if (baseUrl) {
    return `${baseUrl}/${IMAGE_CONFIG.BUCKET_NAME}/${storagePath}`;
  }

  const { data } = supabase.storage
    .from(IMAGE_CONFIG.BUCKET_NAME)
    .getPublicUrl(storagePath);

  if (!data?.publicUrl) {
    console.error('画像URL生成エラー: publicUrl が取得できませんでした');
    return PLACEHOLDER_IMAGE;
  }

  return data.publicUrl;
}

export interface PostImageData {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  alt_text?: string | null;
  display_order: number;
  url: string; // Generated URL for display
}

export interface UploadedPostImage {
  id: string;
  storage_path: string;
  url: string;
  display_order: number;
}

/**
 * Upload images and save metadata to post_images table
 */
export async function uploadPostImages(
  files: File[], 
  postId: string, 
  userId: string
): Promise<UploadedPostImage[]> {
  if (files.length > IMAGE_CONFIG.MAX_COUNT) {
    throw new Error(`最大${IMAGE_CONFIG.MAX_COUNT}枚までの画像をアップロードできます`);
  }

  const supabase = await createClient();
  const uploadedImages: UploadedPostImage[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${i}.${fileExt}`;
    const storagePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      console.error('画像アップロードエラー:', storageError);
      throw new Error(`画像のアップロードに失敗しました: ${storageError.message}`);
    }

    // Save metadata to post_images table
    const { data: imageData, error: dbError } = await supabase
      .from('post_images')
      .insert({
        post_id: postId,
        storage_path: storageData.path,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        display_order: i,
        alt_text: null, // Can be added later
      })
      .select('id, storage_path, display_order')
      .single();

    if (dbError) {
      console.error('画像メタデータ保存エラー:', dbError);
      // Try to clean up uploaded file
      await supabase.storage
        .from(IMAGE_CONFIG.BUCKET_NAME)
        .remove([storageData.path]);
      throw new Error(`画像メタデータの保存に失敗しました: ${dbError.message}`);
    }

    uploadedImages.push({
      id: imageData.id,
      storage_path: imageData.storage_path,
      url: resolvePublicUrl(imageData.storage_path, supabase),
      display_order: imageData.display_order,
    });
  }

  return uploadedImages;
}

/**
 * Get images for a specific post
 */
export async function getPostImages(postId: string): Promise<PostImageData[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('post_images')
    .select('*')
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('投稿画像取得エラー:', error);
    throw new Error('画像の取得に失敗しました');
  }

  const result: PostImageData[] = [];
  for (const img of data ?? []) {
    result.push({
      ...img,
      url: resolvePublicUrl(img.storage_path, supabase),
    });
  }
  return result;
}

/**
 * Delete images for a post (soft delete)
 */
export async function deletePostImages(postId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('post_images')
    .update({ deleted_at: new Date().toISOString() })
    .eq('post_id', postId)
    .is('deleted_at', null);

  if (error) {
    console.error('画像削除エラー:', error);
    // Don't throw error for deletion failures
  }
}

/**
 * Delete specific image by ID
 */
export async function deletePostImageById(imageId: string): Promise<void> {
  const supabase = await createClient();
  
  // Get image info first for storage cleanup
  const { data: imageData } = await supabase
    .from('post_images')
    .select('storage_path')
    .eq('id', imageId)
    .is('deleted_at', null)
    .single();

  // Soft delete in database
  const { error: dbError } = await supabase
    .from('post_images')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', imageId);

  if (dbError) {
    console.error('画像削除エラー:', dbError);
    throw new Error('画像の削除に失敗しました');
  }

  // Clean up storage (best effort)
  if (imageData?.storage_path) {
    await supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .remove([imageData.storage_path]);
  }
}

/**
 * Update image metadata (alt text, display order, etc.)
 */
export async function updatePostImage(
  imageId: string, 
  updates: Partial<Pick<PostImageData, 'alt_text' | 'display_order'>>
): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('post_images')
    .update(updates)
    .eq('id', imageId)
    .is('deleted_at', null);

  if (error) {
    console.error('画像更新エラー:', error);
    throw new Error('画像の更新に失敗しました');
  }
}

/**
 * Get image URLs for a post (helper function for backward compatibility)
 */
export async function getPostImageUrls(postId: string): Promise<string[]> {
  const images = await getPostImages(postId);
  return images.map(img => img.url);
}
