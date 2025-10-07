import type { SupabaseClient } from '@supabase/supabase-js';

export const STORAGE_PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik02MCA3MEg4MFY5MEg2MFY3MFpNMTAwIDcwSDEyMFY5MEgxMDBWNzBaTTEwMCAxMTBIMTIwVjEzMEgxMDBWMTEwWk02MCA5MEg4MFYxMTBINjBWOTBaTTgwIDEzMEgxNDBWMTUwSDgwVjEzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';

export function buildStoragePublicUrl(
  storagePath: string,
  bucketName: string,
  supabase?: SupabaseClient
): string {
  if (!storagePath) {
    return STORAGE_PLACEHOLDER_IMAGE;
  }

  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL?.replace(/\/$/, '');
  if (baseUrl) {
    return `${baseUrl}/${bucketName}/${storagePath}`;
  }

  if (!supabase) {
    return STORAGE_PLACEHOLDER_IMAGE;
  }

  try {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    return data?.publicUrl ?? STORAGE_PLACEHOLDER_IMAGE;
  } catch (error) {
    console.error('画像URL生成エラー:', error);
    return STORAGE_PLACEHOLDER_IMAGE;
  }
}
