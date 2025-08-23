/**
 * @jest-environment node
 */
import { createPost } from '@/app/actions/posts'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Mocks
jest.mock('@/lib/supabase/server')
jest.mock('next/cache')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>

// Mock Supabase client methods
const mockInsert = jest.fn()
const mockFrom = jest.fn()
const mockGetUser = jest.fn()

describe('createPost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
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

  const createFormData = (content: string, privacy: string = 'public') => {
    const formData = new FormData()
    formData.append('content', content)
    formData.append('privacy', privacy)
    return formData
  }

  it('successfully creates a post with valid data', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const formData = createFormData('テスト投稿です', 'public')
    
    await createPost(formData)
    
    expect(mockInsert).toHaveBeenCalledWith({
      author_id: 'user123',
      content: 'テスト投稿です',
      privacy: 'public',
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/posts')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('throws error when content is empty', async () => {
    const formData = createFormData('')
    
    await expect(createPost(formData)).rejects.toThrow('投稿内容は必須です')
  })

  it('throws error when content is only whitespace', async () => {
    const formData = createFormData('   \n\t   ')
    
    await expect(createPost(formData)).rejects.toThrow('投稿内容は必須です')
  })

  it('throws error when content exceeds 500 characters', async () => {
    const longContent = 'あ'.repeat(501)
    const formData = createFormData(longContent)
    
    await expect(createPost(formData)).rejects.toThrow('投稿内容は500文字以内で入力してください')
  })

  it('accepts content with exactly 500 characters', async () => {
    const mockUser = { id: 'user123' }
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    })
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const maxContent = 'あ'.repeat(500)
    const formData = createFormData(maxContent)
    
    await createPost(formData)
    
    expect(mockInsert).toHaveBeenCalledWith({
      author_id: 'user123',
      content: maxContent,
      privacy: 'public',
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
    })
  })
})