This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase ローカル開発とCLIへの切り替え

このプロジェクトでは、ローカル開発用に Docker ではなく Supabase CLI を採用しています。

- 主な理由（正直な話）: ドキュメントをちゃんと読まずに Docker 側で遠回りしてしまい、「素直に CLI 使えばよかった…」と気づいたため（愚かだった、笑）。
- 実利: CLI ならローカル起動、マイグレーション、シード投入、ストレージ操作まで一貫して扱え、チームでも再現性が高いです。

よく使うコマンド（`package.json` のスクリプト経由）:

```bash
npm run supabase:start   # ローカルの Supabase を起動
npm run supabase:reset   # DB を初期化（マイグレーション + シード）
npm run supabase:status  # 稼働状況の確認
npm run supabase:stop    # 停止
```

型の再生成（必要な場合）:

```bash
# ローカルのインスタンスから生成
supabase gen types typescript --local > src/types/supabase.ts
```

### 便利スクリプト（型生成）

```bash
npm run types:gen:local      # ローカルDBから型を生成
SUPABASE_PROJECT_ID=xxxx \
  npm run types:gen:remote   # リモートプロジェクトから型を生成
npm run supabase:reset:types # DBリセット後に型を再生成
```

### 開発用ログインアカウント

`supabase/seed.sql` に開発用の Supabase Auth ユーザーを追加しました。

- Email: `dev@muscle-pal.fit`
- Password: `password123`
- Role: `admin`（`public.profiles.role`）

`npm run supabase:reset` または `supabase db reset` を実行すると、Auth と Profile の両方が再作成（既存の場合は更新）されます。開発用のアカウントを削除してしまった場合はリセットするか、Supabase Studio から同じ情報で追加してください。

### チャレンジ機能について（現状）

- UIは一覧/詳細/進捗/参加者まで実装済み。参加・一時停止・再開・チェックインはServer Actionsに接続済み。
- 実データ連携は`supabase/migrations/20250917000001_core_challenge_and_post_images.sql`を適用し、ログイン状態で動作。
- 初期段階ではモック表示のままでも問題ありません（クリック時のみServer Action実行）。
