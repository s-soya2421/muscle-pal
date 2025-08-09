import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'user' | 'admin'

export interface AuthUser extends User {
  role?: UserRole
}

// クライアント側認証関数
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signUpWithEmail(email: string, password: string, role: UserRole = 'user') {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      }
    }
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentSession() {
  const supabase = createBrowserClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    return null
  }
  
  return session
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createBrowserClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return {
    ...user,
    role: (user.user_metadata?.role || 'user') as UserRole
  }
}


// 認可ヘルパー関数
export function hasRole(user: AuthUser | null, requiredRole: UserRole): boolean {
  if (!user) return false
  
  if (requiredRole === 'admin') {
    return user.role === 'admin'
  }
  
  return user.role === 'user' || user.role === 'admin'
}

export function isAuthenticated(user: AuthUser | null): boolean {
  return !!user
}