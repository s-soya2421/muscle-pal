/**
 * @jest-environment node
 */

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    Suspense: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

import React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { Writable } from 'stream'
import PostsPage from '@/app/posts/page'
import { getPosts } from '@/app/actions/posts'

jest.mock('@/components/layout/main-layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}))

jest.mock('@/app/posts/_components/create-post-form', () => ({
  CreatePostForm: () => <div data-testid="create-post-form">フォーム</div>,
}))

jest.mock('@/app/posts/_components/post-card', () => ({
  PostCard: ({ post }: { post: { content: string } }) => <div data-testid="post-card">{post.content}</div>,
}))

jest.mock('@/app/actions/posts', () => ({
  getPosts: jest.fn(),
}))

const mockGetPosts = getPosts as jest.MockedFunction<typeof getPosts>

type PostsResult = Awaited<ReturnType<typeof getPosts>>

const renderToStringAsync = (element: React.ReactElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    let html = ''
    const stream = renderToPipeableStream(element, {
      onAllReady() {
        const writable = new Writable({
          write(chunk, _encoding, callback) {
            html += chunk.toString()
            callback()
          },
        })

        writable.on('finish', () => resolve(html))
        writable.on('error', reject)

        stream.pipe(writable)
      },
      onError(err) {
        reject(err)
      },
    })
  })
}

describe('PostsPage (server)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state when no posts exist', async () => {
    mockGetPosts.mockResolvedValueOnce([])

    const element = await PostsPage()
    const html = await renderToStringAsync(element)

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
      } as unknown as PostsResult[number],
    ])

    const element = await PostsPage()
    const html = await renderToStringAsync(element)

    expect(html).toContain('こんにちは')
  })

  it('handles data-fetch errors by returning empty list', async () => {
    mockGetPosts.mockRejectedValueOnce(new Error('Database error'))

    const element = await PostsPage()
    const html = await renderToStringAsync(element)

    expect(html).toContain('まだ投稿がありません')
  })
})
