# MusclePal - Claude開発ガイド

## 📋 プロジェクト概要

**MusclePal**は、フィットネス愛好者が互いにつながり、支え合い、共に成長できる包括的なソーシャルプラットフォームです。

### 🎯 ミッション
フィットネス愛好者同士の真のつながりを創造し、一人では難しい目標も仲間と一緒に達成できる環境を提供する。

### 🔧 技術スタック
- **フロントエンド**: Next.js 15.4.6 (App Router), TypeScript, Tailwind CSS
- **UIライブラリ**: shadcn/ui + Radix UI, Lucide React
- **バックエンド**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **インフラ**: Vercel (ホスティング)

## 🏗️ プロジェクト構造

```
src/
├── app/                  # Next.js App Router
│   ├── dashboard/        # ダッシュボードページ ✅
│   ├── layout.tsx        # メインレイアウト
│   └── page.tsx          # ランディングページ ✅
├── components/           # Reactコンポーネント
│   └── ui/              # shadcn/uiコンポーネント
├── lib/                 # ユーティリティとライブラリ
│   ├── supabase/        # Supabase設定
│   ├── mock-data.ts     # モックデータ ✅
│   └── utils.ts         # ユーティリティ関数
└── middleware.ts        # Next.jsミドルウェア
```

## 🚀 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド & 型チェック
npm run build

# ESLint検証
npm run lint

# 本番サーバー起動
npm start

# テスト実行
npm run test

# テスト（ウォッチモード）
npm run test:watch

# テスト（カバレッジ付き）
npm run test:coverage

# CI用テスト実行
npm run test:ci
```

## 📱 実装済み機能

### ✅ ランディングページ (`/`)
- ヒーローセクション
- 機能紹介（ソーシャルネットワーク、セッション、チャレンジ）
- ビジョン説明
- CTA（行動喚起）

### ✅ ダッシュボードページ (`/dashboard`)
- **認証**: サーバーサイドSupabase認証チェック
- **3カラムレイアウト**:
  - 左: ユーザープロフィール、統計、クイックアクション
  - 中央: ウェルカムメッセージ、タイムライン
  - 右: 参加予定セッション、チャレンジ、おすすめユーザー
- **モバイル対応**: ボトムナビゲーション
- **ローディング**: Suspenseとスケルトンコンポーネント

### ✅ モックデータシステム (`/src/lib/mock-data.ts`)
- **ユーザー**: 田中太郎（中級者）、佐藤健（上級者）、山田花子（初心者）
- **投稿**: リアルなフィットネス投稿（PR達成、ヨガセッション等）
- **セッション**: 朝活ヨガ、筋トレ、ランニングクラブ
- **チャレンジ**: プランク30日、週5日運動、10000歩ウォーキング
- **おすすめユーザー**: 専門分野別の提案

## 🎨 デザイン指針

### カラーパレット
- **メインカラー**: `blue-600` (Fitness Blue)
- **アクセント**: `orange-600` (Energy Orange)
- **機能別色分け**:
  - 🟢 セッション: `green-600`
  - 🟠 チャレンジ: `orange-600`
  - 🟣 ユーザー: `purple-600`

### レスポンシブブレイクポイント
- **モバイル**: `375px-768px`
- **タブレット**: `768px-1024px`
- **デスクトップ**: `1024px+`

### アクセシビリティ
- WCAG 2.1 AA準拠
- キーボード操作対応
- 適切なaria属性使用

## 💻 開発ワークフロー

### 1. 新機能開発前
```bash
# 最新の変更を確認
git status
git pull origin main

# 開発サーバー起動
npm run dev
```

### 2. 開発中
```bash
# 型チェック
npm run build

# コード品質チェック
npm run lint
```

### 3. 開発完了後
```bash
# 最終チェック
npm run build
npm run lint

# Git操作
git add .
git commit -m "feat: 新機能の説明"
git push
```

## 🔮 今後の実装予定

### Phase 1: MVP機能
- [ ] ユーザー登録・ログイン画面
- [ ] プロフィール編集機能
- [ ] 投稿作成・編集機能
- [ ] いいね・コメント機能

### Phase 2: コミュニティ機能
- [ ] トレーニングセッション作成・参加
- [ ] リアルタイムチャット
- [ ] フォロー・フォロワー機能

### Phase 3: チャレンジ機能
- [ ] チャレンジ作成・参加
- [ ] 進捗トラッキング
- [ ] バッジ・報酬システム

## 🛠️ 開発時の注意事項

### コーディング規約
- **コンポーネント**: PascalCase
- **ファイル**: kebab-case
- **変数・関数**: camelCase
- **定数**: UPPER_SNAKE_CASE

### インポート順序
```typescript
// 1. React/Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. 外部ライブラリ
import { Button } from '@/components/ui/button';

// 3. 内部ライブラリ
import { createClient } from '@/lib/supabase/server';

// 4. アイコン
import { Dumbbell, Users } from 'lucide-react';
```

### 型定義
- すべての関数に戻り値の型を明示
- PropsにはInterfaceを使用
- モックデータには専用の型定義を使用

## 🐛 既知の課題

1. **ESLint警告**: `redirect`の未使用インポート（認証実装時に解決予定）
2. **認証**: 現在はコメントアウト状態（モック開発のため）
3. **データベース**: 実際のSupabase連携未実装

## 📞 サポート・問い合わせ

開発中に問題が発生した場合：
1. `npm run build`で型エラーをチェック
2. `npm run lint`でコード品質を確認
3. コンソールエラーを確認
4. 必要に応じてプロジェクトメモリファイルを参照

---

**Last Updated**: 2025-08-09  
**Version**: 1.0  
**Status**: 開発中（MVP Phase 1）