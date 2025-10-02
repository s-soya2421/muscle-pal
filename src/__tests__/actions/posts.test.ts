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

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/post-images-server', () => ({
  uploadPostImages: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

type MockQueryResult<T> = { data: T; error: unknown }

type PromiseHandlers<T> = [
  ((value: MockQueryResult<T>) => unknown) | undefined,
  ((reason: unknown) => unknown) | undefined
]

type MockQuery<T> = {
  result: MockQueryResult<T>
  insert: jest.Mock<MockQuery<T>, [unknown?]>
  update: jest.Mock<MockQuery<T>, [unknown?]>
  delete: jest.Mock<MockQuery<T>, [unknown?]>
  select: jest.Mock<MockQuery<T>, [unknown?]>
  eq: jest.Mock<MockQuery<T>, [string, unknown]>
  match: jest.Mock<MockQuery<T>, [Record<string, unknown>]>
  is: jest.Mock<MockQuery<T>, [string, unknown]>
  order: jest.Mock<MockQuery<T>, [string, { ascending?: boolean }?]>
  limit: jest.Mock<MockQuery<T>, [number]>
  range: jest.Mock<MockQuery<T>, [number, number]>
  single: jest.Mock<Promise<MockQueryResult<T>>, []>
  maybeSingle: jest.Mock<Promise<MockQueryResult<T>>, []>
  then: jest.Mock<Promise<MockQueryResult<T>>, PromiseHandlers<T>>
}

type CreateMockClientOptions = {
  user?: { data: { user: { id: string } | null }; error: unknown }
  tables?: Record<string, MockQuery<unknown>>
  rpcResult?: MockQueryResult<unknown>
}

type MockSupabaseClient = {
  auth: {
    getUser: jest.Mock<Promise<{ data: { user: { id: string } | null }; error: unknown }>, []>
  }
  from: jest.Mock<MockQuery<unknown>, [string]>
  rpc: jest.Mock<Promise<MockQueryResult<unknown>>, [string, Record<string, unknown>?]>
  storage: {
    from: jest.Mock<
      {
        upload: jest.Mock<Promise<{ data: { path: string }; error: null }>, [string, Blob]>
        remove: jest.Mock<Promise<{ data: null; error: null }>, [string[]]>
      },
      [string]
    >
  }
}

type SupabaseClientLike = Awaited<ReturnType<typeof createServerClient>>

describe('Server actions: posts', () => {
  const mockCreateClient = createServerClient as jest.MockedFunction<typeof createServerClient>
  const mockUpload = uploadPostImages as jest.MockedFunction<typeof uploadPostImages>
  const mockRevalidate = revalidatePath as jest.MockedFunction<typeof revalidatePath>

  beforeEach(() => {
    jest.resetAllMocks()
  })

  const buildQuery = <T>(initial: MockQueryResult<T>): MockQuery<T> => {
    const query: Partial<MockQuery<T>> = {
      result: initial,
    }

    query.insert = jest.fn(() => query as MockQuery<T>)
    query.update = jest.fn(() => query as MockQuery<T>)
    query.delete = jest.fn(() => query as MockQuery<T>)
    query.select = jest.fn(() => query as MockQuery<T>)
    query.eq = jest.fn(() => query as MockQuery<T>)
    query.match = jest.fn(() => query as MockQuery<T>)
    query.is = jest.fn(() => query as MockQuery<T>)
    query.order = jest.fn(() => query as MockQuery<T>)
    query.limit = jest.fn(() => query as MockQuery<T>)
    query.range = jest.fn(() => query as MockQuery<T>)
    query.single = jest.fn(() => Promise.resolve(query.result as MockQueryResult<T>))
    query.maybeSingle = jest.fn(() => Promise.resolve(query.result as MockQueryResult<T>))
    query.then = jest.fn((resolve, reject) =>
      Promise.resolve(query.result as MockQueryResult<T>).then(resolve, reject)
    )

    return query as MockQuery<T>
  }

  const createMockClient = (options: CreateMockClientOptions = {}): MockSupabaseClient => {
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

  const resolveMockClient = (client: MockSupabaseClient) =>
    mockCreateClient.mockResolvedValueOnce(client as unknown as SupabaseClientLike)

  afterAll(() => {
    jest.resetModules()
  })

  describe('createPost', () => {
    it('creates post and revalidates feeds', async () => {
      const postsQuery = buildQuery({ data: { id: 'post-1' }, error: null })
      const mockClient = createMockClient({ tables: { posts: postsQuery } })
      resolveMockClient(mockClient)

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
      resolveMockClient(mockClient)

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
      resolveMockClient(mockClient)

      const form = new FormData()
      form.append('content', 'テスト投稿')

      await expect(createPost(form)).rejects.toThrow('ログインが必要です')
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
      resolveMockClient(mockClient)

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

      resolveMockClient(mockClient)

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
      const likesQuery = buildQuery({ data: [], error: null })
      const mockClient = createMockClient({
        tables: {
          post_comments: commentsQuery,
          post_likes: likesQuery,
        },
      })
      resolveMockClient(mockClient)

      const result = await getPostComments('post-1')

      expect(result).toMatchObject([{ id: 'c1', content: 'Nice', likes: 0 }])
      expect(commentsQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })
  })

  describe('createComment', () => {
    it('inserts a new comment and revalidates page', async () => {
      const commentResult = { id: 'c1', content: 'ナイス！' }
      const commentQuery = buildQuery({ data: commentResult, error: null })
      commentQuery.single = jest.fn(() => Promise.resolve({ data: commentResult, error: null }))

      const mockClient = createMockClient({ tables: { post_comments: commentQuery } })
      resolveMockClient(mockClient)

      const created = await createComment('post-1', 'ナイス！')

      expect(commentQuery.insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        author_id: 'user-123',
        content: 'ナイス！',
      })
      expect(created).toMatchObject({ ...commentResult, likes: 0 })
      expect(mockRevalidate).toHaveBeenCalledWith('/posts/post-1')
    })
  })
})
