import { getImageUrl } from './image-upload-client';

interface PostImage {
  id: string;
  storage_path: string;
  display_order: number;
  alt_text?: string;
}

/**
 * 画像パス配列からURL配列に変換する（後方互換性）
 */
export function convertImagePathsToUrls(imagePaths: string[] | null): string[] {
  if (!imagePaths || !Array.isArray(imagePaths)) {
    return [];
  }
  
  return imagePaths.map(path => getImageUrl(path));
}

/**
 * レガシー画像データ（URL配列）を処理する
 */
export function processLegacyImages(images: unknown): string[] {
  if (!images) {
    return [];
  }
  
  // 新しい形式（string[]）の場合
  if (Array.isArray(images) && typeof images[0] === 'string') {
    return convertImagePathsToUrls(images);
  }
  
  // 旧形式（{url: string, alt?: string}[]）の場合
  if (Array.isArray(images) && images[0]?.url) {
    return images.map((img: { url: string }) => img.url);
  }
  
  return [];
}

/**
 * 投稿データの画像を処理して統一されたURL配列を返す
 */
export function getPostImageUrls(post: unknown): string[] {
  if (!post || typeof post !== 'object') {
    return [];
  }
  
  const postObj = post as Record<string, unknown>;
  
  // 中間テーブルのpost_imagesフィールドを優先
  if (postObj.post_images && Array.isArray(postObj.post_images) && postObj.post_images.length > 0) {
    return (postObj.post_images as PostImage[])
      .sort((a: PostImage, b: PostImage) => a.display_order - b.display_order)
      .map((img: PostImage) => getImageUrl(img.storage_path));
  }
  
  // 旧image_pathsフィールドをフォールバック
  if (postObj.image_paths) {
    return convertImagePathsToUrls(postObj.image_paths as string[]);
  }
  
  // imagesフィールドの処理
  if (postObj.images) {
    // モックデータ用の文字列配列（フルURL）をチェック
    if (Array.isArray(postObj.images) && postObj.images.length > 0 && typeof postObj.images[0] === 'string') {
      // フルURLかどうかを判定
      if ((postObj.images[0] as string).startsWith('http')) {
        return postObj.images as string[]; // フルURLなのでそのまま返す
      }
    }
    // レガシー形式として処理
    return processLegacyImages(postObj.images);
  }
  
  return [];
}