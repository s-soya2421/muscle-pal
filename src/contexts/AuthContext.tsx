'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthState, AuthContextType } from '@/types/auth';
import { handleAuthError } from '@/lib/auth-errors';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const supabase = createClient();

  useEffect(() => {
    // 初期認証状態を取得
    const getInitialUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          const japaneseError = handleAuthError(error, 'login');
          setState(prev => ({ ...prev, error: japaneseError, loading: false }));
          return;
        }

        setState({
          user: user,
          loading: false,
          error: null
        });
      } catch (error) {
        const japaneseError = handleAuthError(error, 'login');
        setState(prev => ({ 
          ...prev, 
          error: japaneseError, 
          loading: false 
        }));
      }
    };

    getInitialUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState({
          user: session?.user ?? null,
          loading: false,
          error: null
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔐 Starting login attempt for:', email);
      console.log('🌐 Supabase URL:', supabase.supabaseUrl);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('📡 Login response:', { data, error });

      if (error) {
        console.error('❌ Login error:', error);
        const japaneseError = handleAuthError(error, 'login');
        setState(prev => ({ ...prev, error: japaneseError, loading: false }));
        throw new Error(japaneseError);
      }

      console.log('✅ Login successful!', data);
    } catch (error) {
      console.error('💥 Catch block error:', error);
      const japaneseError = handleAuthError(error, 'login');
      setState(prev => ({ ...prev, error: japaneseError, loading: false }));
      throw new Error(japaneseError);
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        const japaneseError = handleAuthError(error, 'signup');
        setState(prev => ({ ...prev, error: japaneseError, loading: false }));
        throw new Error(japaneseError);
      }
    } catch (error) {
      const japaneseError = handleAuthError(error, 'signup');
      setState(prev => ({ ...prev, error: japaneseError, loading: false }));
      throw new Error(japaneseError);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        const japaneseError = handleAuthError(error, 'logout');
        setState(prev => ({ ...prev, error: japaneseError, loading: false }));
        throw new Error(japaneseError);
      }
    } catch (error) {
      const japaneseError = handleAuthError(error, 'logout');
      setState(prev => ({ ...prev, error: japaneseError, loading: false }));
      throw new Error(japaneseError);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        const japaneseError = handleAuthError(error, 'reset');
        setState(prev => ({ ...prev, error: japaneseError, loading: false }));
        throw new Error(japaneseError);
      }

      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const japaneseError = handleAuthError(error, 'reset');
      setState(prev => ({ ...prev, error: japaneseError, loading: false }));
      throw new Error(japaneseError);
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}