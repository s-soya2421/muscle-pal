# MusclePal - システムアーキテクチャ設計書

## 📋 文書情報

| 項目 | 詳細 |
|------|------|
| 文書名 | MusclePal システムアーキテクチャ設計書 |
| バージョン | 1.0 |
| 作成日 | 2025-01-07 |
| 更新日 | 2025-01-07 |

---

## 🏗️ システム全体アーキテクチャ

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[📱 Mobile Web]
        Desktop[💻 Desktop Web]
        PWA[📲 PWA]
    end
    
    subgraph "CDN & Edge"
        Vercel[🌐 Vercel Edge Network]
    end
    
    subgraph "Frontend Infrastructure"
        NextJS[⚛️ Next.js App]
        SSR[🔄 Server-Side Rendering]
        Static[📄 Static Generation]
    end
    
    subgraph "Backend Infrastructure (Supabase)"
        Auth[🔐 Supabase Auth]
        Database[🗄️ PostgreSQL]
        Storage[📁 Supabase Storage]
        Realtime[⚡ Realtime Engine]
        EdgeFunctions[⚙️ Edge Functions]
    end
    
    subgraph "External Services"
        Maps[🗺️ Google Maps API]
        Push[📱 Push Notifications]
        Analytics[📊 Analytics]
        Monitoring[🔍 Monitoring]
    end
    
    Mobile --> Vercel
    Desktop --> Vercel
    PWA --> Vercel
    
    Vercel --> NextJS
    NextJS --> SSR
    NextJS --> Static
    
    NextJS --> Auth
    NextJS --> Database
    NextJS --> Storage
    NextJS --> Realtime
    NextJS --> EdgeFunctions
    
    NextJS --> Maps
    NextJS --> Push
    NextJS --> Analytics
    NextJS --> Monitoring
```

---

## 🔧 技術スタック詳細

### フロントエンド

```mermaid
graph LR
    subgraph "Frontend Stack"
        A[Next.js 15.4.6] --> B[React 19]
        B --> C[TypeScript]
        C --> D[Tailwind CSS]
        D --> E[shadcn/ui]
        E --> F[Radix UI]
        
        A --> G[TanStack Query]
        G --> H[Zustand]
        H --> I[React Hook Form]
        I --> J[Zod]
    end
```

#### 主要パッケージ

| パッケージ | バージョン | 用途 |
|------------|------------|------|
| Next.js | 15.4.6 | フレームワーク |
| React | 19 | UIライブラリ |
| TypeScript | 5.2.2 | 型安全性 |
| Tailwind CSS | 4.0 | スタイリング |
| shadcn/ui | latest | UIコンポーネント |
| TanStack Query | 5.0 | サーバー状態管理 |
| Zustand | 4.4 | クライアント状態管理 |
| React Hook Form | 7.48 | フォーム管理 |
| Zod | 3.22 | スキーマ検証 |

### バックエンド (Supabase)

```mermaid
graph TB
    subgraph "Supabase Services"
        A[🔐 Authentication]
        B[🗄️ Database]
        C[📁 Storage]
        D[⚡ Realtime]
        E[⚙️ Edge Functions]
        F[🔒 Row Level Security]
        
        A --> F
        B --> F
        C --> F
        D --> B
        E --> B
    end
```

#### サービス詳細

| サービス | 機能 | 用途 |
|----------|------|------|
| Supabase Auth | JWT認証、ソーシャルログイン | ユーザー認証・認可 |
| PostgreSQL | リレーショナルデータベース | データ永続化 |
| Supabase Storage | オブジェクトストレージ | 画像・ファイル保存 |
| Realtime | WebSocket接続 | リアルタイム通信 |
| Edge Functions | サーバーレス関数 | カスタムロジック |
| RLS | 行レベルセキュリティ | データアクセス制御 |

---

## 🗃️ データベース設計

### エンティティ関係図

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string username UK
        string display_name
        text bio
        string avatar_url
        string location
        integer experience_years
        jsonb fitness_goals
        jsonb privacy_settings
        timestamp created_at
        timestamp updated_at
    }
    
    posts {
        uuid id PK
        uuid user_id FK
        text content
        jsonb images
        jsonb location
        string post_type
        string visibility
        integer likes_count
        integer comments_count
        timestamp created_at
        timestamp updated_at
    }
    
    training_sessions {
        uuid id PK
        uuid organizer_id FK
        string title
        text description
        jsonb location
        timestamp start_time
        timestamp end_time
        integer max_participants
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    challenges {
        uuid id PK
        uuid creator_id FK
        string title
        text description
        string category
        string difficulty_level
        jsonb goals
        timestamp start_date
        timestamp end_date
        integer max_participants
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    follows {
        uuid id PK
        uuid follower_id FK
        uuid following_id FK
        timestamp created_at
    }
    
    session_participants {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        string status
        timestamp joined_at
    }
    
    challenge_participants {
        uuid id PK
        uuid challenge_id FK
        uuid user_id FK
        jsonb progress_data
        string status
        timestamp joined_at
        timestamp completed_at
    }
    
    chat_rooms {
        uuid id PK
        uuid session_id FK
        string room_type
        timestamp created_at
    }
    
    messages {
        uuid id PK
        uuid room_id FK
        uuid user_id FK
        text content
        jsonb attachments
        jsonb reactions
        timestamp created_at
        timestamp updated_at
    }
    
    users ||--o{ posts: creates
    users ||--o{ training_sessions: organizes
    users ||--o{ challenges: creates
    users ||--o{ follows: follower
    users ||--o{ follows: following
    users ||--o{ session_participants: participates
    users ||--o{ challenge_participants: participates
    users ||--o{ messages: sends
    
    training_sessions ||--o{ session_participants: has
    training_sessions ||--|| chat_rooms: has
    
    challenges ||--o{ challenge_participants: has
    
    chat_rooms ||--o{ messages: contains
```

---

## 🔄 アプリケーションフロー

### ユーザー認証フロー

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase Auth
    participant D as Database
    
    U->>F: アクセス
    F->>S: セッション確認
    
    alt 未認証
        S->>F: 認証不要
        F->>U: ログインページ表示
        U->>F: ログイン情報入力
        F->>S: 認証リクエスト
        S->>D: ユーザー情報確認
        D->>S: ユーザーデータ
        S->>F: JWT トークン
        F->>U: ダッシュボードリダイレクト
    else 認証済み
        S->>F: 有効なセッション
        F->>U: ダッシュボード表示
    end
```

### 投稿作成フロー

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase
    participant D as Database
    participant St as Storage
    
    U->>F: 投稿作成開始
    F->>U: 投稿フォーム表示
    U->>F: 内容・画像入力
    F->>F: バリデーション
    
    alt 画像あり
        F->>St: 画像アップロード
        St->>F: 画像URL
    end
    
    F->>D: 投稿データ保存
    D->>F: 保存完了
    F->>U: 投稿完了通知
    
    Note over F,D: リアルタイム更新
    D->>F: 新規投稿通知
    F->>U: タイムライン更新
```

### リアルタイムチャットフロー

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant F1 as Frontend 1
    participant F2 as Frontend 2
    participant R as Realtime
    participant D as Database
    
    U1->>F1: チャットルーム参加
    F1->>R: WebSocket接続
    R->>F1: 接続確認
    
    U2->>F2: チャットルーム参加
    F2->>R: WebSocket接続
    R->>F2: 接続確認
    
    U1->>F1: メッセージ送信
    F1->>D: メッセージ保存
    D->>R: 変更通知
    R->>F2: リアルタイム配信
    F2->>U2: メッセージ表示
    
    U2->>F2: リアクション
    F2->>D: リアクション保存
    D->>R: 変更通知
    R->>F1: リアルタイム配信
    F1->>U1: リアクション表示
```

---

## 🔒 セキュリティアーキテクチャ

### 認証・認可フロー

```mermaid
graph TB
    subgraph "認証層"
        A[Supabase Auth] --> B[JWT Token]
        B --> C[Row Level Security]
    end
    
    subgraph "認可ポリシー"
        C --> D[ユーザープロファイル]
        C --> E[投稿データ]
        C --> F[チャットメッセージ]
        C --> G[セッション参加]
    end
    
    subgraph "データアクセス制御"
        D --> H[自分のデータのみ編集可能]
        E --> I[公開設定に基づく閲覧制御]
        F --> J[参加者のみ閲覧可能]
        G --> K[認証ユーザーのみ参加可能]
    end
```

### RLSポリシー例

```sql
-- 投稿の閲覧制御
CREATE POLICY "Posts visibility policy" ON posts
FOR SELECT USING (
  visibility = 'public' OR
  (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() AND following_id = posts.user_id
  )) OR
  (visibility = 'private' AND user_id = auth.uid())
);

-- プロフィールの編集制御
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- チャットメッセージの閲覧制御
CREATE POLICY "Chat room participants can view messages" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM session_participants sp
    JOIN chat_rooms cr ON cr.session_id = sp.session_id
    WHERE cr.id = messages.room_id AND sp.user_id = auth.uid()
  )
);
```

---

## 📊 パフォーマンス設計

### フロントエンド最適化

```mermaid
graph LR
    subgraph "パフォーマンス戦略"
        A[Code Splitting] --> B[Dynamic Import]
        C[Image Optimization] --> D[Next.js Image]
        E[Caching Strategy] --> F[SWR/React Query]
        G[Bundle Analysis] --> H[webpack-bundle-analyzer]
    end
```

#### 最適化手法

| 項目 | 手法 | 効果 |
|------|------|------|
| 初期ロード | Code Splitting | バンドルサイズ削減 |
| 画像表示 | Next.js Image | 自動最適化・遅延ロード |
| データフェッチ | TanStack Query | キャッシュ・背景更新 |
| ルーティング | App Router | 高速ナビゲーション |

### バックエンド最適化

```sql
-- インデックス戦略
CREATE INDEX CONCURRENTLY idx_posts_user_id_created_at 
ON posts(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_follows_follower_following 
ON follows(follower_id, following_id);

CREATE INDEX CONCURRENTLY idx_sessions_location_time 
ON training_sessions USING GiST(location, start_time);

-- パーティション戦略（大規模時）
CREATE TABLE posts_y2025m01 PARTITION OF posts 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## 🔄 CI/CD パイプライン

### デプロイメントフロー

```mermaid
graph LR
    subgraph "開発フロー"
        A[Local Dev] --> B[Feature Branch]
        B --> C[Pull Request]
        C --> D[Code Review]
        D --> E[Main Branch]
    end
    
    subgraph "CI/CD"
        E --> F[GitHub Actions]
        F --> G[Build & Test]
        G --> H[Type Check]
        H --> I[Lint & Format]
        I --> J[Vercel Deploy]
    end
    
    subgraph "環境"
        J --> K[Preview]
        J --> L[Production]
    end
```

### GitHub Actions設定

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 📊 監視・ログ設計

### 監視ダッシュボード

```mermaid
graph TB
    subgraph "監視システム"
        A[Vercel Analytics] --> B[パフォーマンス監視]
        C[Supabase Dashboard] --> D[データベース監視]
        E[Sentry] --> F[エラー追跡]
        G[Google Analytics] --> H[ユーザー行動分析]
    end
    
    subgraph "アラート"
        B --> I[レスポンス時間異常]
        D --> J[データベース負荷]
        F --> K[エラー率上昇]
        H --> L[アクセス数異常]
    end
```

### ログ設計

```typescript
// 構造化ログ設計
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// 使用例
logger.info('user_login', {
  userId: '123',
  method: 'email',
  timestamp: new Date().toISOString()
});
```

---

## 🚀 スケーリング戦略

### 成長段階別アーキテクチャ

```mermaid
graph TB
    subgraph "Phase 1: MVP (〜1K Users)"
        A1[Single Region]
        B1[Basic Monitoring]
        C1[Manual Scaling]
    end
    
    subgraph "Phase 2: Growth (〜10K Users)"
        A2[Multi Region CDN]
        B2[Advanced Monitoring]
        C2[Auto Scaling]
    end
    
    subgraph "Phase 3: Scale (〜100K Users)"
        A3[Global Distribution]
        B3[AI-Powered Insights]
        C3[Microservices Migration]
    end
```

### スケーリング指標

| フェーズ | ユーザー数 | 対応策 |
|----------|------------|---------|
| Phase 1 | 〜1,000 | 基本構成で十分 |
| Phase 2 | 〜10,000 | CDN強化、監視拡充 |
| Phase 3 | 〜100,000 | マイクロサービス化検討 |
| Phase 4 | 100,000+ | 専用インフラ構築 |

---

## 📋 技術的負債管理

### 定期レビュー項目

```mermaid
graph LR
    subgraph "技術的負債"
        A[依存関係更新] --> B[月次]
        C[セキュリティ監査] --> D[四半期]
        E[パフォーマンス監査] --> F[半年]
        G[アーキテクチャ見直し] --> H[年次]
    end
```

### 保守性指標

| 項目 | 目標値 | 測定方法 |
|------|--------|----------|
| テストカバレッジ | 80%以上 | Jest Coverage |
| 型安全性 | 100% | TypeScript strict |
| コード品質 | A評価 | ESLint + SonarQube |
| バンドルサイズ | 1MB未満 | webpack-bundle-analyzer |

---

*このアーキテクチャ設計書はプロジェクトの成長に合わせて継続的に更新されます。*