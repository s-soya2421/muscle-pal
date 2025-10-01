/**
 * @jest-environment node
 */

import { renderToString } from 'react-dom/server'
import PostDetailPage from '@/app/posts/[id]/page'
import { getPostById, getPostComments } from '@/app/actions/posts'
import { notFound } from 'next/navigation'

jest.mock('@/app/actions/posts', () => ({
  getPostById: jest.fn(),
  getPostComments: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('Not Found')
  }),
}))

const mockGetPostById = getPostById as jest.MockedFunction<typeof getPostById>
const mockGetPostComments = getPostComments as jest.MockedFunction<typeof getPostComments>
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>

describe('PostDetailPage (server)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders detail when post exists', async () => {
    mockGetPostById.mockResolvedValueOnce({
      id: 'post-1',
      content: 'テスト投稿の内容です',
      like_count: 5,
      comment_count: 3,
      created_at: '2024-01-01T00:00:00Z',
      post_type: 'general',
    } as unknown as Awaited<ReturnType<typeof getPostById>>)
    mockGetPostComments.mockResolvedValueOnce([])

    const element = await PostDetailPage({ params: Promise.resolve({ id: 'post-1' }) })
    const html = renderToString(element)

    expect(html).toContain('テスト投稿の内容です')
    expect(html).toContain('今話題のトレーニング')
    expect(html).toContain('おすすめのユーザー')
  })

  it('invokes notFound when post does not exist', async () => {
    mockGetPostById.mockResolvedValueOnce(null)
    mockGetPostComments.mockResolvedValueOnce([])

    await expect(PostDetailPage({ params: Promise.resolve({ id: 'missing' }) })).rejects.toThrow('Not Found')
    expect(mockNotFound).toHaveBeenCalled()
  })
})
