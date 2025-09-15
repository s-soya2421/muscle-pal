# MusclePal - プロジェクト概要

## プロジェクトの目的
MusclePalはフィットネス愛好者が互いにつながり、支え合い、共に成長できる包括的なソーシャルプラットフォーム。

## 技術スタック

### フロントエンド
- Next.js 15.4.6 (App Router)
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui + Radix UI
- React 19.1.0
- Lucide React (アイコン)

### バックエンド
- Supabase (PostgreSQL, Auth, Storage, Realtime)

### 開発ツール
- ESLint (next/core-web-vitals, next/typescript)
- PostCSS
- Autoprefixer

## プロジェクト構造
```
src/
├── app/              # Next.js App Router
│   ├── dashboard/    # ダッシュボードページ（空）
│   ├── layout.tsx    # メインレイアウト
│   └── page.tsx      # ランディングページ
├── components/       # Reactコンポーネント
│   └── ui/          # shadcn/uiコンポーネント
├── lib/             # ユーティリティとライブラリ
│   ├── supabase/    # Supabase設定
│   └── utils.ts     # ユーティリティ関数
└── middleware.ts    # Next.jsミドルウェア
```

## 主要機能（要件定義より）
1. ユーザー認証・プロフィール管理
2. ソーシャルネットワーク（投稿、いいね、フォロー）
3. トレーニングセッション
4. チャレンジ機能
5. リアルタイムチャット
6. 検索・発見機能

## 開発フェーズ
現在Phase 1（MVP）を開発中。ランディングページは完成済み。