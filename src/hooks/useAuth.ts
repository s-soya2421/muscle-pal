'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signInWithEmail, signUpWithEmail, signOut, getCurrentUser, type UserRole, type AuthUser } from '@/lib/auth'
import type { Session } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role?: UserRole) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  isAuthenticated: boolean
}

export function useAuth(requiredRole?: UserRole): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }

      setSession(session)
      
      if (session?.user) {
        const authUser: AuthUser = {
          ...session.user,
          role: (session.user.user_metadata?.role || 'user') as UserRole
        }
        setUser(authUser)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        setSession(session)
        
        if (session?.user) {
          const authUser: AuthUser = {
            ...session.user,
            role: (session.user.user_metadata?.role || 'user') as UserRole
          }
          setUser(authUser)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 必要な権限チェック
  useEffect(() => {
    if (loading) return
    
    if (requiredRole && (!user || !hasRole(requiredRole))) {
      router.push('/login')
    }
  }, [user, loading, requiredRole, router])

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmail(email, password)
      router.push('/dashboard')
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string, role: UserRole = 'user') => {
    try {
      setLoading(true)
      await signUpWithEmail(email, password, role)
      router.push('/dashboard')
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      router.push('/')
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false
    
    if (role === 'admin') {
      return user.role === 'admin'
    }
    
    return user.role === 'user' || user.role === 'admin'
  }

  return {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    hasRole,
    isAuthenticated: !!user
  }
}

// ページレベルでの認証ガード用Hook
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth(requiredRole)
  
  if (auth.loading) {
    return { ...auth, shouldRender: false }
  }
  
  if (!auth.isAuthenticated) {
    return { ...auth, shouldRender: false }
  }
  
  if (requiredRole && !auth.hasRole(requiredRole)) {
    return { ...auth, shouldRender: false }
  }
  
  return { ...auth, shouldRender: true }
}