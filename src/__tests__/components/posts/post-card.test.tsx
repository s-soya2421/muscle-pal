import { render, screen } from '@testing-library/react'
import { PostCard } from '@/app/posts/_components/post-card'

type PostCardData = Parameters<typeof PostCard>[0]['post']

describe('PostCard', () => {
  const basePost = {
    id: 'post-1',
    content: 'テスト投稿の内容です',
    created_at: '2024-01-01T00:00:00Z',
    author_id: 'user-1',
    like_count: 5,
    comment_count: 3,
    post_type: 'general',
    tags: ['fitness'],
    location: 'Tokyo, Japan',
    media_urls: [],
  } as unknown as PostCardData

  it('renders post content and metadata', () => {
    render(<PostCard post={basePost} />)

    expect(screen.getByText('テスト投稿の内容です')).toBeInTheDocument()
    expect(screen.getByText('ユーザー')).toBeInTheDocument()
    expect(screen.getByText('📍 Tokyo, Japan')).toBeInTheDocument()
  })

  it('shows image gallery when URLs are present', () => {
    const postWithImages = {
      ...basePost,
      media_urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    }

    render(<PostCard post={postWithImages} />)

    expect(screen.getByTestId('post-image-gallery')).toBeInTheDocument()
  })

  it('falls back to initials when no avatar', () => {
    render(<PostCard post={basePost} />)

    expect(screen.getByText('ユ')).toBeInTheDocument()
  })
})
