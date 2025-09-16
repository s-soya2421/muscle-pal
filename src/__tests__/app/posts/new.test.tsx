import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewPostPage from '@/app/posts/new/page'
import { useRouter } from 'next/navigation'

// Mocks
jest.mock('next/navigation')
jest.mock('@/app/actions/posts', () => ({
  createPost: jest.fn(),
}))

// Import mocked functions
import { createPost } from '@/app/actions/posts'

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockCreatePost = createPost as jest.MockedFunction<typeof createPost>
const mockPush = jest.fn()
const mockBack = jest.fn()

describe('NewPostPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
      replace: jest.fn(),
      prefetch: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    } as ReturnType<typeof useRouter>)
  })

  it('renders post creation form correctly', () => {
    render(<NewPostPage />)
    
    expect(screen.getByText('新しい投稿')).toBeInTheDocument()
    expect(screen.getByText('投稿を作成')).toBeInTheDocument()
    expect(screen.getByLabelText('投稿内容 *')).toBeInTheDocument()
    expect(screen.getByLabelText('公開設定')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '投稿する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('shows character count', async () => {
    const user = userEvent.setup()
    render(<NewPostPage />)
    
    const textarea = screen.getByLabelText('投稿内容 *')
    await user.type(textarea, 'テスト投稿です')
    
    expect(screen.getByText('7/500文字')).toBeInTheDocument()
  })

  it('disables submit button when content is empty', () => {
    render(<NewPostPage />)
    
    const submitButton = screen.getByRole('button', { name: '投稿する' })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when content is provided', async () => {
    const user = userEvent.setup()
    render(<NewPostPage />)
    
    const textarea = screen.getByLabelText('投稿内容 *')
    const submitButton = screen.getByRole('button', { name: '投稿する' })
    
    await user.type(textarea, 'テスト投稿です')
    
    expect(submitButton).toBeEnabled()
  })

  it('submits form with correct data', async () => {
    const user = userEvent.setup()
    mockCreatePost.mockResolvedValueOnce()
    
    render(<NewPostPage />)
    
    const textarea = screen.getByLabelText('投稿内容 *')
    const privacySelect = screen.getByLabelText('公開設定')
    const submitButton = screen.getByRole('button', { name: '投稿する' })
    
    await user.type(textarea, 'テスト投稿です')
    await user.selectOptions(privacySelect, 'followers')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(
        expect.any(FormData)
      )
      expect(mockPush).toHaveBeenCalledWith('/posts')
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockCreatePost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(<NewPostPage />)
    
    const textarea = screen.getByLabelText('投稿内容 *')
    const submitButton = screen.getByRole('button', { name: '投稿する' })
    
    await user.type(textarea, 'テスト投稿です')
    await user.click(submitButton)
    
    expect(screen.getByText('投稿中...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('shows error message when submission fails', async () => {
    const user = userEvent.setup()
    mockCreatePost.mockRejectedValueOnce(new Error('投稿に失敗しました'))
    
    render(<NewPostPage />)
    
    const textarea = screen.getByLabelText('投稿内容 *')
    const submitButton = screen.getByRole('button', { name: '投稿する' })
    
    await user.type(textarea, 'テスト投稿です')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('投稿に失敗しました')).toBeInTheDocument()
    })
  })

  it('navigates back when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<NewPostPage />)
    
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    await user.click(cancelButton)
    
    expect(mockBack).toHaveBeenCalled()
  })

  it('navigates to dashboard when back link is clicked', async () => {
    const user = userEvent.setup()
    render(<NewPostPage />)
    
    const backLink = screen.getByText('ダッシュボードに戻る')
    await user.click(backLink)
    
    // Link コンポーネントのテストは難しいので、要素の存在確認のみ
    expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard')
  })

  it('validates maximum character limit', async () => {
    const user = userEvent.setup()
    render(<NewPostPage />)
    
    const textarea = screen.getByLabelText('投稿内容 *')
    const longText = 'あ'.repeat(501) // 500文字制限を超える
    
    await user.type(textarea, longText)
    
    // maxLength属性により、500文字以上は入力できない
    expect(textarea).toHaveValue('あ'.repeat(500))
    expect(screen.getByText('500/500文字')).toBeInTheDocument()
  })
})