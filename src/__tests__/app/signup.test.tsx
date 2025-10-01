import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUpPage from '@/app/signup/page'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Context と navigation をモック
jest.mock('@/contexts/AuthContext')
jest.mock('next/navigation')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    } as ReturnType<typeof useRouter>)

    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
  })

  test('サインアップフォームが正しく表示される', () => {
    render(<SignUpPage />)
    
    expect(screen.getByRole('heading', { name: '新規登録' })).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード確認')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'アカウント作成' })).toBeInTheDocument()
    expect(screen.getByText('ログイン')).toBeInTheDocument()
  })

  test('フォームの初期値が空である', () => {
    render(<SignUpPage />)
    
    expect(screen.getByLabelText('メールアドレス')).toHaveValue('')
    expect(screen.getByLabelText('パスワード')).toHaveValue('')
    expect(screen.getByLabelText('パスワード確認')).toHaveValue('')
  })

  test('フォームの値を入力できる', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)
    
    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const confirmPasswordInput = screen.getByLabelText('パスワード確認')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
    expect(confirmPasswordInput).toHaveValue('password123')
  })

  test('正常なサインアップ処理', async () => {
    const user = userEvent.setup()
    const mockSignUp = jest.fn().mockResolvedValue(undefined)
    
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<SignUpPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.type(screen.getByLabelText('パスワード確認'), 'password123')
    await user.click(screen.getByRole('button', { name: 'アカウント作成' }))
    
    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123')
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('パスワード不一致エラー', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.type(screen.getByLabelText('パスワード確認'), 'differentpassword')
    await user.click(screen.getByRole('button', { name: 'アカウント作成' }))
    
    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    })
  })

  test('パスワード長さ不足エラー', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), '12345')
    await user.type(screen.getByLabelText('パスワード確認'), '12345')
    await user.click(screen.getByRole('button', { name: 'アカウント作成' }))
    
    await waitFor(() => {
      expect(screen.getByText('パスワードは6文字以上である必要があります')).toBeInTheDocument()
    })
  })

  test('アカウント作成中の状態表示', async () => {
    const user = userEvent.setup()
    const mockSignUp = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<SignUpPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.type(screen.getByLabelText('パスワード確認'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: 'アカウント作成' })
    await user.click(submitButton)
    
    expect(screen.getByText('アカウント作成中...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  test('サインアップエラーの表示', async () => {
    const user = userEvent.setup()
    const mockSignUp = jest.fn().mockRejectedValue(new Error('このメールアドレスは既に登録されています'))
    
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<SignUpPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'existing@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.type(screen.getByLabelText('パスワード確認'), 'password123')
    await user.click(screen.getByRole('button', { name: 'アカウント作成' }))
    
    await waitFor(() => {
      expect(screen.getByText('アカウント作成に失敗しました')).toBeInTheDocument()
    })
  })

  test('必須フィールドの検証', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)
    
    const submitButton = screen.getByRole('button', { name: 'アカウント作成' })
    await user.click(submitButton)
    
    // HTML5の必須フィールド検証
    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    const confirmPasswordInput = screen.getByLabelText('パスワード確認')
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
    expect(confirmPasswordInput).toBeRequired()
  })

  test('ログインリンクが正しく表示される', () => {
    render(<SignUpPage />)
    
    const loginLink = screen.getByRole('link', { name: 'ログイン' })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  test('パスワード確認エラー後の正常処理', async () => {
    const user = userEvent.setup()
    const mockSignUp = jest.fn().mockResolvedValue(undefined)
    
    mockUseAuth.mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<SignUpPage />)
    
    // 最初に不一致パスワードでエラー
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.type(screen.getByLabelText('パスワード確認'), 'differentpassword')
    await user.click(screen.getByRole('button', { name: 'アカウント作成' }))
    
    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    })
    
    // パスワード確認を修正して再試行
    await user.clear(screen.getByLabelText('パスワード確認'))
    await user.type(screen.getByLabelText('パスワード確認'), 'password123')
    await user.click(screen.getByRole('button', { name: 'アカウント作成' }))
    
    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123')
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})
