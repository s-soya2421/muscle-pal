// Server-side image upload functions
import { createClient } from '@/lib/supabase/server';
import { IMAGE_CONFIG, getImageUrl } from './image-upload-client';

export interface UploadedImage {
  path: string;
  url: string;
}

/**
 * Supabase Storageに画像をアップロードする（サーバー側専用）
 */
export async function uploadImages(files: File[], userId: string): Promise<UploadedImage[]> {
  const supabase = await createClient();
  const uploadedImages: UploadedImage[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { data, error } = await supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('画像アップロードエラー:', error);
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }

    uploadedImages.push({
      path: data.path,
      url: getImageUrl(data.path),
    });
  }

  return uploadedImages;
}

/**
 * 画像を削除する（サーバー側専用）
 */
export async function deleteImages(storagePaths: string[]): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase.storage
    .from(IMAGE_CONFIG.BUCKET_NAME)
    .remove(storagePaths);

  if (error) {
    console.error('画像削除エラー:', error);
    // 削除エラーは警告にとどめる（投稿作成は継続）
  }
}