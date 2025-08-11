import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

// Supabase クライアントのモック
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }))
}))

// Next.js navigation のモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  }),
  usePathname: () => '/'
}))

// テスト用のプロバイダーラッパー
interface AllTheProvidersProps {
  children: ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

// カスタムレンダー関数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// テストユーティリティ関数をエクスポート
export * from '@testing-library/react'
export { customRender as render }

// テスト用のモックデータ
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'テストユーザー'
  }
}

export const mockAuthError = {
  code: 'invalid_credentials',
  message: 'Invalid login credentials',
  status: 401
}

// テスト用のヘルパー関数
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error
})