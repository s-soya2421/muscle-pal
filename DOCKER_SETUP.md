# MusclePal - Docker環境セットアップガイド

## 📋 前提条件

### 1. Docker Desktop のインストール

1. **Docker Desktop for Windows**をダウンロード・インストール
   - 公式サイト: https://docs.docker.com/desktop/install/windows-install/

2. **WSL 2統合を有効化**
   - Docker Desktop起動後、**Settings > Resources > WSL Integration**を開く
   - 使用しているWSL2ディストリビューションを有効化

3. **Docker動作確認**
   ```bash
   docker --version
   docker-compose --version
   ```

## 🚀 Docker環境セットアップ（推奨）

### 1. 設定確認
プロジェクトには以下のDocker設定が用意されています：
- ✅ `docker-compose.yml` - 本番環境用設定
- ✅ `docker-compose.dev.yml` - 開発環境用設定
- ✅ `Dockerfile` - Next.jsアプリケーション用（本番）
- ✅ `Dockerfile.dev` - Next.jsアプリケーション用（開発）
- ✅ `docker/kong.yml` - API Gateway設定
- ✅ `docker/init-db.sql` - データベース初期化スクリプト
- ✅ `.env.docker` - Docker用環境変数設定

### 2. 簡単セットアップ（推奨）
```bash
# 自動セットアップスクリプトを実行（開発環境）
./scripts/docker-setup.sh dev

# または本番環境
./scripts/docker-setup.sh
```

### 3. 手動セットアップ

#### 3.1 開発環境
```bash
# 開発環境用コンテナ起動（ホットリロード対応）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# アプリケーションアクセス: http://localhost:3000
```

#### 3.2 本番環境
```bash
# 本番環境用コンテナ起動
docker-compose up --build -d

# アプリケーションアクセス: http://localhost:3001
```

### 4. サービス管理
```bash
# ログ確認
docker-compose logs -f

# 特定のサービスのログ確認
docker-compose logs -f app

# サービス停止
docker-compose down

# ボリュームも削除して完全リセット
docker-compose down -v

# サービス再起動
docker-compose restart
```

## 🚀 Supabase CLI環境セットアップ（代替方法）

### 1. 設定確認
プロジェクトには既に以下が設定済み：
- ✅ `supabase/config.toml` - Supabase設定ファイル
- ✅ `supabase/migrations/` - データベースマイグレーションファイル
- ✅ `package.json` - npm スクリプト

### 2. Supabaseサービス起動
```bash
# Supabaseローカル環境を起動
npm run supabase:start

# または直接コマンド
npx supabase start
```

### 3. サービス状態確認
```bash
# サービス状態確認
npm run supabase:status

# または直接コマンド
npx supabase status
```

### 4. データベースリセット（必要に応じて）
```bash
# データベースをリセットしてマイグレーションを再実行
npm run supabase:reset

# または直接コマンド
npx supabase db reset
```

### 5. Supabaseサービス停止
```bash
# Supabaseローカル環境を停止
npm run supabase:stop

# または直接コマンド
npx supabase stop
```

## 🌐 アクセス先

### Docker環境の場合：
- **Next.js App (開発)**: http://localhost:3000
- **Next.js App (本番)**: http://localhost:3001
- **Supabase API Gateway**: http://localhost:8000
- **Supabase Studio**: http://localhost:54323
- **Inbucket (Email)**: http://localhost:54324
- **PostgreSQL**: localhost:54322

### Supabase CLI環境の場合：
- **Supabase Studio**: http://127.0.0.1:54323
- **API Gateway**: http://127.0.0.1:54321
- **PostgreSQL**: localhost:54322
- **Inbucket (Email)**: http://127.0.0.1:54324

## 🔧 ポート設定

### Docker環境のポート：

| サービス | ポート | 用途 |
|----------|--------|------|
| Next.js (開発) | 3000 | アプリケーション |
| Next.js (本番) | 3001 | アプリケーション |
| Kong API Gateway | 8000 | Supabase API |
| GoTrue (Auth) | 9999 | 認証サービス |
| PostgREST | 3000 (内部) | REST API |
| Realtime | 4000 | リアルタイム機能 |
| Storage | 5000 | ファイルストレージ |
| PostgreSQL | 54322 | データベース |
| Supabase Studio | 54323 | 管理画面 |
| Inbucket | 54324 | メール確認 |

### Supabase CLI環境のポート：

| サービス | ポート | 用途 |
|----------|--------|------|
| API Gateway | 54321 | REST API / GraphQL |
| PostgreSQL | 54322 | データベース接続 |
| Supabase Studio | 54323 | 管理画面 |
| Inbucket | 54324 | メール確認 |

## 🚨 トラブルシューティング

### Docker関連エラー
```bash
# エラー例: Cannot connect to the Docker daemon
# 解決方法:
# 1. Docker Desktop が起動していることを確認
# 2. WSL 2統合が有効になっていることを確認
```

### ポート競合エラー
```bash
# エラー例: Port 54321 is already in use
# 解決方法:
# 1. 既存のプロセスを停止
npx supabase stop

# 2. または別のプロセスを確認・停止
lsof -i :54321
```

### マイグレーションエラー
```bash
# マイグレーション適用に失敗した場合
# 1. データベースをリセット
npx supabase db reset

# 2. 手動でマイグレーション確認
npx supabase db diff
```

## 🚀 自動マイグレーション機能

### 環境変数による制御

プロジェクトでは、Docker起動時に自動でデータベースマイグレーションを実行できます。

#### 設定方法

`.env.local` または環境変数で制御：

```bash
# 自動マイグレーション有効化
AUTO_MIGRATE=true

# マイグレーションを完全スキップ
SKIP_MIGRATION=true
```

#### 使用例

**初回セットアップ時（マイグレーション自動実行）**
```bash
# 環境変数設定
export AUTO_MIGRATE=true

# Docker起動（マイグレーションサービスも起動）
docker-compose --profile migration up --build -d

# または開発環境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile migration up --build -d
```

**通常起動時（マイグレーションなし）**
```bash
# デフォルト設定のままDocker起動
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

**マイグレーション状況確認**
```bash
# マイグレーション完了の確認
ls -la .docker-migration-completed

# Supabase状態確認
docker exec -it muscle-pal-app npx supabase status
```

#### マイグレーション処理の詳細

1. `scripts/init-migrations.sh`が実行されます
2. 必要なサービス（PostgreSQL、Auth）の起動を待機
3. `AUTO_MIGRATE=true`の場合、`npx supabase db reset --local`を実行
4. 完了後、`.docker-migration-completed`フラグファイルを作成

## 💡 開発フロー

### Docker環境（推奨）

1. **Docker Desktop起動確認**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **初回セットアップ（自動マイグレーション付き）**
   ```bash
   export AUTO_MIGRATE=true
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile migration up --build -d
   ```

3. **通常の開発開始**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
   ```

4. **開発中のアクセス**
   - アプリ: http://localhost:3002 (開発環境)
   - Supabase Studio: http://localhost:54323

5. **開発完了後は停止**
   ```bash
   docker-compose down
   ```

### Supabase CLI環境（代替方法）

1. **Docker Desktop起動確認**
   ```bash
   docker --version
   ```

2. **Supabase起動**
   ```bash
   npm run supabase:start
   ```

3. **Next.js開発サーバー起動**
   ```bash
   npm run dev
   ```

4. **開発完了後は停止**
   ```bash
   npm run supabase:stop
   ```

## 📝 環境変数設定

`.env.local` でローカル/本番環境の切り替えが可能：

```bash
# ローカル開発時（デフォルト設定済み）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 本番環境に切り替える場合はコメントアウトを変更
```

---

**Last Updated**: 2025-08-31  
**Status**: Docker Desktop インストール後に実行可能