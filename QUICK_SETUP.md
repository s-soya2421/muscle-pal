# 🚀 画像アップロード機能 - クイックセットアップ

## 📋 必要なもの
- Supabase プロジェクト
- Supabase CLI または Dashboard アクセス

## ⚡ 3ステップで完了

### 1️⃣ マイグレーション実行
```bash
# Supabase CLI
supabase db push

# または Dashboard の SQL Editor で実行
# supabase/migrations/20250824000001_complete_image_system_setup.sql
```

### 2️⃣ 環境変数設定
`.env.local` に追加：
```bash
NEXT_PUBLIC_STORAGE_BASE_URL=https://your-project-id.supabase.co/storage/v1/object/public
SUPABASE_STORAGE_BUCKET=posts-images
```
※ `your-project-id` を実際のプロジェクトIDに変更

### 3️⃣ 動作確認
```bash
npm run dev
```
- `/posts/new` で画像付き投稿をテスト
- 画像が正しく表示されることを確認

## ✅ 完了！

**実装された機能**：
- 🖼️ 画像アップロード（最大4枚、5MB以下）
- 🔒 セキュアなストレージ（ユーザー別フォルダ）
- 📱 レスポンシブ画像ギャラリー
- 🌐 CDN移行対応（環境変数で切り替え可能）
- 🗃️ 中間テーブルで柔軟な画像管理

## 🔧 トラブルシューティング

**問題**: アップロードできない
**解決**: Dashboard > Storage で `posts-images` バケットが作成され、Public 設定になっているか確認

**問題**: 画像が表示されない  
**解決**: `NEXT_PUBLIC_STORAGE_BASE_URL` が正しいプロジェクトURLか確認

---
詳細は `__docs__/SETUP_IMAGE_STORAGE.md` を参照