// Client-side image validation and utility functions
import { createClient } from '@/lib/supabase/client';

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
  
  try {
    const { data } = supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('画像URL生成エラー:', error);
    // プレースホルダー画像を返す
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik02MCA3MEg4MFY5MEg2MFY3MFpNMTAwIDcwSDEyMFY5MEgxMDBWNzBaTTEwMCAxMTBIMTIwVjEzMEgxMDBWMTEwWk02MCA5MEg4MFYxMTBINjBWOTBaTTgwIDEzMEgxNDBWMTUwSDgwVjEzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
  }
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