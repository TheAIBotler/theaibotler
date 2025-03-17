// app/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, customSignOut, checkIsAuthor } from '@/app/utils/supabase/client'
import { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  isAuthor: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthor, setIsAuthor] = useState(false)

  useEffect(() => {
    // Check if there's an active session on component mount
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error fetching session:', error)
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Check if user is an author by matching email
        if (session?.user?.email) {
          const isUserAuthor = await checkIsAuthor()
          setIsAuthor(isUserAuthor)
        }
      } catch (e) {
        console.error('Error in auth setup:', e)
      } finally {
        setIsLoading(false)
      }
    }

    setData()

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Check if user is an author when auth state changes
        if (session?.user?.email) {
          try {
            const isUserAuthor = await checkIsAuthor()
            setIsAuthor(isUserAuthor)
            // console.log('Author check result:', isUserAuthor)
          } catch (e) {
            console.error('Error checking author status:', e)
            setIsAuthor(false)
          }
        } else {
          setIsAuthor(false)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // console.log('Attempting sign in for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in result:', data?.user?.email, error)
      return { error }
    } catch (err) {
      console.error('Unexpected error during sign in:', err)
      return { error: err as AuthError }
    }
  }

  const signOut = async () => {
    try {
      await customSignOut()
      setIsAuthor(false)
      setUser(null)
      setSession(null)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    isAuthor
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}