// Client-side image validation and utility functions
import { createClient } from '@/lib/supabase/client';
import { buildStoragePublicUrl } from './storage-url';

export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  MAX_COUNT: 4,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  BUCKET_NAME: process.env.SUPABASE_STORAGE_BUCKET || 'posts-images',
} as const;

export interface ImageUploadError {
  type: 'size' | 'type' | 'count' | 'upload';
  message: string;
}

/**
 * クライアントサイドでの画像バリデーション
 */
export function validateImages(files: File[]): ImageUploadError | null {
  if (files.length > IMAGE_CONFIG.MAX_COUNT) {
    return {
      type: 'count',
      message: `画像は最大${IMAGE_CONFIG.MAX_COUNT}枚までアップロードできます`,
    };
  }

  for (const file of files) {
    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      return {
        type: 'size',
        message: `画像サイズは${IMAGE_CONFIG.MAX_SIZE / (1024 * 1024)}MB以下にしてください`,
      };
    }

    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as typeof IMAGE_CONFIG.ALLOWED_TYPES[number])) {
      return {
        type: 'type',
        message: 'JPEG, PNG, WebP形式の画像のみアップロードできます',
      };
    }
  }

  return null;
}

/**
 * Supabaseのストレージパスから正しいpublic URLを生成する
 */
export function getImageUrl(storagePath: string): string {
  const supabase = createClient();
  return buildStoragePublicUrl(storagePath, IMAGE_CONFIG.BUCKET_NAME, supabase);
}

/**
 * 画像URLからストレージパスを取得する（既存データ用）
 */
export function getStoragePathFromUrl(imageUrl: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  const bucketName = IMAGE_CONFIG.BUCKET_NAME;
  
  if (!baseUrl || !imageUrl.includes(baseUrl)) {
    return imageUrl; // 外部URLの場合はそのまま返す
  }

  return imageUrl.replace(`${baseUrl}/${bucketName}/`, '');
}
