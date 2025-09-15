import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReplySection } from '@/app/posts/_components/reply-section'
import { createComment } from '@/app/actions/posts'

// Mock the server action
jest.mock('@/app/actions/posts')
const mockCreateComment = createComment as jest.MockedFunction<typeof createComment>

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user123', username: 'testuser', display_name: 'Test User' } }
      })
    }
  })
}))

// Mock components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} data-testid="avatar-image" />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div data-testid="avatar-fallback">{children}</div>,
}))

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} data-testid="textarea" />,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props} data-testid="button">{children}</button>,
}))

jest.mock('@/components/posts/like-button', () => ({
  LikeButton: ({ postId, initialLikeCount }: { postId: string; initialLikeCount: number }) => (
    <div data-testid="like-button">{initialLikeCount}</div>
  ),
}))

describe('ReplySection', () => {
  const mockReplies = [
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
    },
    {
      id: 'comment2',
      content: 'テストコメント2',
      author_id: 'user789',
      post_id: 'post1',
      created_at: '2025-01-15T12:00:00Z',
      is_liked: true,
      like_count: 1,
      profiles: {
        username: 'commenter2',
        display_name: 'Commenter 2',
        avatar_url: 'https://example.com/commenter2.jpg'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders reply form and existing replies', () => {
    render(<ReplySection postId="post1" replies={mockReplies} />)

    // Check reply form
    expect(screen.getByPlaceholderText('返信をツイート')).toBeInTheDocument()
    expect(screen.getByText('返信')).toBeInTheDocument()

    // Check existing replies
    expect(screen.getByText('テストコメント1')).toBeInTheDocument()
    expect(screen.getByText('Commenter 1')).toBeInTheDocument()
    expect(screen.getByText('テストコメント2')).toBeInTheDocument()
    expect(screen.getByText('Commenter 2')).toBeInTheDocument()
  })

  it('displays reply counts correctly', () => {
    render(<ReplySection postId="post1" replies={mockReplies} />)

    // Check like counts for replies
    expect(screen.getByText('2')).toBeInTheDocument() // first comment likes
    expect(screen.getByText('1')).toBeInTheDocument() // second comment likes
  })

  it('allows user to submit a new reply', async () => {
    const mockNewComment = {
      id: 'comment3',
      content: '新しいコメント',
      author_id: 'user123',
      post_id: 'post1',
      created_at: '2025-01-15T13:00:00Z',
      is_liked: false,
      like_count: 0,
      profiles: {
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'https://example.com/testuser.jpg'
      }
    }

    mockCreateComment.mockResolvedValue(mockNewComment)

    render(<ReplySection postId="post1" replies={mockReplies} />)

    const textarea = screen.getByPlaceholderText('返信をツイート')
    const submitButton = screen.getByText('返信')

    // Type in the textarea
    fireEvent.change(textarea, { target: { value: '新しいコメント' } })
    expect(textarea).toHaveValue('新しいコメント')

    // Submit the form
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith('post1', '新しいコメント')
    })
  })

  it('shows loading state during reply submission', async () => {
    mockCreateComment.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockReplies[0]), 1000))
    )

    render(<ReplySection postId="post1" replies={mockReplies} />)

    const textarea = screen.getByPlaceholderText('返信をツイート')
    const submitButton = screen.getByText('返信')

    fireEvent.change(textarea, { target: { value: '新しいコメント' } })
    fireEvent.click(submitButton)

    // Check loading state
    expect(screen.getByText('投稿中...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('prevents submission when textarea is empty', () => {
    render(<ReplySection postId="post1" replies={mockReplies} />)

    const submitButton = screen.getByText('返信')
    
    // Button should be disabled when textarea is empty
    expect(submitButton).toBeDisabled()
  })

  it('clears textarea after successful submission', async () => {
    const mockNewComment = {
      id: 'comment3',
      content: '新しいコメント',
      author_id: 'user123',
      post_id: 'post1',
      created_at: '2025-01-15T13:00:00Z',
      is_liked: false,
      like_count: 0,
      profiles: {
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'https://example.com/testuser.jpg'
      }
    }

    mockCreateComment.mockResolvedValue(mockNewComment)

    render(<ReplySection postId="post1" replies={mockReplies} />)

    const textarea = screen.getByPlaceholderText('返信をツイート')
    const submitButton = screen.getByText('返信')

    fireEvent.change(textarea, { target: { value: '新しいコメント' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('shows optimistic update for new reply', async () => {
    const mockNewComment = {
      id: 'comment3',
      content: '新しいコメント',
      author_id: 'user123',
      post_id: 'post1',
      created_at: '2025-01-15T13:00:00Z',
      is_liked: false,
      like_count: 0,
      profiles: {
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'https://example.com/testuser.jpg'
      }
    }

    // Simulate slow response
    mockCreateComment.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockNewComment), 1000))
    )

    render(<ReplySection postId="post1" replies={mockReplies} />)

    const textarea = screen.getByPlaceholderText('返信をツイート')
    const submitButton = screen.getByText('返信')

    fireEvent.change(textarea, { target: { value: '新しいコメント' } })
    fireEvent.click(submitButton)

    // Reply should appear immediately (optimistic update)
    expect(screen.getByText('新しいコメント')).toBeInTheDocument()
  })

  it('handles error during reply submission', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockCreateComment.mockRejectedValue(new Error('Failed to create comment'))

    render(<ReplySection postId="post1" replies={mockReplies} />)

    const textarea = screen.getByPlaceholderText('返信をツイート')
    const submitButton = screen.getByText('返信')

    fireEvent.change(textarea, { target: { value: '新しいコメント' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('コメント投稿エラー:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })
})