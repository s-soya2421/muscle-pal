/**
 * @jest-environment node
 */

import { renderToString } from 'react-dom/server'
import React from 'react'
import PostDetailPage from '@/app/posts/[id]/page'
import { getPostById, getPostComments } from '@/app/actions/posts'
import { notFound, usePathname } from 'next/navigation'

jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}))

jest.mock('@/app/actions/posts', () => ({
  getPostById: jest.fn(),
  getPostComments: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('Not Found')
  }),
  usePathname: jest.fn(() => '/posts/post-1'),
}))

const mockGetPostById = getPostById as jest.MockedFunction<typeof getPostById>
const mockGetPostComments = getPostComments as jest.MockedFunction<typeof getPostComments>
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('PostDetailPage (server)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders detail when post exists', async () => {
    mockUsePathname.mockReturnValue('/posts/post-1')
    mockGetPostById.mockResolvedValueOnce({
      id: 'post-1',
      content: 'テスト投稿の内容です',
      like_count: 5,
      comment_count: 3,
      created_at: '2024-01-01T00:00:00Z',
      post_type: 'general',
      profiles: { display_name: 'テストユーザー', username: 'testuser', avatar_url: null },
    } as unknown as Awaited<ReturnType<typeof getPostById>>)
    mockGetPostComments.mockResolvedValueOnce([])

    const element = await PostDetailPage({ params: Promise.resolve({ id: 'post-1' }) })
    const html = renderToString(element)

    expect(html).toContain('テスト投稿の内容です')
    expect(html).toContain('返信を投稿')
  })

  it('invokes notFound when post does not exist', async () => {
    mockGetPostById.mockResolvedValueOnce(null)
    mockGetPostComments.mockResolvedValueOnce([])

    await expect(PostDetailPage({ params: Promise.resolve({ id: 'missing' }) })).rejects.toThrow('Not Found')
    expect(mockNotFound).toHaveBeenCalled()
  })
})
