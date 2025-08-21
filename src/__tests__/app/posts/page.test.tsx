import { render, screen } from '@testing-library/react'
import PostsPage from '@/app/posts/page'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Mocks
jest.mock('@/lib/supabase/server')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// Mock Supabase client
const mockSelect = jest.fn()
const mockOrder = jest.fn()
const mockFrom = jest.fn()

describe('PostsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    
    mockSelect.mockReturnValue({
      order: mockOrder,
    })
    
    mockCreateServerClient.mockResolvedValue({
      from: mockFrom,
    } as any)
  })

  it('renders loading skeleton initially', () => {
    render(<PostsPage />)
    
    expect(screen.getByText('投稿')).toBeInTheDocument()
    expect(screen.getByText('新しい投稿')).toBeInTheDocument()
  })

  it('renders empty state when no posts exist', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    render(<PostsPage />)
    
    // Wait for posts to load
    await screen.findByText('まだ投稿がありません')
    
    expect(screen.getByText('最初の投稿を作成して、コミュニティを盛り上げましょう！')).toBeInTheDocument()
    expect(screen.getByText('最初の投稿を作成')).toBeInTheDocument()
  })

  it('renders posts when they exist', async () => {
    const mockPosts = [
      {
        id: '1',
        author_id: 'user1',
        content: 'テスト投稿1です',
        created_at: '2024-01-01T00:00:00Z',
        image_url: null,
      },
      {
        id: '2',
        author_id: 'user2',
        content: 'テスト投稿2です',
        created_at: '2024-01-02T00:00:00Z',
        image_url: null,
      },
    ]

    mockOrder.mockResolvedValueOnce({
      data: mockPosts,
      error: null,
    })

    render(<PostsPage />)
    
    // Wait for posts to load
    await screen.findByText('テスト投稿1です')
    
    expect(screen.getByText('テスト投稿2です')).toBeInTheDocument()
  })

  it('handles database error gracefully', async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    render(<PostsPage />)
    
    // Should render empty state when error occurs
    await screen.findByText('まだ投稿がありません')
  })

  it('shows pagination when there are multiple posts', async () => {
    // Create 15 mock posts (more than postsPerPage = 10)
    const mockPosts = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      author_id: `user${i + 1}`,
      content: `テスト投稿${i + 1}です`,
      created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      image_url: null,
    }))

    mockOrder.mockResolvedValueOnce({
      data: mockPosts,
      error: null,
    })

    render(<PostsPage />)
    
    // Wait for posts to load
    await screen.findByText('テスト投稿1です')
    
    // Should show pagination
    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // Current page indicator
  })

  it('calls Supabase with correct query parameters', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    render(<PostsPage />)
    
    // Wait for component to mount and make the call
    await screen.findByText('まだ投稿がありません')
    
    expect(mockFrom).toHaveBeenCalledWith('posts')
    expect(mockSelect).toHaveBeenCalledWith('id, author_id, content, created_at')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})