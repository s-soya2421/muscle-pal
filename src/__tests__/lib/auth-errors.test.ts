import { handleAuthError, logAuthError } from '@/lib/auth-errors'

// console.error をモック（後でrestoreするために保持）
jest.spyOn(console, 'error').mockImplementation(() => {})

describe('auth-errors', () => {

  describe('handleAuthError', () => {
    test('Supabaseエラーオブジェクトを正しく処理する', () => {
      const error = {
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
        status: 401
      }
      const result = handleAuthError(error, 'login')
      expect(result).toBe('メールアドレスまたはパスワードが正しくありません')
    })

    test('Error インスタンスを正しく処理する', () => {
      const error = new Error('Invalid login credentials')
      const result = handleAuthError(error, 'login')
      expect(result).toBe('メールアドレスまたはパスワードが正しくありません')
    })

    test('文字列エラーを正しく処理する', () => {
      const error = 'already registered'
      const result = handleAuthError(error, 'signup')
      expect(result).toBe('このメールアドレスは既に登録されています')
    })

    test('コンテキスト別のフォールバックメッセージを返す - login', () => {
      const error = 'unknown error'
      const result = handleAuthError(error, 'login')
      expect(result).toBe('ログインに失敗しました')
    })

    test('コンテキスト別のフォールバックメッセージを返す - signup', () => {
      const error = 'unknown error'
      const result = handleAuthError(error, 'signup')
      expect(result).toBe('アカウント作成に失敗しました')
    })

    test('コンテキスト別のフォールバックメッセージを返す - reset', () => {
      const error = 'unknown error'
      const result = handleAuthError(error, 'reset')
      expect(result).toBe('パスワードリセットに失敗しました')
    })

    test('未知のコンテキストの場合は汎用メッセージを返す', () => {
      const error = 'unknown error'
      const result = handleAuthError(error, 'unknown')
      expect(result).toBe('エラーが発生しました。しばらく時間をおいてから再度お試しください')
    })

    test('nullエラーを正しく処理する', () => {
      const result = handleAuthError(null, 'login')
      expect(result).toBe('ログインに失敗しました')
    })

    test('undefinedエラーを正しく処理する', () => {
      const result = handleAuthError(undefined, 'signup')
      expect(result).toBe('アカウント作成に失敗しました')
    })
  })

  describe('logAuthError', () => {
    let originalConsoleError: typeof console.error
    let mockConsoleErrorInTest: jest.SpyInstance
    
    beforeEach(() => {
      // 元のconsole.errorを保存
      originalConsoleError = console.error
      // 新しいモックを作成
      mockConsoleErrorInTest = jest.fn()
      console.error = mockConsoleErrorInTest
      // 開発モードに設定
      process.env.NODE_ENV = 'development'
    })

    afterEach(() => {
      // console.errorを復元
      console.error = originalConsoleError
      // テスト環境に戻す
      process.env.NODE_ENV = 'test'
    })

    test('開発モードでエラーをログ出力する', () => {
      const error = new Error('test error')
      logAuthError(error, 'test context')
      
      expect(mockConsoleErrorInTest).toHaveBeenCalledWith(
        '[Auth Error - test context]:',
        expect.objectContaining({
          error,
          type: 'object',
          message: 'test error'
        })
      )
    })

    test('本番モードではログ出力しない', () => {
      process.env.NODE_ENV = 'production'
      
      const error = new Error('test error')
      logAuthError(error, 'test context')
      
      expect(mockConsoleErrorInTest).not.toHaveBeenCalled()
    })

    test('Supabaseエラーオブジェクトの詳細をログ出力する', () => {
      const error = {
        code: 'invalid_credentials',
        status: 401,
        message: 'Invalid credentials'
      }
      logAuthError(error, 'auth test')
      
      expect(mockConsoleErrorInTest).toHaveBeenCalledWith(
        '[Auth Error - auth test]:',
        expect.objectContaining({
          error,
          type: 'object',
          isAuthApiError: true,
          status: 401,
          code: 'invalid_credentials'
        })
      )
    })
  })
})