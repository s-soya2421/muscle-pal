/**
 * @jest-environment node
 */
import { createPost, getPosts, getPostById, getPostComments, createComment } from '@/app/actions/posts'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { uploadPostImages } from '@/lib/post-images-server'

// Mocks
jest.mock('@/lib/supabase/server')
jest.mock('next/cache')
jest.mock('@/lib/post-images-server')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
const mockUploadPostImages = uploadPostImages as jest.MockedFunction<typeof uploadPostImages>

// Mock Supabase client methods
const mockInsert = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockGetUser = jest.fn()
const mockEq = jest.fn()
const mockIs = jest.fn()
const mockOrder = jest.fn()
const mockSingle = jest.fn()
const mockLimit = jest.fn()

describe('createPost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    })
    mockSelect.mockReturnValue({
      single: mockSingle,
    })
    mockInsert.mockReturnValue({
      select: mockSelect,
    })
    mockFrom.mockReturnValue({
      insert: mockInsert,
    })
    
    mockCreateServerClient.mockResolvedValue({
      from: mockFrom,
      auth: {
        getUser: mockGetUser,
      },
    })
  })

  const createFormData = (content: string, privacy: string = 'public', images: File[] = []) => {
    const formData = new FormData()
    formData.append('content', content)
    formData.append('privacy', privacy)
    images.forEach((image, index) => {
      formData.append(`image_${index}`, image)
    })
    return formData
  }

  const createMockImage = (name: string = 'test.jpg', size: number = 1000): File => {
    return new File(['test'], name, { type: 'image/jpeg', lastModified: Date.now() })
  }

  it('successfully creates a post with valid data', async () => {
    const mockUser = { id: 'user123' }
    const mockPostData = { id: 'post123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockSelect.mockResolvedValueOnce({
      data: mockPostData,
      error: null,
    })
    mockInsert.mockReturnValue({
      select: mockSelect
    })

    const formData = createFormData('テスト投稿です', 'public')
    
    await createPost(formData)
    
    expect(mockInsert).toHaveBeenCalledWith({
      author_id: 'user123',
      content: 'テスト投稿です',
      privacy: 'public',
      post_type: 'general',
      tags: [],
      location: null,
      workout_data: {},
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/posts')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('successfully creates a post with images', async () => {
    const mockUser = { id: 'user123' }
    const mockPostData = { id: 'post123' }
    const mockImages = [createMockImage('test1.jpg'), createMockImage('test2.jpg')]
    
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockSelect.mockResolvedValueOnce({
      data: mockPostData,
      error: null,
    })
    mockInsert.mockReturnValue({
      select: mockSelect
    })
    mockUploadPostImages.mockResolvedValueOnce([
      { id: 'img1', storage_path: 'path1', url: 'url1', display_order: 0 },
      { id: 'img2', storage_path: 'path2', url: 'url2', display_order: 1 }
    ])

    const formData = createFormData('テスト投稿です', 'public', mockImages)
    
    await createPost(formData)
    
    expect(mockUploadPostImages).toHaveBeenCalledWith(mockImages, 'post123', 'user123')
  })

  it('handles image upload errors gracefully', async () => {
    const mockUser = { id: 'user123' }
    const mockPostData = { id: 'post123' }
    const mockImages = [createMockImage('test.jpg')]
    
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockSelect.mockResolvedValueOnce({
      data: mockPostData,
      error: null,
    })
    mockInsert.mockReturnValue({
      select: mockSelect
    })
    mockUploadPostImages.mockRejectedValueOnce(new Error('アップロードエラー'))

    const formData = createFormData('テスト投稿です', 'public', mockImages)
    
    await expect(createPost(formData)).rejects.toThrow('投稿は作成されましたが、画像のアップロードに失敗しました')
    expect(mockUploadPostImages).toHaveBeenCalledWith(mockImages, 'post123', 'user123')
  })

  it('skips image upload when no images provided', async () => {
    const mockUser = { id: 'user123' }
    const mockPostData = { id: 'post123' }
    
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockSelect.mockResolvedValueOnce({
      data: mockPostData,
      error: null,
    })
    mockInsert.mockReturnValue({
      select: mockSelect
    })

    const formData = createFormData('テスト投稿です', 'public')
    
    await createPost(formData)
    
    expect(mockUploadPostImages).not.toHaveBeenCalled()
  })

  it('throws error when content is empty', async () => {
    const formData = createFormData('')
    
    await expect(createPost(formData)).rejects.toThrow('投稿内容は必須です')
  })

  it('throws error when content is only whitespace', async () => {
    const formData = createFormData('   \n\t   ')
    
    await expect(createPost(formData)).rejects.toThrow('投稿内容は必須です')
  })

  it('throws error when content exceeds 1000 characters', async () => {
    const longContent = 'あ'.repeat(1001)
    const formData = createFormData(longContent)
    
    await expect(createPost(formData)).rejects.toThrow('投稿内容は1000文字以内で入力してください')
  })

  it('accepts content with exactly 1000 characters', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const maxContent = 'あ'.repeat(1000)
    const formData = createFormData(maxContent)
    
    await createPost(formData)
    
    expect(mockInsert).toHaveBeenCalledWith({
      author_id: 'user123',
      content: maxContent,
      privacy: 'public',
      post_type: 'general',
      tags: [],
      location: null,
      workout_data: {},
    })
  })

  it('uses default privacy when not provided', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const formData = new FormData()
    formData.append('content', 'テスト投稿です')
    // privacy is not set
    
    await createPost(formData)
    
    expect(mockInsert).toHaveBeenCalledWith({
      author_id: 'user123',
      content: 'テスト投稿です',
      privacy: 'public',
      post_type: 'general',
      tags: [],
      location: null,
      workout_data: {},
    })
  })

  it('handles different privacy settings', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const formData = createFormData('テスト投稿です', 'followers')
    
    await createPost(formData)
    
    expect(mockInsert).toHaveBeenCalledWith({
      author_id: 'user123',
      content: 'テスト投稿です',
      privacy: 'followers',
      post_type: 'general',
      tags: [],
      location: null,
      workout_data: {},
    })
  })

  it('throws error when authentication fails', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Authentication failed' },
    })

    const formData = createFormData('テスト投稿です')
    
    await expect(createPost(formData)).rejects.toThrow('認証に失敗しました')
  })

  it('throws error when user is not found', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const formData = createFormData('テスト投稿です')
    
    await expect(createPost(formData)).rejects.toThrow('ログインが必要です')
  })

  it('throws error when database insertion fails', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    const formData = createFormData('テスト投稿です')
    
    await expect(createPost(formData)).rejects.toThrow('投稿に失敗しました')
  })

  it('logs errors to console in development', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const mockUser = { id: 'user123' }
    
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error', code: '12345' },
    })

    const formData = createFormData('テスト投稿です')
    
    await expect(createPost(formData)).rejects.toThrow('投稿に失敗しました')
    
    expect(consoleSpy).toHaveBeenCalledWith('投稿エラー:', {
      message: 'Database error',
      code: '12345',
    })
    
    consoleSpy.mockRestore()
  })

  it('trims content before validation', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const formData = createFormData('  テスト投稿です  ')
    
    await createPost(formData)
    
    expect(mockInsert).toHaveBeenCalledWith({
      author_id: 'user123',
      content: 'テスト投稿です',
      privacy: 'public',
      post_type: 'general',
      tags: [],
      location: null,
      workout_data: {},
    })
  })
})

describe('getPosts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Chain mock setup for posts query
    mockOrder.mockReturnValue({ data: [], error: null })
    mockIs.mockReturnValue(mockOrder)
    mockSelect.mockReturnValue(mockIs)
    mockFrom.mockReturnValue(mockSelect)
    
    // Mock for like status query
    const mockLikeSingle = jest.fn().mockResolvedValue({ data: null, error: null })
    const mockLikeIs = jest.fn().mockReturnValue(mockLikeSingle)
    const mockLikeEq = jest.fn().mockReturnValue(mockLikeIs)
    const mockLikeSelect = jest.fn().mockReturnValue(mockLikeEq)
    const mockLikeFrom = jest.fn().mockReturnValue(mockLikeSelect)
    
    mockCreateServerClient.mockResolvedValue({
      from: jest.fn((table) => {
        if (table === 'posts') return mockFrom
        if (table === 'post_likes') return mockLikeFrom
        return mockFrom
      }),
      auth: {
        getUser: mockGetUser,
      },
    })
  })

  it('successfully fetches posts with like status', async () => {
    const mockUser = { id: 'user123' }
    const mockPosts = [
      {
        id: 'post1',
        content: 'テスト投稿1',
        author_id: 'user456',
        like_count: 5,
        comment_count: 3,
        created_at: '2025-01-15T10:00:00Z',
        profiles: {
          username: 'testuser',
          display_name: 'Test User'
        }
      }
    ]
    
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    
    mockOrder.mockResolvedValue({
      data: mockPosts,
      error: null,
    })

    const result = await getPosts()
    
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'post1',
      content: 'テスト投稿1',
      is_liked: false,
    })
  })

  it('throws error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    await expect(getPosts()).rejects.toThrow('ログインが必要です')
  })

  it('handles database fetch errors', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    await expect(getPosts()).rejects.toThrow('投稿の取得に失敗しました')
  })
})

describe('getPostById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSingle.mockReturnValue({ data: null, error: null })
    mockIs.mockReturnValue(mockSingle)
    mockEq.mockReturnValue(mockIs)  
    mockSelect.mockReturnValue(mockEq)
    mockFrom.mockReturnValue(mockSelect)
    
    mockCreateServerClient.mockResolvedValue({
      from: mockFrom,
      auth: {
        getUser: mockGetUser,
      },
    })
  })

  it('successfully fetches a post by id', async () => {
    const mockUser = { id: 'user123' }
    const mockPost = {
      id: 'post1',
      content: 'テスト投稿1',
      author_id: 'user456',
      like_count: 5,
      comment_count: 3,
      created_at: '2025-01-15T10:00:00Z',
      profiles: {
        username: 'testuser',
        display_name: 'Test User'
      }
    }
    
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    
    mockSingle.mockResolvedValueOnce({
      data: mockPost,
      error: null,
    })

    const result = await getPostById('post1')
    
    expect(result).toMatchObject(mockPost)
    expect(mockEq).toHaveBeenCalledWith('id', 'post1')
  })

  it('returns null when post is not found', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await getPostById('nonexistent')
    
    expect(result).toBeNull()
  })
})

describe('createComment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSelect.mockReturnValue({ data: [], error: null })
    mockInsert.mockReturnValue(mockSelect)
    mockFrom.mockReturnValue(mockInsert)
    
    mockCreateServerClient.mockResolvedValue({
      from: mockFrom,
      auth: {
        getUser: mockGetUser,
      },
    })
  })

  it('successfully creates a comment', async () => {
    const mockUser = { id: 'user123' }
    const mockComment = {
      id: 'comment1',
      post_id: 'post1',
      author_id: 'user123',
      content: 'テストコメント',
      created_at: '2025-01-15T10:00:00Z',
      profiles: {
        username: 'testuser',
        display_name: 'Test User'
      }
    }
    
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    
    mockSelect.mockResolvedValueOnce({
      data: [mockComment],
      error: null,
    })

    const result = await createComment('post1', 'テストコメント')
    
    expect(mockInsert).toHaveBeenCalledWith({
      post_id: 'post1',
      author_id: 'user123',
      content: 'テストコメント',
    })
    expect(result).toMatchObject(mockComment)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/posts/post1')
  })

  it('throws error when content is empty', async () => {
    await expect(createComment('post1', '')).rejects.toThrow('コメント内容は必須です')
  })

  it('throws error when content is only whitespace', async () => {
    await expect(createComment('post1', '   \n\t   ')).rejects.toThrow('コメント内容は必須です')
  })

  it('throws error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    await expect(createComment('post1', 'テストコメント')).rejects.toThrow('認証に失敗しました')
  })

  it('trims comment content', async () => {
    const mockUser = { id: 'user123' }
    const mockComment = {
      id: 'comment1',
      post_id: 'post1',
      author_id: 'user123',
      content: 'テストコメント',
      created_at: '2025-01-15T10:00:00Z',
    }
    
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    
    mockSelect.mockResolvedValueOnce({
      data: [mockComment],
      error: null,
    })

    await createComment('post1', '  テストコメント  ')
    
    expect(mockInsert).toHaveBeenCalledWith({
      post_id: 'post1',
      author_id: 'user123',
      content: 'テストコメント',
    })
  })
})