import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

// Context と navigation をモック
jest.mock('@/contexts/AuthContext')
jest.mock('next/navigation')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()

describe('LoginPage', () => {
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

  test('ログインフォームが正しく表示される', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
    expect(screen.getByText('新規登録')).toBeInTheDocument()
  })

  test('フォームの初期値が空である', () => {
    render(<LoginPage />)
    
    expect(screen.getByLabelText('メールアドレス')).toHaveValue('')
    expect(screen.getByLabelText('パスワード')).toHaveValue('')
  })

  test('メールアドレスとパスワードを入力できる', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  test('正常なログイン処理', async () => {
    const user = userEvent.setup()
    const mockSignIn = jest.fn().mockResolvedValue(undefined)
    
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<LoginPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('ログイン中の状態表示', async () => {
    const user = userEvent.setup()
    const mockSignIn = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<LoginPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'password123')
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    await user.click(submitButton)
    
    expect(screen.getByText('ログイン中...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  test('ログインエラーの表示', async () => {
    const user = userEvent.setup()
    const mockSignIn = jest.fn().mockRejectedValue(new Error('メールアドレスまたはパスワードが正しくありません'))
    
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<LoginPage />)
    
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    
    await waitFor(() => {
      expect(screen.getByText('メールアドレスまたはパスワードが正しくありません')).toBeInTheDocument()
    })
  })

  test('必須フィールドの検証', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' })
    await user.click(submitButton)
    
    // HTML5の必須フィールド検証によりフォームは送信されない
    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByLabelText('パスワード')
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  test('新規登録リンクが正しく表示される', () => {
    render(<LoginPage />)
    
    const signUpLink = screen.getByRole('link', { name: '新規登録' })
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute('href', '/signup')
  })

  test('エラーメッセージがクリアされる', async () => {
    const user = userEvent.setup()
    const mockSignIn = jest.fn()
      .mockRejectedValueOnce(new Error('ログインエラー'))
      .mockResolvedValueOnce(undefined)
    
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      user: null,
      loading: false,
      error: null
    })
    
    render(<LoginPage />)
    
    // 最初のログイン試行（エラー）
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    
    await waitFor(() => {
      expect(screen.getByText('ログインエラー')).toBeInTheDocument()
    })
    
    // 2回目のログイン試行（成功）
    await user.clear(screen.getByLabelText('パスワード'))
    await user.type(screen.getByLabelText('パスワード'), 'correctpassword')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    
    // エラーメッセージがクリアされることを確認
    await waitFor(() => {
      expect(screen.queryByText('ログインエラー')).not.toBeInTheDocument()
    })
  })
})