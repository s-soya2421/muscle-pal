// Server-side functions for post images management using intermediate table
import { createClient } from '@/lib/supabase/server';
import { IMAGE_CONFIG, getImageUrl } from './image-upload-client';

export interface PostImageData {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  alt_text?: string;
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
      url: getImageUrl(imageData.storage_path),
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

  return (data || []).map(img => ({
    ...img,
    url: getImageUrl(img.storage_path),
  }));
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