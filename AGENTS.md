# AGENTS.md

## プロジェクト概要
- Next.js App Router (Next 15) と Supabase を組み合わせた SSR フィットネスコミュニティアプリです。
- 認証・データ永続化は Supabase、画像ストレージも Supabase Storage を利用します。
- リポジトリは単一アプリ構成ですが、`supabase/` にマイグレーションやシード、`__docs__/` にドキュメントを配置しています。インフラ関連の設定は別リポジトリ管理で、このリポジトリでは扱いません。

## セットアップ & ビルド
- 依存インストール: `npm install`
- 開発サーバー: `npm run dev` (Turbopack 有効 / ポート 3000)
- 本番ビルド: `npm run build`
- SSR プレビュー: `npm run start`
- 型チェック: `npm run typecheck`
- Lint: `npm run lint`
- 単体テスト: `npm run test`
- CI 用テスト+カバレッジ: `npm run test:ci`
- Supabase ローカル起動: `npm run supabase:start`
- Supabase リセット: `npm run supabase:reset`

## リポジトリ構成
- `src/app/` … App Router 配下のページ、サーバーコンポーネント、Server Action。
- `src/components/` … 再利用 UI（shadcn-ui ベース）、フォーム、プロフィールなど。
- `src/contexts/` … クライアントサイドの Context（`AuthContext` など）。
- `src/lib/` … Supabase クライアント、サービスレイヤー、ユーティリティ。
- `src/types/` … Supabase 生成型・アプリ独自の型定義。
- `supabase/` … マイグレーション、シード、ローカル開発用コンフィグ。
- `__docs__/` … プロジェクトノート、PR ガイドライン。
- `public/` … 静的アセット。

## コードスタイル
- TypeScript は `strict`。`noImplicitAny` 準拠、`any` は Supabase 型変換など最小限に限定。
- ESLint + Prettier（Next.js 推奨設定）。import はパスエイリアス `@/` を先頭にグループ化。
- UI は Tailwind CSS + shadcn-ui。基本はユーティリティクラスで調整し、ロジックはコンポーネント側へ寄せない。
- ファイル命名はコンポーネント=PascalCase、hooks/util=camelCase。

## テスト & CI
- テストは Jest + React Testing Library。サーバーコンポーネントは Node 環境、クライアントは jsdom 環境で実行。
- `npm run test` … 開発用。`npm run test -- --watch` でウォッチモード。
- `npm run test:ci` … カバレッジ出力 (`coverage/` 作成)。CI では `test:ci` → `typecheck` → `lint` → `build` の順に実行予定。
- Supabase Server Action など外部依存は jest.setup.js でポリフィル済み。追加でモックが必要な場合は `src/__tests__/` 配下に helper を置くこと。

## テスト クイックリファレンス
- 単一ファイル: `npm run test -- src/__tests__/app/login.test.tsx`
- スナップショット更新: `npm run test -- -u`
- カバレッジ確認: `npm run test:ci && npx coverage-report`（HTML 出力は `coverage/lcov-report/index.html`）
- Supabase 関連モックは `jest.mock('@/lib/supabase/server')` / `client` を利用。Server Action を直接 import するテストでは `global.Request` などが必要だが `jest.setup.js` で定義済み。

## 環境変数 & モック
- 実環境では `.env.local` に Supabase URL / ANON KEY、画像バケット情報などを設定。**テストでは実際のキーを使用しない**。
- テスト・ストーリーブック用には `SUPABASE_URL=__MOCK__`、`SUPABASE_ANON_KEY=__MOCK__` のようにダミー値を設定して下さい。
- `.env*` の読み書きは禁止。必要な場合はサンプルにコメントを追加する形で共有する。

## 共有ユーティリティ / Hooks
- Supabase クライアント: `src/lib/supabase/server.ts` / `client.ts`。
- 認証コンテキスト: `src/contexts/AuthContext.tsx`（`useAuth` hook を提供）。
- チャレンジ機能サービス: `src/lib/challenge-service.ts`、バッジ連携は `src/lib/badge-service.ts`。
- 画像処理: `src/lib/post-images-server.ts`、`src/lib/image-upload-client.ts`。
- 型は `src/types/supabase.ts` を基準に参照する。手入力の型は極力避ける。

## ルーティング / SSR の注意
- App Router でページはデフォルト Server Component。クライアントサイドで状態を持つ場合は `"use client"` を付与しフォルダを分ける。
- Server Action では Supabase を `createClient()` から取得し、呼び出し後は `revalidatePath` でキャッシュを無効化する方針。
- API レスポンスやメタ情報（`generateMetadata`）を触る場合はキャッシュ戦略 `revalidate` の変更を事前相談。

## Git / PR ルール
- ブランチ: `feat/*`, `fix/*`, `chore/*`。作業内容が混在する場合は分割。
- コミット: Conventional Commits（例: `feat: add challenge server actions`）。
- PR には概要・関連 Issue・テスト結果を記載。UI 変更時はスクリーンショット添付。
- インフラ (`docker/`, `supabase/config.toml` の一部) や Secrets に関わる変更は別途承認が必要。

## セキュリティ & 環境制約
- 実キーや個人情報をテスト応答に含めない。外部 API 叩くテストは禁止。
- Supabase ロール・RLS 変更はマイグレーションで管理。既存ポリシーの改変は影響が大きいため必ずレビューを依頼。

## キャッシュ・パフォーマンス
- HTML レスポンスは `Cache-Control: s-maxage=60, stale-while-revalidate=300` を想定。変更が必要な場合は SRE チームと調整。
- パブリックアセットはビルドで fingerprint 付き。`public/` に置くファイルは短期キャッシュが基本。

## 注意事項
- `supabase/migrations/` の履歴は時系列を壊さない。順番変更が必要な場合は新規ファイルで対応。
- `packages/ui` は存在しないが、共通 UI は `src/components` 下で Storybook（別リポジトリ）と合わせる方針。破壊的変更は避け、既存コンポーネントの props 追加時はデフォルトを維持。
- 画像アップロードやチャレンジ進捗の Server Action は Supabase 依存が強い。テストでは `jest.spyOn(console, 'error')` などでログを抑制しつつ、期待メッセージのみ検証。
