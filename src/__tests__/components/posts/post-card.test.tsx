import { render, screen } from '@testing-library/react'
import { PostCard } from '@/app/posts/_components/post-card'
import type { Post } from '@/app/posts/page'
import { getPostImageUrls } from '@/lib/image-utils'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock components
jest.mock('@/components/posts/like-button', () => ({
  LikeButton: ({ postId, initialLikeCount }: { postId: string; initialLikeCount: number }) => (
    <div data-testid="like-button">{initialLikeCount}</div>
  ),
}))

jest.mock('@/app/posts/_components/post-image-gallery', () => ({
  PostImageGallery: ({ images }: { images: string[] }) => (
    <div data-testid="post-image-gallery">Gallery with {images.length} images</div>
  ),
}))

jest.mock('@/lib/image-utils', () => ({
  getPostImageUrls: jest.fn(),
}))

const mockGetPostImageUrls = getPostImageUrls as jest.MockedFunction<typeof getPostImageUrls>

describe('PostCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPostImageUrls.mockReturnValue([])
  })

  const mockPost: Post = {
    id: '1',
    author_id: 'user1',
    content: 'テスト投稿の内容です',
    post_type: 'general',
    privacy: 'public',
    tags: ['fitness', 'workout'],
    location: 'Tokyo, Japan',
    workout_data: null,
    like_count: 5,
    comment_count: 3,
    created_at: '2024-01-01T12:00:00Z',
    is_liked: false,
    profiles: {
      username: 'testuser',
      display_name: 'テストユーザー',
      avatar_url: null,
      fitness_level: 'intermediate',
    },
  }

  it('renders post content correctly', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('テスト投稿の内容です')).toBeInTheDocument()
    expect(screen.getByText('テストユーザー')).toBeInTheDocument()
    expect(screen.getByText('📍 Tokyo, Japan')).toBeInTheDocument()
  })

  it('displays formatted creation date', () => {
    render(<PostCard post={mockPost} />)
    
    // 日付が表示されることを確認（具体的な形式は環境により異なるため、存在確認のみ）
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('shows like and comment counts', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('5')).toBeInTheDocument() // like count
    expect(screen.getByText('3')).toBeInTheDocument() // comment count
  })

  it('displays post type badge for workout posts', () => {
    const workoutPost: Post = {
      ...mockPost,
      post_type: 'workout'
    }
    
    render(<PostCard post={workoutPost} />)
    
    expect(screen.getByText('ワークアウト')).toBeInTheDocument()
  })

  it('shows tags when provided', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByText('#fitness')).toBeInTheDocument()
    expect(screen.getByText('#workout')).toBeInTheDocument()
  })

  it('shows default counts when not provided', () => {
    const postWithoutCounts: Post = {
      ...mockPost,
      like_count: 0,
      comment_count: null,
    }
    
    render(<PostCard post={postWithoutCounts} />)
    
    expect(screen.getByText('0')).toBeInTheDocument() // like count
    expect(screen.getByText('0')).toBeInTheDocument() // comment count
  })

  it('displays user avatar when available', () => {
    const postWithAvatar: Post = {
      ...mockPost,
      profiles: {
        ...mockPost.profiles!,
        avatar_url: 'https://example.com/avatar.jpg',
      },
    }
    
    const { container } = render(<PostCard post={postWithAvatar} />)
    
    // Check if an image with the avatar URL is present
    const avatar = container.querySelector('img[src*="avatar.jpg"]')
    expect(avatar).toBeInTheDocument()
  })

  it('shows fallback initials when no avatar', () => {
    render(<PostCard post={mockPost} />)
    
    // Fallback should show user initials (just first character)
    expect(screen.getByText('T')).toBeInTheDocument() // "testuser" -> "T"
  })

  it('handles missing profile gracefully', () => {
    const postWithoutProfile: Post = {
      ...mockPost,
      profiles: undefined,
    }
    
    render(<PostCard post={postWithoutProfile} />)
    
    expect(screen.getByText('ユーザー')).toBeInTheDocument()
    expect(screen.getByText('US')).toBeInTheDocument() // Default initials
  })

  it('displays image when provided', () => {
    const postWithImage: Post = {
      ...mockPost,
      image_url: 'https://example.com/image.jpg',
    }
    
    render(<PostCard post={postWithImage} />)
    
    const image = screen.getByAltText('post image')
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('does not display image when not provided', () => {
    render(<PostCard post={mockPost} />)
    
    expect(screen.queryByAltText('post image')).not.toBeInTheDocument()
  })

  it('preserves line breaks in content', () => {
    const postWithMultilineContent: Post = {
      ...mockPost,
      content: '1行目\n2行目\n3行目',
    }
    
    render(<PostCard post={postWithMultilineContent} />)
    
    // Use function matcher to find content with line breaks
    const content = screen.getByText((content, element) => {
      return element?.textContent === '1行目\n2行目\n3行目'
    })
    expect(content).toHaveClass('whitespace-pre-wrap')
  })

  it('displays like and comment buttons', () => {
    render(<PostCard post={mockPost} />)
    
    // Check if buttons exist (accessibility check)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('displays image gallery when images are available', () => {
    const mockImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ]
    mockGetPostImageUrls.mockReturnValue(mockImages)
    
    render(<PostCard post={mockPost} />)
    
    expect(screen.getByTestId('post-image-gallery')).toBeInTheDocument()
    expect(screen.getByText('Gallery with 3 images')).toBeInTheDocument()
  })

  it('does not display image gallery when no images', () => {
    mockGetPostImageUrls.mockReturnValue([])
    
    render(<PostCard post={mockPost} />)
    
    expect(screen.queryByTestId('post-image-gallery')).not.toBeInTheDocument()
  })

  it('handles posts with post_images intermediate table', () => {
    const postWithPostImages: Post = {
      ...mockPost,
      post_images: [
        { id: 'img1', storage_path: 'user1/image1.jpg', display_order: 0, alt_text: 'Image 1' },
        { id: 'img2', storage_path: 'user1/image2.jpg', display_order: 1, alt_text: 'Image 2' },
      ],
    }
    
    const mockImages = [
      'https://example.com/storage/user1/image1.jpg',
      'https://example.com/storage/user1/image2.jpg'
    ]
    mockGetPostImageUrls.mockReturnValue(mockImages)
    
    render(<PostCard post={postWithPostImages} />)
    
    expect(mockGetPostImageUrls).toHaveBeenCalledWith(postWithPostImages)
    expect(screen.getByTestId('post-image-gallery')).toBeInTheDocument()
    expect(screen.getByText('Gallery with 2 images')).toBeInTheDocument()
  })

  it('calls getPostImageUrls with correct post data', () => {
    render(<PostCard post={mockPost} />)
    
    expect(mockGetPostImageUrls).toHaveBeenCalledWith(mockPost)
    expect(mockGetPostImageUrls).toHaveBeenCalledTimes(1)
  })
})