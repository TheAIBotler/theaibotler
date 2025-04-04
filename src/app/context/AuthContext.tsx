// app/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase, customSignOut, checkIsAuthor } from '@/app/utils/supabase/client'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { SessionLogger } from '@/app/utils/sessionLogger'
import { SessionService } from '@/services/sessionService'

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
  const initializeStarted = useRef(false)

  // Effect for initial session setup - runs only once on mount
  useEffect(() => {
    // Avoid running more than once
    if (initializeStarted.current) return
    initializeStarted.current = true
    
    // Check if there's an active session on component mount
    const setData = async () => {
      SessionLogger.info('auth', 'Initializing auth context');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          SessionLogger.error('auth', 'Error fetching initial session', { error });
        } else {
          SessionLogger.info('auth', session ? 'Found existing session' : 'No active session');
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Update SessionService with user ID if authenticated
        if (session?.user) {
          SessionService.getInstance().setUserId(session.user.id);
        }
        
        // Check if user is an author by matching email
        if (session?.user?.email) {
          SessionLogger.debug('auth', 'Checking author status for initial session');
          const isUserAuthor = await checkIsAuthor()
          setIsAuthor(isUserAuthor)
          SessionLogger.info('auth', `User ${isUserAuthor ? 'is' : 'is not'} an author`);
        }
      } catch (e) {
        SessionLogger.error('auth', 'Error in auth setup', { error: e });
      } finally {
        setIsLoading(false)
        SessionLogger.info('auth', 'Auth context initialized');
      }
    }

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        SessionLogger.info('auth', `Auth state changed: ${event}`, {
          userEmail: session?.user?.email
        });
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Update SessionService with user ID if authenticated
        if (session?.user) {
          SessionService.getInstance().setUserId(session.user.id);
        } else {
          SessionService.getInstance().setUserId(null);
        }
        
        // Check if user is an author when auth state changes
        if (session?.user?.email) {
          try {
            const isUserAuthor = await checkIsAuthor()
            setIsAuthor(isUserAuthor)
            SessionLogger.info('auth', `Author check result: ${isUserAuthor ? 'Is author' : 'Not an author'}`);
          } catch (e) {
            SessionLogger.error('auth', 'Error checking author status', { error: e });
            setIsAuthor(false)
          }
        } else {
          setIsAuthor(false)
        }
        
        setIsLoading(false)
      }
    )

    // Add tab visibility change handler
    const handleVisibilityChange = async () => {
      const isVisible = document.visibilityState === 'visible';
      SessionLogger.trackTabVisibility(isVisible);
      
      if (isVisible) {
        SessionLogger.info('session', 'Tab became visible, refreshing connection');
        setIsLoading(true);
        
        const startTime = performance.now();
        const isCurrentlyAuthenticated = !!user?.id;
        
        try {
          // Only refresh for authenticated users, anonymous users don't need refreshing
          if (isCurrentlyAuthenticated) {
            SessionLogger.debug('session', 'Refreshing authenticated user session');
            
            // Refresh the session
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              SessionLogger.error('session', 'Session refresh failed for authenticated user', { 
                error, userId: user?.id 
              });
            } else {
              SessionLogger.info('session', 'Session refresh successful for authenticated user', {
                email: data.session?.user?.email
              });
              
              // Update context with refreshed session
              setSession(data.session);
              setUser(data.session?.user ?? null);
              
              // Update SessionService
              if (data.session?.user) {
                SessionService.getInstance().setUserId(data.session.user.id);
              } else {
                SessionService.getInstance().setUserId(null);
              }
              
              // Re-check author status
              if (data.session?.user?.email) {
                SessionLogger.debug('session', 'Re-checking author status after tab visibility change');
                try {
                  const isUserAuthor = await checkIsAuthor();
                  setIsAuthor(isUserAuthor);
                  SessionLogger.info('session', `Author status re-check: ${isUserAuthor ? 'Is author' : 'Not an author'}`);
                } catch (e) {
                  SessionLogger.error('session', 'Error checking author status after tab change', { error: e });
                  setIsAuthor(false);
                }
              } else {
                // User was logged out during refresh
                setIsAuthor(false);
              }
            }
          } else {
            // For anonymous users, no session refresh is needed
            SessionLogger.debug('session', 'No session refresh needed for anonymous users');
          }
        } catch (error) {
          SessionLogger.error('session', 'Error during visibility change handling', { error });
          
          // Try to recover with a fallback session fetch
          try {
            SessionLogger.debug('session', 'Attempting fallback session fetch');
            const { data: { session }, error: fallbackError } = await supabase.auth.getSession();
            
            if (fallbackError) {
              SessionLogger.error('session', 'Fallback session fetch failed', { error: fallbackError });
            } else {
              const hadUserBefore = !!user?.id;
              const hasUserNow = !!session?.user?.id;
              
              SessionLogger.info('session', 'Fallback session fetch result', { 
                hadUserBefore, hasUserNow, email: session?.user?.email 
              });
              
              setSession(session);
              setUser(session?.user ?? null);
              
              // Update SessionService
              if (session?.user) {
                SessionService.getInstance().setUserId(session.user.id);
              } else {
                SessionService.getInstance().setUserId(null);
              }
            }
          } catch (e) {
            SessionLogger.error('session', 'Unexpected error during fallback session fetch', { error: e });
          }
        } finally {
          const duration = Math.round(performance.now() - startTime);
          SessionLogger.info('session', `Tab visibility connection refresh completed`, { 
            duration,
            isAuthenticated: !!user?.id
          });
          setIsLoading(false);
        }
      }
    }

    // Add event listener for visibility changes
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    
    // Initial data fetch
    setData()
    
    // Clean up function
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      SessionLogger.debug('auth', 'Auth context cleanup');
    }
  }, []) // Empty dependency array to run only once

  const signIn = async (email: string, password: string) => {
    try {
      SessionLogger.info('auth', 'Attempting sign in', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        SessionLogger.error('auth', 'Sign in failed', { 
          error, email
        });
      } else {
        SessionLogger.info('auth', 'Sign in successful', { 
          email: data.user?.email
        });
        
        // Update SessionService with user ID
        if (data.user) {
          SessionService.getInstance().setUserId(data.user.id);
        }
      }
      
      return { error }
    } catch (err) {
      SessionLogger.error('auth', 'Unexpected error during sign in', { error: err, email });
      return { error: err as AuthError }
    }
  }

  const signOut = async () => {
    try {
      SessionLogger.info('auth', 'Signing out user', { email: user?.email });
      await customSignOut()
      setIsAuthor(false)
      setUser(null)
      setSession(null)
      SessionLogger.info('auth', 'User signed out successfully');
    } catch (err) {
      SessionLogger.error('auth', 'Error signing out', { error: err });
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