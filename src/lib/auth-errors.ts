interface AuthApiError {
  status?: number;
  code?: string;
  message: string;
}

function translateAuthErrorByCode(errorCode: string, status?: number): string {
  // 実際に使われる可能性が高いエラーコードのみに厳選
  const errorCodeTranslations: Record<string, string> = {
    // よく発生する認証エラー
    'invalid_credentials': 'メールアドレスまたはパスワードが正しくありません',
    'email_exists': 'このメールアドレスは既に登録されています', 
    'email_not_confirmed': 'メールアドレスが確認されていません。確認メールをご確認ください',
    'user_not_found': 'ユーザーが見つかりません',
    'session_expired': 'セッションの有効期限が切れました。再度ログインしてください',
    
    // パスワード関連
    'weak_password': 'より強力なパスワードを設定してください',
    'same_password': '現在のパスワードとは異なるパスワードを入力してください',
    
    // レート制限
    'over_request_rate_limit': 'しばらく時間をおいてから再度お試しください',
    'over_email_send_rate_limit': 'メール送信回数の上限に達しました。しばらく待ってから再試行してください',
    
    // サービス制御
    'signup_disabled': '新規登録は現在ご利用いただけません',
    'provider_disabled': 'この認証方法は現在ご利用いただけません',
    'user_banned': 'このアカウントは一時的に利用停止されています',
    
    // システムエラー
    'bad_json': 'リクエストの形式が正しくありません',
    'validation_failed': '入力内容の形式が正しくありません',
    'conflict': '処理の競合が発生しました。再度お試しください',
    
    // データベースエラー
    'PGRST116': 'データが見つかりません',
    '23505': 'このデータは既に存在します'
  };

  // エラーコードが存在する場合、それを優先
  if (errorCode && errorCodeTranslations[errorCode]) {
    return errorCodeTranslations[errorCode];
  }

  // HTTPステータスコード対応（シンプル版）
  switch (status) {
    case 401:
      return 'ログイン情報を確認してください';
    case 422:
      return '入力内容を確認してください';
    case 429:
      return 'しばらく時間をおいてから再度お試しください';
    case 500:
    case 502:
    case 503:
      return 'サーバーエラーが発生しました。しばらく待ってから再試行してください';
    default:
      return 'エラーが発生しました。しばらく時間をおいてから再度お試しください';
  }
}


function translateCommonMessages(message: string): string | null {
  // 最も頻出するパターンのみ
  const commonPatterns: Array<[string, string]> = [
    ['Invalid login credentials', 'メールアドレスまたはパスワードが正しくありません'],
    ['already registered', 'このメールアドレスは既に登録されています'],
    ['Email not confirmed', 'メールアドレスが未認証です。メールを確認してください'],
    ['Too many requests', '試行回数が上限に達しました。しばらく時間をおいてから再度お試しください'],
    ['Failed to fetch', 'ネットワークエラーが発生しました'],
    ['Network error', 'ネットワークエラーが発生しました']
  ];

  for (const [englishPattern, japaneseMessage] of commonPatterns) {
    if (message.includes(englishPattern)) {
      return japaneseMessage;
    }
  }

  return null; // 翻訳できない場合
}

export function handleAuthError(error: unknown, context: string = ''): string {
  if (process.env.NODE_ENV === 'development') {
    logAuthError(error, context);
  }

  // Supabaseエラーオブジェクトの場合
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;

    // エラーコードがある場合（優先）
    if (typeof errorObj.code === 'string') {
      const status = typeof errorObj.status === 'number' ? errorObj.status : undefined;
      const translated = translateAuthErrorByCode(errorObj.code, status);
      if (translated !== 'エラーが発生しました。しばらく時間をおいてから再度お試しください') {
        return translated;
      }
    }

    // メッセージがある場合
    if (typeof errorObj.message === 'string') {
      const translated = translateCommonMessages(errorObj.message);
      if (translated) return translated;
    }
  }

  // Error インスタンスの場合
  if (error instanceof Error) {
    const translated = translateCommonMessages(error.message);
    if (translated) return translated;
  }

  // 文字列エラーの場合
  if (typeof error === 'string') {
    const translated = translateCommonMessages(error);
    if (translated) return translated;
  }

  // コンテキスト別フォールバック
  return getContextualErrorMessage(context);
}

function getContextualErrorMessage(context: string): string {
  switch (context.toLowerCase()) {
    case 'signin':
    case 'login':
    case 'login page':
      return 'ログインに失敗しました';
    case 'signup':
    case 'signup page':
    case 'register':
      return 'アカウント作成に失敗しました';
    case 'password':
    case 'reset':
    case 'resetpassword':
      return 'パスワードリセットに失敗しました';
    case 'profile':
    case 'update':
      return 'プロフィールの更新に失敗しました';
    case 'signout':
    case 'logout':
      return 'ログアウトに失敗しました';
    default:
      return 'エラーが発生しました。しばらく時間をおいてから再度お試しください';
  }
}


export function logAuthError(error: unknown, context: string = ''): void {
  // Don't log if there's no meaningful error
  if (!error || (typeof error === 'object' && Object.keys(error as object).length === 0)) {
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Auth Error${context ? ` - ${context}` : ''}]:`, {
      error,
      type: typeof error,
      isAuthApiError: error && typeof error === 'object' && 'status' in error && 'code' in error,
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error && typeof error === 'object' && 'status' in error ? (error as AuthApiError).status : undefined,
      code: error && typeof error === 'object' && 'code' in error ? (error as AuthApiError).code : undefined
    });
  }
}

