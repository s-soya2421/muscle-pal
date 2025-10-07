# MusclePal

Next.js 15 と Supabase を組み合わせたフィットネスコミュニティアプリの検証用リポジトリです。SSR（App Router）を前提に、認証・投稿・チャレンジ・バッジなどの機能を Supabase の Postgres/Storage/RLS 上で試作しています。

## アーキテクチャ概要

- Next.js App Router（サーバーコンポーネント + Server Actions）
- Supabase Auth / Row Level Security / Storage
- Tailwind CSS + shadcn/ui（Radix ベースの UI コンポーネント）
- Jest + React Testing Library によるユニットテスト

主要フォルダ構成:

```
├─ app/                     # Next.js ルート（旧 template ブランチ用の初期ファイル）
├─ src/
│  ├─ app/                 # 実装中の画面（ダッシュボード・チャレンジ等）
│  ├─ components/          # 再利用 UI
│  ├─ contexts/            # AuthContext などのクライアント側状態
│  ├─ lib/                 # Supabase クライアント、サービス層、ユーティリティ
│  ├─ types/               # Supabase 生成型と独自型
│  └─ __tests__/           # Jest テスト
├─ supabase/               # CLI 用設定・マイグレーション・シード
├─ __docs__/               # 要件定義や設計メモ
└─ docker/                 # ローカル Docker 起動用の補助スクリプト
```

## セットアップ（Supabase CLI）

1. 依存インストール

   ```bash
   npm install
   ```

2. Supabase CLI を起動（モック環境）

   ```bash
   npm run supabase:start
   npm run supabase:reset   # マイグレーション + シード投入
   ```

3. アプリ起動

   ```bash
   npm run dev
   ```

4. 動作確認

   - http://localhost:3000 からアクセス
   - 開発用アカウント: `dev@example.com` / `password123`（ローカル専用ダミー。公開運用では必ず削除・無効化してください）

### 環境変数について

- `.env.local` はコミット対象外です。`NEXT_PUBLIC_SUPABASE_URL` や `NEXT_PUBLIC_SUPABASE_ANON_KEY` などは各自のローカルで設定してください。
- `docker-compose.yml` / `docker-compose.dev.yml` の環境変数は `${VAR:-dev-placeholder}` 形式でダミー値を埋めています。実際のプロジェクトでは `.env.docker`（`docker compose --env-file`）やホスト側の環境変数で `POSTGRES_PASSWORD` / `JWT_SECRET` / `SUPABASE_SERVICE_KEY` などを上書きしてください。

## テスト / 品質チェック

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript 型チェック
npm test            # Jest
```

CI（`.github/workflows/ci.yml`）では Linux/Node 18,20 のマトリクスで lint/typecheck/build/test を実行しています。CodeQL ワークフローも有効です。

## ブランチメモ

- `main` : 現行実装ライン（このブランチ）
- `demo` : Supabase に接続しないデモモード向け設定
- `feature/*`, `add-*` : 機能検証用。テストやドキュメントが増えているので、必要に応じて参照してください。

`master` ブランチは create-next-app の初期テンプレートを残してあります（互換性確認用途）。実装確認は `main` 側の `src/` ディレクトリを参照してください。

## 参考ドキュメント

- `AGENTS.md` : セットアップやチーム運用のメモ
- `QUICK_SETUP.md` : 画像アップロード機能の手順
- `__docs__/requirements/01-project-overview.md` : 要件定義概要

開発メモや設計資料は `__docs__` 配下に順次追記しています。詳細仕様や補足が必要な場合はそちらを確認してください。
