# 画像アップロード機能セットアップガイド

このガイドでは、MusclePal の画像アップロード機能をセットアップする手順を説明します。

## 📋 前提条件

- Supabase プロジェクトが作成済み
- 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定済み
- Supabase CLI または Supabase Dashboard へのアクセス権限

## 🚀 セットアップ手順

### 1. マイグレーションの実行

**1つのマイグレーションファイルで全て完了**します：

```bash
# Supabase CLI を使用する場合
supabase db push

# または Supabase Dashboard で SQL エディタから実行
# 20250824000001_complete_image_system_setup.sql
```

このマイグレーションで以下が一括実行されます：
- ✅ Supabase Storage バケット `posts-images` 作成
- ✅ ストレージポリシー設定（セキュリティ）
- ✅ `post_images` 中間テーブル作成
- ✅ インデックス・制約・RLS設定
- ✅ ヘルパー関数作成
- ✅ 旧システムのクリーンアップ

### 2. 環境変数の設定

`.env.local` ファイルに以下の環境変数を追加：

```bash
# Storage Configuration
NEXT_PUBLIC_STORAGE_BASE_URL=https://your-project-id.supabase.co/storage/v1/object/public
SUPABASE_STORAGE_BUCKET=posts-images
```

**注意**: `your-project-id` を実際の Supabase プロジェクト ID に置き換えてください。

### 3. Supabase Storage の確認

#### 3.1 Dashboard での確認

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. **Storage** → **Buckets** に移動
4. `posts-images` バケットが作成されていることを確認
5. **Settings** でバケットが **Public** に設定されていることを確認

#### 3.2 テストアップロード

Dashboard からテストファイルをアップロードして動作確認：

1. `posts-images` バケットを開く
2. **Upload file** でテスト画像をアップロード
3. アップロードされたファイルの **Copy URL** で URL を取得
4. ブラウザで URL にアクセスして画像が表示されることを確認

### 4. アプリケーションのテスト

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. `/posts/new` にアクセス
3. 画像付き投稿を作成してテスト
4. 画像が正しく表示されることを確認

## 🛠️ アーキテクチャ概要

### データベース構造

```
posts                     post_images
├── id (PK)              ├── id (PK)
├── author_id            ├── post_id (FK → posts.id)
├── content              ├── storage_path
├── created_at           ├── original_filename
└── ...                  ├── mime_type
                         ├── file_size
                         ├── display_order
                         └── created_at
```

### Storage 構造

```
posts-images/
└── posts/
    └── {user_id}/
        ├── {timestamp}-0.jpg
        ├── {timestamp}-1.jpg
        └── ...
```

### URL 生成方式

```
Base URL: https://project.supabase.co/storage/v1/object/public
Bucket:   posts-images
Path:     posts/user123/1724486400000-0.jpg
→ Full URL: https://project.supabase.co/storage/v1/object/public/posts-images/posts/user123/1724486400000-0.jpg
```

## 📁 ファイル構成

### 新規作成されたファイル

```
src/lib/
├── image-upload-client.ts    # クライアント側画像バリデーション
├── image-upload-server.ts    # サーバー側アップロード（レガシー）
├── post-images-server.ts     # 中間テーブル対応アップロード
└── image-utils.ts            # 画像URL生成・表示ユーティリティ

supabase/migrations/
├── 20250824000001_add_image_paths_to_posts.sql
├── 20250824000002_create_storage_bucket.sql
├── 20250824000003_create_post_images_table.sql
└── 20250824000004_remove_image_paths_from_posts.sql
```

### 更新されたファイル

```
src/app/actions/posts.ts              # 投稿作成・取得ロジック
src/app/posts/_components/            # 画像表示コンポーネント
├── create-post-form.tsx
├── post-card.tsx
└── post-image-gallery.tsx
.env.local.example                    # 環境変数例
```

## 🔧 設定詳細

### 画像制限

- **最大ファイルサイズ**: 5MB
- **最大枚数**: 4枚/投稿
- **対応形式**: JPEG, PNG, WebP
- **バリデーション**: クライアント側 + データベース側

### セキュリティ

- **アップロード**: 認証済みユーザーのみ、自分のフォルダのみ
- **読み取り**: パブリック（投稿の可視性に従う）
- **削除**: 自分のファイルのみ
- **RLS**: post_images テーブルで投稿可視性を継承

## 🚨 トラブルシューティング

### よくある問題

1. **バケットが見つからない**
   ```
   Error: Bucket 'posts-images' not found
   ```
   → マイグレーション `20250824000002` を実行

2. **アップロード権限エラー**
   ```
   Error: Upload permission denied
   ```
   → ユーザーがログインしているか確認
   → Storage ポリシーが正しく設定されているか確認

3. **画像が表示されない**
   ```
   Error: Image failed to load
   ```
   → `NEXT_PUBLIC_STORAGE_BASE_URL` が正しく設定されているか確認
   → バケットが Public に設定されているか確認

### デバッグ用 SQL

```sql
-- アップロードされた画像の確認
SELECT 
  p.id as post_id,
  p.content,
  pi.storage_path,
  pi.original_filename,
  pi.display_order
FROM posts p
LEFT JOIN post_images pi ON p.id = pi.post_id
WHERE p.author_id = 'your-user-id'
ORDER BY p.created_at DESC, pi.display_order;

-- Storage ポリシーの確認
SELECT * FROM storage.buckets WHERE name = 'posts-images';
SELECT * FROM storage.policies WHERE bucket_id = 'posts-images';
```

## 🔄 CDN 移行対応

将来的に CDN を変更する場合：

1. 新しい CDN の Base URL を環境変数で更新
2. アプリケーションの再起動のみで完了
3. データベースの変更は不要

```bash
# 例: Cloudflare R2 への移行
NEXT_PUBLIC_STORAGE_BASE_URL=https://your-domain.r2.cloudflarestorage.com/posts-images
```

## 📞 サポート

問題が解決しない場合：

1. Supabase Dashboard の **Logs** で詳細なエラーを確認
2. ブラウザの開発者ツールでネットワークエラーを確認
3. サーバーログで画像アップロードのエラーを確認

---

**最終更新**: 2025-08-24  
**バージョン**: 1.0  
**対応状況**: ✅ 実装完了 / テスト待ち