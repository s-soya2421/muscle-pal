/**
 * @jest-environment jsdom
 */
import { getPostImageUrls, convertImagePathsToUrls, processLegacyImages } from '@/lib/image-utils'
import { getImageUrl } from '@/lib/image-upload-client'

// Mock the image upload client
jest.mock('@/lib/image-upload-client')
const mockGetImageUrl = getImageUrl as jest.MockedFunction<typeof getImageUrl>

describe('convertImagePathsToUrls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetImageUrl.mockImplementation((path) => `https://example.com/storage/${path}`)
  })

  it('converts array of paths to URLs', () => {
    const paths = ['path1.jpg', 'path2.png', 'path3.webp']
    
    const result = convertImagePathsToUrls(paths)
    
    expect(result).toEqual([
      'https://example.com/storage/path1.jpg',
      'https://example.com/storage/path2.png',
      'https://example.com/storage/path3.webp',
    ])
    expect(mockGetImageUrl).toHaveBeenCalledTimes(3)
  })

  it('returns empty array for null input', () => {
    const result = convertImagePathsToUrls(null)
    expect(result).toEqual([])
    expect(mockGetImageUrl).not.toHaveBeenCalled()
  })

  it('returns empty array for non-array input', () => {
    const result = convertImagePathsToUrls('not-an-array' as unknown as string[])
    expect(result).toEqual([])
    expect(mockGetImageUrl).not.toHaveBeenCalled()
  })

  it('handles empty array', () => {
    const result = convertImagePathsToUrls([])
    expect(result).toEqual([])
    expect(mockGetImageUrl).not.toHaveBeenCalled()
  })
})

describe('processLegacyImages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetImageUrl.mockImplementation((path) => `https://example.com/storage/${path}`)
  })

  it('processes string array format', () => {
    const images = ['path1.jpg', 'path2.png']
    
    const result = processLegacyImages(images)
    
    expect(result).toEqual([
      'https://example.com/storage/path1.jpg',
      'https://example.com/storage/path2.png',
    ])
  })

  it('processes legacy object format with url property', () => {
    const images = [
      { url: 'https://example.com/image1.jpg', alt: 'Image 1' },
      { url: 'https://example.com/image2.jpg', alt: 'Image 2' },
    ]
    
    const result = processLegacyImages(images)
    
    expect(result).toEqual([
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ])
    expect(mockGetImageUrl).not.toHaveBeenCalled() // Direct URL, no conversion
  })

  it('returns empty array for null/undefined input', () => {
    expect(processLegacyImages(null)).toEqual([])
    expect(processLegacyImages(undefined)).toEqual([])
  })

  it('returns empty array for unrecognized format', () => {
    const result = processLegacyImages({ unexpected: 'format' })
    expect(result).toEqual([])
  })
})

describe('getPostImageUrls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetImageUrl.mockImplementation((path) => `https://example.com/storage/${path}`)
  })

  it('prioritizes post_images intermediate table format', () => {
    const post = {
      id: 'post1',
      post_images: [
        { id: 'img1', storage_path: 'user1/image1.jpg', display_order: 1, alt_text: 'Alt 1' },
        { id: 'img2', storage_path: 'user1/image2.jpg', display_order: 0, alt_text: 'Alt 2' },
      ],
      image_paths: ['old_path1.jpg', 'old_path2.jpg'], // Should be ignored
      images: ['legacy_image.jpg'], // Should be ignored
    }

    const result = getPostImageUrls(post)

    expect(result).toEqual([
      'https://example.com/storage/user1/image2.jpg', // display_order: 0 (first)
      'https://example.com/storage/user1/image1.jpg', // display_order: 1 (second)
    ])
    expect(mockGetImageUrl).toHaveBeenCalledWith('user1/image2.jpg')
    expect(mockGetImageUrl).toHaveBeenCalledWith('user1/image1.jpg')
  })

  it('falls back to image_paths when post_images not available', () => {
    const post = {
      id: 'post1',
      image_paths: ['path1.jpg', 'path2.jpg'],
      images: ['legacy_image.jpg'], // Should be ignored
    }

    const result = getPostImageUrls(post)

    expect(result).toEqual([
      'https://example.com/storage/path1.jpg',
      'https://example.com/storage/path2.jpg',
    ])
  })

  it('falls back to legacy images format', () => {
    const post = {
      id: 'post1',
      images: [
        { url: 'https://example.com/legacy1.jpg' },
        { url: 'https://example.com/legacy2.jpg' },
      ],
    }

    const result = getPostImageUrls(post)

    expect(result).toEqual([
      'https://example.com/legacy1.jpg',
      'https://example.com/legacy2.jpg',
    ])
  })

  it('handles mock data format with string array (full URLs)', () => {
    const post = {
      id: 'mock1',
      images: ['https://example.com/mock1.jpg', 'https://example.com/mock2.jpg'], // Full URLs
    }

    const result = getPostImageUrls(post)

    // Full URLs should be returned as-is
    expect(result).toEqual([
      'https://example.com/mock1.jpg',
      'https://example.com/mock2.jpg',
    ])
    expect(mockGetImageUrl).not.toHaveBeenCalled() // No conversion needed for full URLs
  })

  it('handles mock data format with storage paths', () => {
    const post = {
      id: 'mock1',
      images: ['mock1.jpg', 'mock2.jpg'], // Storage paths
    }

    const result = getPostImageUrls(post)

    // Storage paths should be converted to URLs
    expect(result).toEqual([
      'https://example.com/storage/mock1.jpg',
      'https://example.com/storage/mock2.jpg',
    ])
    expect(mockGetImageUrl).toHaveBeenCalledWith('mock1.jpg')
    expect(mockGetImageUrl).toHaveBeenCalledWith('mock2.jpg')
  })

  it('returns empty array when no images available', () => {
    const post = {
      id: 'post1',
      content: 'Post without images',
    }

    const result = getPostImageUrls(post)

    expect(result).toEqual([])
    expect(mockGetImageUrl).not.toHaveBeenCalled()
  })

  it('returns empty array for null/undefined post', () => {
    expect(getPostImageUrls(null)).toEqual([])
    expect(getPostImageUrls(undefined)).toEqual([])
    expect(mockGetImageUrl).not.toHaveBeenCalled()
  })

  it('sorts post_images by display_order correctly', () => {
    const post = {
      id: 'post1',
      post_images: [
        { id: 'img1', storage_path: 'user1/image1.jpg', display_order: 3, alt_text: 'Alt 1' },
        { id: 'img2', storage_path: 'user1/image2.jpg', display_order: 1, alt_text: 'Alt 2' },
        { id: 'img3', storage_path: 'user1/image3.jpg', display_order: 2, alt_text: 'Alt 3' },
        { id: 'img4', storage_path: 'user1/image4.jpg', display_order: 0, alt_text: 'Alt 4' },
      ],
    }

    const result = getPostImageUrls(post)

    expect(result).toEqual([
      'https://example.com/storage/user1/image4.jpg', // display_order: 0
      'https://example.com/storage/user1/image2.jpg', // display_order: 1
      'https://example.com/storage/user1/image3.jpg', // display_order: 2
      'https://example.com/storage/user1/image1.jpg', // display_order: 3
    ])
  })

  it('handles empty post_images array', () => {
    const post = {
      id: 'post1',
      post_images: [],
      image_paths: ['fallback.jpg'],
    }

    const result = getPostImageUrls(post)

    // Should fall back to image_paths when post_images is empty
    expect(result).toEqual(['https://example.com/storage/fallback.jpg'])
    expect(mockGetImageUrl).toHaveBeenCalledWith('fallback.jpg')
  })
})