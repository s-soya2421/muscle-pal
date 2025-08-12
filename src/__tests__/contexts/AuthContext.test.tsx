import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { mockUser, createMockSupabaseResponse } from '../../test-utils'

// Supabase クライアントをモック
const mockSupabase = {
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
}

jest.mock('@/lib/supabase/client')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as ReturnType<typeof createClient>)
  })

  describe('初期化', () => {
    test('初期状態でloadingがtrueになる', () => {
      mockSupabase.auth.getUser.mockResolvedValue(createMockSupabaseResponse(null))
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe(null)
    })

    test('ユーザー取得成功時にstateが更新される', async () => {
      mockSupabase.auth.getUser.mockResolvedValue(
        createMockSupabaseResponse({ user: mockUser })
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBe(null)
    })

    test('ユーザー取得エラー時にerrorが設定される', async () => {
      const error = { code: 'invalid_token', message: 'Invalid token' }
      mockSupabase.auth.getUser.mockResolvedValue(
        createMockSupabaseResponse(null, error)
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe('ログインに失敗しました')
    })
  })

  describe('signIn', () => {
    test('ログイン成功', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue(
        createMockSupabaseResponse({ user: mockUser })
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await act(async () => {
        await result.current.signIn('test@example.com', 'password')
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
    })

    test('ログイン失敗時にエラーがthrowされる', async () => {
      const error = { code: 'invalid_credentials', message: 'Invalid credentials' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue(
        createMockSupabaseResponse(null, error)
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await expect(act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword')
      })).rejects.toThrow('メールアドレスまたはパスワードが正しくありません')

      expect(result.current.error).toBe('メールアドレスまたはパスワードが正しくありません')
    })

    test('ネットワークエラー時の処理', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await expect(act(async () => {
        await result.current.signIn('test@example.com', 'password')
      })).rejects.toThrow('ログインに失敗しました')
    })
  })

  describe('signUp', () => {
    test('サインアップ成功', async () => {
      mockSupabase.auth.signUp.mockResolvedValue(
        createMockSupabaseResponse({ user: mockUser })
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await act(async () => {
        await result.current.signUp('test@example.com', 'password')
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
    })

    test('重複メールエラーの処理', async () => {
      const error = { code: 'email_exists', message: 'Email already exists' }
      mockSupabase.auth.signUp.mockResolvedValue(
        createMockSupabaseResponse(null, error)
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await expect(act(async () => {
        await result.current.signUp('test@example.com', 'password')
      })).rejects.toThrow('このメールアドレスは既に登録されています')
    })
  })

  describe('signOut', () => {
    test('ログアウト成功', async () => {
      mockSupabase.auth.signOut.mockResolvedValue(
        createMockSupabaseResponse({})
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    test('ログアウト失敗時のエラー処理', async () => {
      const error = { code: 'logout_error', message: 'Logout failed' }
      mockSupabase.auth.signOut.mockResolvedValue(
        createMockSupabaseResponse(null, error)
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await expect(act(async () => {
        await result.current.signOut()
      })).rejects.toThrow('ログアウトに失敗しました')
    })
  })

  describe('resetPassword', () => {
    test('パスワードリセット成功', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue(
        createMockSupabaseResponse({})
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await act(async () => {
        await result.current.resetPassword('test@example.com')
      })

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
    })

    test('パスワードリセット失敗時のエラー処理', async () => {
      const error = { code: 'reset_error', message: 'Reset failed' }
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue(
        createMockSupabaseResponse(null, error)
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await expect(act(async () => {
        await result.current.resetPassword('test@example.com')
      })).rejects.toThrow('パスワードリセットに失敗しました')
    })
  })

  describe('useAuth hook', () => {
    test('AuthProvider外で使用した場合エラーをthrowする', () => {
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
    })
  })
})