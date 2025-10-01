/**
 * @jest-environment node
 */

import { renderToString } from 'react-dom/server'
import NewPostPage from '@/app/posts/new/page'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

jest.mock('@/lib/supabase/server')
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

type SupabaseClientLike = Awaited<ReturnType<typeof createServerClient>>

describe('NewPostPage (server)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders content when user is authenticated', async () => {
    mockCreateServerClient.mockResolvedValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    } as unknown as SupabaseClientLike)

    const element = await NewPostPage()
    const html = renderToString(element)

    expect(html).toContain('新しい投稿')
    expect(html).toContain('あなたのフィットネスの進歩や体験をシェアしましょう！')
  })

  it('redirects to login when user is not authenticated', async () => {
    mockCreateServerClient.mockResolvedValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as unknown as SupabaseClientLike)

    await NewPostPage()

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
