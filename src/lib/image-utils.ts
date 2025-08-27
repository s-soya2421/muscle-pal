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
export function processLegacyImages(images: any): string[] {
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
export function getPostImageUrls(post: any): string[] {
  if (!post) {
    return [];
  }
  
  // 中間テーブルのpost_imagesフィールドを優先
  if (post.post_images && Array.isArray(post.post_images) && post.post_images.length > 0) {
    return post.post_images
      .sort((a: PostImage, b: PostImage) => a.display_order - b.display_order)
      .map((img: PostImage) => getImageUrl(img.storage_path));
  }
  
  // 旧image_pathsフィールドをフォールバック
  if (post.image_paths) {
    return convertImagePathsToUrls(post.image_paths);
  }
  
  // imagesフィールドの処理
  if (post.images) {
    // モックデータ用の文字列配列（フルURL）をチェック
    if (Array.isArray(post.images) && post.images.length > 0 && typeof post.images[0] === 'string') {
      // フルURLかどうかを判定
      if (post.images[0].startsWith('http')) {
        return post.images; // フルURLなのでそのまま返す
      }
    }
    // レガシー形式として処理
    return processLegacyImages(post.images);
  }
  
  return [];
}