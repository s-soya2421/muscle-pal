import { render, screen } from '@testing-library/react'
import PostDetailPage from '@/app/posts/[id]/page'
import { getPostById, getPostComments } from '@/app/actions/posts'

// Mocks
jest.mock('@/app/actions/posts')
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('Not Found')
  }),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock MainLayout
jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children, rightSidebar }: { children: React.ReactNode; rightSidebar?: React.ReactNode }) => (
    <div>
      <div data-testid="main-layout-content">{children}</div>
      {rightSidebar && <div data-testid="right-sidebar">{rightSidebar}</div>}
    </div>
  ),
}))

// Mock components
jest.mock('@/app/posts/_components/post-image-gallery', () => ({
  PostImageGallery: ({ images }: { images: string[] }) => (
    <div data-testid="post-image-gallery">Gallery with {images.length} images</div>
  ),
}))

jest.mock('@/app/posts/_components/reply-section', () => ({
  ReplySection: ({ postId, replies }: { postId: string; replies: any[] }) => (
    <div data-testid="reply-section">Reply section for {postId} with {replies.length} replies</div>
  ),
}))

jest.mock('@/components/posts/like-button', () => ({
  LikeButton: ({ postId, initialLikeCount }: { postId: string; initialLikeCount: number }) => (
    <div data-testid="like-button">{initialLikeCount}</div>
  ),
}))

const mockGetPostById = getPostById as jest.MockedFunction<typeof getPostById>
const mockGetPostComments = getPostComments as jest.MockedFunction<typeof getPostComments>

describe('PostDetailPage', () => {
  const mockPost = {
    id: 'post1',
    content: 'テスト投稿の内容です',
    author_id: 'user123',
    post_type: 'general',
    like_count: 5,
    comment_count: 3,
    created_at: '2025-01-15T10:00:00Z',
    is_liked: false,
    location: 'Tokyo, Japan',
    media_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    profiles: {
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  }

  const mockComments = [
    {
      id: 'comment1',
      content: 'テストコメント1',
      author_id: 'user456',
      post_id: 'post1',
      created_at: '2025-01-15T11:00:00Z',
      is_liked: false,
      like_count: 2,
      profiles: {
        username: 'commenter1',
        display_name: 'Commenter 1',
        avatar_url: 'https://example.com/commenter1.jpg'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders post detail correctly', async () => {
    mockGetPostById.mockResolvedValue(mockPost)
    mockGetPostComments.mockResolvedValue(mockComments)

    const params = Promise.resolve({ id: 'post1' })
    const component = await PostDetailPage({ params })
    
    render(component)

    expect(screen.getByText('投稿')).toBeInTheDocument()
    expect(screen.getByText('テスト投稿の内容です')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('📍 Tokyo, Japan')).toBeInTheDocument()
  })

  it('displays post type badge for workout posts', async () => {
    const workoutPost = {
      ...mockPost,
      post_type: 'workout'
    }
    
    mockGetPostById.mockResolvedValue(workoutPost)
    mockGetPostComments.mockResolvedValue(mockComments)

    const params = Promise.resolve({ id: 'post1' })
    const component = await PostDetailPage({ params })
    
    render(component)

    expect(screen.getByText('ワークアウト')).toBeInTheDocument()
  })

  it('displays like and comment counts', async () => {
    mockGetPostById.mockResolvedValue(mockPost)
    mockGetPostComments.mockResolvedValue(mockComments)

    const params = Promise.resolve({ id: 'post1' })
    const component = await PostDetailPage({ params })
    
    render(component)

    expect(screen.getByText('5')).toBeInTheDocument() // like count
    expect(screen.getByText('3')).toBeInTheDocument() // comment count
  })

  it('shows image gallery when media_urls exist', async () => {
    mockGetPostById.mockResolvedValue(mockPost)
    mockGetPostComments.mockResolvedValue(mockComments)

    const params = Promise.resolve({ id: 'post1' })
    const component = await PostDetailPage({ params })
    
    render(component)

    // PostImageGallery component should be rendered
    expect(screen.getByTestId('post-image-gallery')).toBeInTheDocument()
  })

  it('calls notFound when post does not exist', async () => {
    mockGetPostById.mockResolvedValue(null)
    mockGetPostComments.mockResolvedValue([])

    const params = Promise.resolve({ id: 'nonexistent' })
    
    await expect(PostDetailPage({ params })).rejects.toThrow('Not Found')
  })

  it('handles error when fetching post fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockGetPostById.mockRejectedValue(new Error('Database error'))
    mockGetPostComments.mockResolvedValue([])

    const params = Promise.resolve({ id: 'post1' })
    
    await expect(PostDetailPage({ params })).rejects.toThrow('Not Found')
    expect(consoleSpy).toHaveBeenCalledWith('投稿詳細の取得エラー:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('displays right sidebar with trending topics and recommended users', async () => {
    mockGetPostById.mockResolvedValue(mockPost)
    mockGetPostComments.mockResolvedValue(mockComments)

    const params = Promise.resolve({ id: 'post1' })
    const component = await PostDetailPage({ params })
    
    render(component)

    expect(screen.getByText('今話題のトレーニング')).toBeInTheDocument()
    expect(screen.getByText('#自重トレーニング')).toBeInTheDocument()
    expect(screen.getByText('おすすめのユーザー')).toBeInTheDocument()
    expect(screen.getByText('筋トレマスター')).toBeInTheDocument()
  })

  it('renders reply section with comments', async () => {
    mockGetPostById.mockResolvedValue(mockPost)
    mockGetPostComments.mockResolvedValue(mockComments)

    const params = Promise.resolve({ id: 'post1' })
    const component = await PostDetailPage({ params })
    
    render(component)

    // ReplySection component should be rendered with comments
    expect(screen.getByTestId('reply-section')).toBeInTheDocument()
  })
})