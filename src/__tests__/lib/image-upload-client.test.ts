/**
 * @jest-environment jsdom
 */
import { validateImages, IMAGE_CONFIG, getImageUrl } from '@/lib/image-upload-client'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const createMockFile = (
  name: string,
  type: string,
  size: number
): File => {
  return new File(['test'], name, { type, lastModified: Date.now() })
}

describe('IMAGE_CONFIG', () => {
  it('has correct configuration values', () => {
    expect(IMAGE_CONFIG.MAX_SIZE).toBe(5 * 1024 * 1024) // 5MB
    expect(IMAGE_CONFIG.MAX_COUNT).toBe(4)
    expect(IMAGE_CONFIG.ALLOWED_TYPES).toEqual(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
    expect(IMAGE_CONFIG.BUCKET_NAME).toBe('posts-images')
  })
})

describe('validateImages', () => {
  it('returns null for valid images', () => {
    const validImages = [
      createMockFile('test1.jpg', 'image/jpeg', 1000000), // 1MB
      createMockFile('test2.png', 'image/png', 2000000), // 2MB
    ]

    const result = validateImages(validImages)
    expect(result).toBeNull()
  })

  it('returns error when too many images', () => {
    const tooManyImages = Array.from({ length: 5 }, (_, i) =>
      createMockFile(`test${i}.jpg`, 'image/jpeg', 1000000)
    )

    const result = validateImages(tooManyImages)
    expect(result).toEqual({
      type: 'count',
      message: '画像は最大4枚までアップロードできます',
    })
  })

  it('returns error when image is too large', () => {
    const largeImage = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024) // 6MB
    
    // Mock File size property
    Object.defineProperty(largeImage, 'size', {
      value: 6 * 1024 * 1024,
      configurable: true
    })
    
    const result = validateImages([largeImage])
    expect(result).toEqual({
      type: 'size',
      message: '画像サイズは5MB以下にしてください',
    })
  })

  it('returns error for unsupported file types', () => {
    const unsupportedImage = createMockFile('test.gif', 'image/gif', 1000000)
    
    const result = validateImages([unsupportedImage])
    expect(result).toEqual({
      type: 'type',
      message: 'JPEG, PNG, WebP形式の画像のみアップロードできます',
    })
  })

  it('validates multiple images and returns first error', () => {
    const largeImage = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024)
    Object.defineProperty(largeImage, 'size', {
      value: 6 * 1024 * 1024,
      configurable: true
    })
    
    const invalidImages = [
      largeImage, // Too large
      createMockFile('unsupported.gif', 'image/gif', 1000000), // Wrong type
    ]

    const result = validateImages(invalidImages)
    expect(result?.type).toBe('size') // First error
  })

  it('handles edge case of exactly max size', () => {
    const maxSizeImage = createMockFile('max.jpg', 'image/jpeg', IMAGE_CONFIG.MAX_SIZE)
    
    const result = validateImages([maxSizeImage])
    expect(result).toBeNull()
  })

  it('handles edge case of exactly max count', () => {
    const maxCountImages = Array.from({ length: IMAGE_CONFIG.MAX_COUNT }, (_, i) =>
      createMockFile(`test${i}.jpg`, 'image/jpeg', 1000000)
    )

    const result = validateImages(maxCountImages)
    expect(result).toBeNull()
  })

  it('handles empty array', () => {
    const result = validateImages([])
    expect(result).toBeNull()
  })
})

describe('getImageUrl', () => {
  const mockStorage = {
    from: jest.fn(),
  }
  const mockGetPublicUrl = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockStorage.from.mockReturnValue({
      getPublicUrl: mockGetPublicUrl,
    })
    
    mockCreateClient.mockReturnValue({
      storage: mockStorage,
    } as ReturnType<typeof createClient>)
  })

  it('generates correct public URL using Supabase client', () => {
    const storagePath = 'user123/1234567890-0.jpg'
    const expectedUrl = 'https://example.supabase.co/storage/v1/object/public/posts-images/user123/1234567890-0.jpg'

    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: expectedUrl },
    })

    const result = getImageUrl(storagePath)

    expect(mockStorage.from).toHaveBeenCalledWith('posts-images')
    expect(mockGetPublicUrl).toHaveBeenCalledWith(storagePath)
    expect(result).toBe(expectedUrl)
  })

  it('returns placeholder SVG when error occurs', () => {
    const storagePath = 'user123/invalid.jpg'
    
    mockGetPublicUrl.mockImplementation(() => {
      throw new Error('Storage error')
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const result = getImageUrl(storagePath)

    expect(result).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(consoleSpy).toHaveBeenCalledWith('画像URL生成エラー:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('handles different storage paths correctly', () => {
    const testCases = [
      'user1/image.jpg',
      'user2/subfolder/image.png',
      'user3/1234567890-0.webp',
    ]

    const mockUrl = 'https://example.supabase.co/storage/v1/object/public/posts-images/'

    testCases.forEach((storagePath) => {
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: mockUrl + storagePath },
      })

      const result = getImageUrl(storagePath)
      
      expect(result).toBe(mockUrl + storagePath)
      expect(mockGetPublicUrl).toHaveBeenCalledWith(storagePath)
    })
  })
})