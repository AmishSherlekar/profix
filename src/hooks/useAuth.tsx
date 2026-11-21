import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile, UserRole } from '../types/database'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: UserRole,
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return {
        error:
          'Supabase is not configured yet. Please create a .env.local file with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: UserRole,
  ) {
    if (!isSupabaseConfigured) {
      return {
        error:
          'Supabase is not configured yet. Please create a .env.local file with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase dashboard.',
      }
    }

    // Role 'admin' cannot be selected during self-registration — blocked here and enforced in DB trigger.
    if (role === 'admin') {
      return { error: 'Invalid role selection.' }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role },
      },
    })

    if (error) return { error: error.message }
    if (!data.user) return { error: 'Registration failed. Please try again.' }

    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value: AuthContextValue = {
    session,
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
