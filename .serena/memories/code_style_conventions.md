# MusclePal - コードスタイルと規約

## TypeScript設定
- ターゲット: ES2017
- 厳格モード: 有効
- パスエイリアス: `@/*` → `./src/*`

## ファイル命名規約
- コンポーネント: PascalCase (`Button.tsx`)
- ページ: kebab-case (`page.tsx`, `layout.tsx`)
- ユーティリティ: camelCase (`utils.ts`)

## コンポーネント規約
- shadcn/ui + Radix UIを使用
- Lucide Reactでアイコン
- Tailwind CSSでスタイリング
- メタデータをexportでSEO最適化

## インポート順序
```typescript
// 1. React/Nextインポート
import Link from 'next/link';

// 2. UIコンポーネント
import { Button } from '@/components/ui/button';

// 3. アイコン
import { Dumbbell, Users } from 'lucide-react';
```

## Tailwind CSS規約
- モバイルファースト設計
- レスポンシブ: `sm:`, `md:`, `lg:`
- メインカラー: blue-600 (Fitness Blue)
- アクセント: orange-600 (Energy Orange)

## プロップス命名
- Boolean: `is*`, `has*`, `should*`
- ハンドラー: `on*`, `handle*`
- スタイル: `className`, `variant`, `size`

## エクスポート規約
- デフォルトエクスポート: ページコンポーネント
- 名前付きエクスポート: ユーティリティ、サブコンポーネント
- メタデータ: `metadata` または `generateMetadata`