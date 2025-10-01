/**
 * @jest-environment node
 */

import { renderToString } from 'react-dom/server'
import PostsPage from '@/app/posts/page'
import { getPosts } from '@/app/actions/posts'

jest.mock('@/app/actions/posts', () => ({
  getPosts: jest.fn(),
}))

const mockGetPosts = getPosts as jest.MockedFunction<typeof getPosts>

describe('PostsPage (server)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state when no posts exist', async () => {
    mockGetPosts.mockResolvedValueOnce([])

    const element = await PostsPage()
    const html = renderToString(element)

    expect(html).toContain('まだ投稿がありません')
  })

  it('renders posts when data is returned', async () => {
    mockGetPosts.mockResolvedValueOnce([
      {
        id: 'post-1',
        content: 'こんにちは',
        like_count: 0,
        comment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        post_type: 'general',
      } as any,
    ])

    const element = await PostsPage()
    const html = renderToString(element)

    expect(html).toContain('こんにちは')
  })

  it('handles data-fetch errors by returning empty list', async () => {
    mockGetPosts.mockRejectedValueOnce(new Error('Database error'))

    const element = await PostsPage()
    const html = renderToString(element)

    expect(html).toContain('まだ投稿がありません')
  })
})
