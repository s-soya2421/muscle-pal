# AuthContext実装詳細とセキュリティ考慮事項

## 概要
MusclePalプロジェクトでのAuthContextとAuthProviderの実装について、設計思想とセキュリティ考慮事項を記録。

## 実装ファイル
- `src/contexts/AuthContext.tsx` - メインのAuthContext実装
- `src/types/auth.ts` - 認証関連の型定義
- `src/app/layout.tsx` - AuthProviderの設定
- `src/app/login/page.tsx` - ログインページでの使用例
- `src/app/signup/page.tsx` - サインアップページでの使用例

## AuthContextの設計原則

### 1. SPA環境でのデータ共有
- **目的**: アプリケーション全体で認証状態を共有
- **メリット**: ページ遷移時に認証状態が保持される
- **実装**: React Context APIを使用してProvider/Consumer パターンを採用

### 2. セキュリティ重視の実装

#### getUser() vs getSession()
- **選択**: `supabase.auth.getUser()` を使用
- **理由**: 
  - `getSession()`: クライアント側のJWT解析（改ざんリスク）
  - `getUser()`: サーバー側検証（セキュア）
- **トレードオフ**: パフォーマンスは劣るがセキュリティが向上

```typescript
// セキュア
const { data: { user }, error } = await supabase.auth.getUser();
// vs 
// const { data: { session }, error } = await supabase.auth.getSession(); // 非推奨
```

### 3. 状態管理の設計

#### AuthState型定義
```typescript
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
```

#### 非同期処理のパターン
```typescript
const signIn = async (email: string, password: string): Promise<void> => {
  // 1. ローディング開始 + エラークリア
  setState(prev => ({ ...prev, loading: true, error: null }));
  
  // 2. 認証処理実行
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  // 3. エラー時の状態更新（成功時はonAuthStateChangeが自動処理）
  if (error) {
    setState(prev => ({ ...prev, error: error.message, loading: false }));
    throw error;
  }
}
```

## SPAとSSRの違いによる影響

### SPA環境（Next.jsでLinkコンポーネント使用）
- AuthProviderが継続してマウント
- 認証状態がページ間で保持される
- 認証確認は初回のみ実行

### 完全SSR環境（通常のaタグ使用）
- 各ページ遷移でAuthProviderが再マウント
- 認証状態が毎回リセット
- AuthProviderのメリットが大幅に減少

### 推奨実装
```typescript
// ✅ SPA遷移（推奨）
<Link href="/dashboard">Dashboard</Link>

// ❌ 完全リロード（非推奨）
<a href="/dashboard">Dashboard</a>
```

## 認証状態の自動更新メカニズム

### onAuthStateChangeの活用
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    setState({
      user: session?.user ?? null,
      loading: false,
      error: null
    });
  }
);
```

**重要**: signIn/signUp関数内で成功時の状態更新を行わない理由
- Supabaseが認証状態変更イベントを自動発火
- onAuthStateChangeが状態を自動更新
- 重複した状態更新を避ける設計

## 実装時の注意点

### 1. エラーハンドリング
- try-catch文で予期しないエラーもキャッチ
- エラーメッセージの型安全性を確保
- 呼び出し元への適切なエラー伝播

### 2. メモリリーク対策
```typescript
return () => {
  subscription.unsubscribe(); // cleanup関数でサブスクリプション解除
};
```

### 3. 型安全性
- TypeScriptによる厳密な型定義
- AuthContextTypeインターフェースの活用
- useAuth Hookでの型保証

## パフォーマンス考慮事項

### 初期化処理
- `getUser()`はサーバー通信が発生（~200ms）
- `getSession()`よりも遅いが、セキュリティを優先

### 状態更新の最適化
- `useState`の関数型更新を使用
- 不要な再レンダリングを避ける設計

## 今後の拡張可能性

### ロール管理
- UserRole型の拡張
- 権限ベースのアクセス制御

### リフレッシュトークン
- 自動トークン更新の実装検討

### オフライン対応
- ローカルストレージとの同期機能

## セキュリティベストプラクティス

1. **サーバー側検証の徹底** - getUser()の使用
2. **HTTPS通信の強制** - 本番環境での必須設定
3. **トークンの適切な保存** - Supabaseによる自動管理
4. **セッション管理** - 適切なタイムアウト設定
5. **エラー情報の制限** - 機密情報の漏洩防止

## 参考資料
- Supabase Auth Documentation
- React Context API Best Practices  
- Next.js Authentication Patterns