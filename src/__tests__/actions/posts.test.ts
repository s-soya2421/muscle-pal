/**
 * @jest-environment node
 */

import {
  createPost,
  getPosts,
  getPostById,
  getPostComments,
  createComment,
} from '@/app/actions/posts'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { uploadPostImages } from '@/lib/post-images-server'
import { revalidatePath } from 'next/cache'

describe('Server actions: posts', () => {
  const mockCreateClient = createServerClient as jest.MockedFunction<typeof createServerClient>
  const mockUpload = uploadPostImages as jest.MockedFunction<typeof uploadPostImages>
  const mockRevalidate = revalidatePath as jest.MockedFunction<typeof revalidatePath>

  beforeEach(() => {
    jest.resetAllMocks()
  })

  const buildQuery = (initial: { data: any; error: any }) => {
    const query: any = {
      result: initial,
      insert: jest.fn(() => query),
      update: jest.fn(() => query),
      delete: jest.fn(() => query),
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      match: jest.fn(() => query),
      is: jest.fn(() => query),
      order: jest.fn(() => query),
      limit: jest.fn(() => query),
      range: jest.fn(() => query),
      single: jest.fn(() => Promise.resolve(query.result)),
      maybeSingle: jest.fn(() => Promise.resolve(query.result)),
      then: jest.fn((resolve, reject) => Promise.resolve(query.result).then(resolve, reject)),
    }
    return query
  }

  const createMockClient = (options: {
    user?: any
    tables?: Record<string, ReturnType<typeof buildQuery>>
    rpcResult?: { data: any; error: any }
  }) => {
    const tables = options.tables ?? {}
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue(
          options.user ?? { data: { user: { id: 'user-123' } }, error: null }
        ),
      },
      from: jest.fn((table: string) => {
        const query = tables[table]
        if (!query) {
          throw new Error(`Unexpected table access: ${table}`)
        }
        return query
      }),
      rpc: jest.fn().mockResolvedValue(options.rpcResult ?? { data: null, error: null }),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
          remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      },
    }
  }

  jest.mock('@/lib/supabase/server')
  jest.mock('@/lib/post-images-server')
  jest.mock('next/cache')

  afterAll(() => {
    jest.resetModules()
  })

  describe('createPost', () => {
    it('creates post and revalidates feeds', async () => {
      const postsQuery = buildQuery({ data: { id: 'post-1' }, error: null })
      const mockClient = createMockClient({ tables: { posts: postsQuery } })
      mockCreateClient.mockResolvedValueOnce(mockClient as any)

      const form = new FormData()
      form.append('content', '  テスト投稿  ')
      form.append('privacy', 'public')

      await createPost(form)

      expect(postsQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'テスト投稿',
          privacy: 'public',
          author_id: 'user-123',
        })
      )
      expect(mockUpload).not.toHaveBeenCalled()
      expect(mockRevalidate).toHaveBeenCalledWith('/posts')
      expect(mockRevalidate).toHaveBeenCalledWith('/dashboard')
    })

    it('uploads images when provided', async () => {
      const postsQuery = buildQuery({ data: { id: 'post-img' }, error: null })
      const mockClient = createMockClient({ tables: { posts: postsQuery } })
      mockCreateClient.mockResolvedValueOnce(mockClient as any)

      const file = new File(['binary'], 'photo.jpg', { type: 'image/jpeg' })
      const form = new FormData()
      form.append('content', 'with image')
      form.append('privacy', 'public')
      form.append('image_0', file)

      await createPost(form)

      expect(mockUpload).toHaveBeenCalledWith([file], 'post-img', 'user-123')
    })

    it('throws when user is not authenticated', async () => {
      const mockClient = createMockClient({
        user: { data: { user: null }, error: null },
        tables: {
          posts: buildQuery({ data: null, error: null }),
        },
      })
      mockCreateClient.mockResolvedValueOnce(mockClient as any)

      await expect(createPost(new FormData())).rejects.toThrow('ログインが必要です')
    })
  })

  describe('getPosts', () => {
    it('returns posts with like status', async () => {
      const postsResult = [{ id: 'p1', content: 'Hi', like_count: 0, comment_count: 0 }]
      const postsQuery = buildQuery({ data: postsResult, error: null })
      const likeStatusQuery = buildQuery({ data: { id: 'like-1' }, error: null })
      likeStatusQuery.single = jest.fn(() => Promise.resolve({ data: { id: 'like-1' }, error: null }))

      const mockClient = createMockClient({
        tables: {
          posts: postsQuery,
          post_likes: likeStatusQuery,
        },
      })
      mockCreateClient.mockResolvedValueOnce(mockClient as any)

      const posts = await getPosts()

      expect(posts).toHaveLength(1)
      expect(posts[0]).toMatchObject({ id: 'p1', is_liked: true })
    })
  })

  describe('getPostById', () => {
    it('hydrates post with likes and comments', async () => {
      const post = {
        id: 'post-1',
        content: 'hello',
        like_count: 1,
        comment_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        post_type: 'general',
      }

      const postQuery = buildQuery({ data: post, error: null })
      postQuery.single = jest.fn(() => Promise.resolve({ data: post, error: null }))

      const likeCountQuery = buildQuery({ data: [{ id: 'l1' }], error: null })
      const likeStatusQuery = buildQuery({ data: { id: 'l1' }, error: null })
      likeStatusQuery.single = jest.fn(() => Promise.resolve({ data: { id: 'l1' }, error: null }))
      const commentCountQuery = buildQuery({ data: [{ id: 'c1' }, { id: 'c2' }], error: null })

      const mockClient = createMockClient({
        tables: {
          posts: postQuery,
          post_likes: likeCountQuery,
          post_comments: commentCountQuery,
        },
      })

      // second call to `from('post_likes')` should use likeStatusQuery
      ;(mockClient.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'posts') return postQuery
        if (table === 'post_likes') {
          const callCount = (mockClient.from as jest.Mock).mock.calls.filter((c) => c[0] === 'post_likes').length
          return callCount === 1 ? likeCountQuery : likeStatusQuery
        }
        if (table === 'post_comments') return commentCountQuery
        throw new Error(`Unexpected table ${table}`)
      })

      mockCreateClient.mockResolvedValueOnce(mockClient as any)

      const result = await getPostById('post-1')

      expect(result).toMatchObject({
        id: 'post-1',
        like_count: 1,
        comment_count: 2,
        is_liked: true,
      })
    })
  })

  describe('getPostComments', () => {
    it('returns ordered comments', async () => {
      const comments = [{ id: 'c1', content: 'Nice' }]
      const commentsQuery = buildQuery({ data: comments, error: null })
      const mockClient = createMockClient({
        tables: { post_comments: commentsQuery },
      })
      mockCreateClient.mockResolvedValueOnce(mockClient as any)

      const result = await getPostComments('post-1')

      expect(result).toEqual(comments)
      expect(commentsQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })
  })

  describe('createComment', () => {
    it('inserts a new comment and revalidates page', async () => {
      const commentResult = { id: 'c1', content: 'ナイス！' }
      const commentQuery = buildQuery({ data: commentResult, error: null })
      commentQuery.single = jest.fn(() => Promise.resolve({ data: commentResult, error: null }))

      const mockClient = createMockClient({ tables: { post_comments: commentQuery } })
      mockCreateClient.mockResolvedValueOnce(mockClient as any)

      const created = await createComment('post-1', 'ナイス！')

      expect(commentQuery.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        author_id: 'user-123',
        content: 'ナイス！',
      })
      expect(created).toMatchObject(commentResult)
      expect(mockRevalidate).toHaveBeenCalledWith('/posts/post-1')
    })
  })
})
