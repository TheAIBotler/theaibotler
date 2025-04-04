// app/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase, customSignOut, checkIsAuthor } from '@/app/utils/supabase/client'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { SessionLogger } from '@/app/utils/sessionLogger'
import { SessionService } from '@/services/sessionService'

// Auth status enum for better state tracking
enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  isAuthor: boolean
  status: AuthStatus
  forceRefreshAuth: () => Promise<boolean> // New method for external components to force refresh
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthor, setIsAuthor] = useState(false)
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.LOADING)
  
  // Refs
  const initializeStarted = useRef(false)
  const authCheckTimer = useRef<NodeJS.Timeout | null>(null)
  const lastAuthCheck = useRef<number>(0)
  const authCheckInProgress = useRef<boolean>(false)
  const refreshCount = useRef<number>(0)

  // Force refresh auth - useful for components to call if they detect auth issues
  const forceRefreshAuth = useCallback(async (): Promise<boolean> => {
    if (authCheckInProgress.current) return false;
    
    try {
      authCheckInProgress.current = true;
      
      // Get the current auth state directly from Supabase
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        SessionLogger.error('auth', 'Error fetching auth state during force refresh', { error });
        setStatus(AuthStatus.ERROR);
        return false;
      }
      
      // Update states based on session data
      setSession(currentSession);
      
      if (currentSession?.user) {
        setUser(currentSession.user);
        setStatus(AuthStatus.AUTHENTICATED);
        SessionService.getInstance().setUserId(currentSession.user.id);
        
        // Check author status
        if (currentSession.user.email) {
          const authorStatus = await checkIsAuthor();
          setIsAuthor(authorStatus);
        }
        
        SessionLogger.info('auth', 'Auth force refreshed - user authenticated', {
          email: currentSession.user.email
        });
        return true;
      } else {
        // No active session
        setUser(null);
        setIsAuthor(false);
        setStatus(AuthStatus.UNAUTHENTICATED);
        SessionService.getInstance().setUserId(null);
        
        SessionLogger.info('auth', 'Auth force refreshed - no authenticated user');
        return false;
      }
    } catch (e) {
      SessionLogger.error('auth', 'Unexpected error during force refresh', { error: e });
      setStatus(AuthStatus.ERROR);
      return false;
    } finally {
      authCheckInProgress.current = false;
    }
  }, []);

  // Periodic auth check function
  const checkAuthState = useCallback(async (immediate = false): Promise<void> => {
    // Skip if another check is in progress or if not immediate and last check was recent
    const now = Date.now();
    if (authCheckInProgress.current) return;
    if (!immediate && now - lastAuthCheck.current < 30000) return; // 30 second throttle
    
    try {
      authCheckInProgress.current = true;
      lastAuthCheck.current = now;
      
      // Only log every 5th check to reduce noise unless there's an issue
      const shouldLog = immediate || refreshCount.current++ % 5 === 0;
      if (shouldLog) {
        SessionLogger.debug('auth', 'Checking auth state', {
          immediate, currentStatus: status
        });
      }
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        SessionLogger.error('auth', 'Error during auth check', { error });
        return;
      }
      
      // Only update if there's a meaningful change to reduce renders
      const currentUserEmail = user?.email;
      const newUserEmail = currentSession?.user?.email;
      
      const stateChanged = (
        (!!currentSession?.user) !== (!!user) ||
        currentUserEmail !== newUserEmail
      );
      
      if (stateChanged) {
        SessionLogger.info('auth', 'Auth state changed during check', {
          hadUser: !!user,
          hasUser: !!currentSession?.user,
          oldEmail: currentUserEmail,
          newEmail: newUserEmail
        });
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setStatus(AuthStatus.AUTHENTICATED);
          SessionService.getInstance().setUserId(currentSession.user.id);
          
          // Check for author status
          if (currentSession.user.email) {
            const authorStatus = await checkIsAuthor();
            setIsAuthor(authorStatus);
          }
        } else {
          setStatus(AuthStatus.UNAUTHENTICATED);
          setIsAuthor(false);
          SessionService.getInstance().setUserId(null);
        }
      }
    } catch (e) {
      SessionLogger.error('auth', 'Unexpected error during auth check', { error: e });
    } finally {
      authCheckInProgress.current = false;
    }
  }, [user, status]);

  // Setup auth state tracking and listeners
  useEffect(() => {
    // Avoid double initialization
    if (initializeStarted.current) return;
    initializeStarted.current = true;
    
    SessionLogger.info('auth', 'Initializing auth context');
    
    // Initial auth check
    const initialSetup = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          SessionLogger.error('auth', 'Error fetching initial session', { error });
          setStatus(AuthStatus.ERROR);
        } else {
          setSession(initialSession);
          
          if (initialSession?.user) {
            setUser(initialSession.user);
            setStatus(AuthStatus.AUTHENTICATED);
            SessionService.getInstance().setUserId(initialSession.user.id);
            
            SessionLogger.info('auth', 'Found existing authenticated session', {
              email: initialSession.user.email
            });
            
            // Check if user is an author
            if (initialSession.user.email) {
              try {
                const isUserAuthor = await checkIsAuthor();
                setIsAuthor(isUserAuthor);
                SessionLogger.info('auth', `User ${isUserAuthor ? 'is' : 'is not'} an author`);
              } catch (e) {
                SessionLogger.error('auth', 'Error checking author status', { error: e });
              }
            }
          } else {
            setUser(null);
            setStatus(AuthStatus.UNAUTHENTICATED);
            SessionService.getInstance().setUserId(null);
            SessionLogger.info('auth', 'No active session');
          }
        }
      } catch (e) {
        SessionLogger.error('auth', 'Error in auth setup', { error: e });
        setStatus(AuthStatus.ERROR);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, changedSession) => {
        // Skip initial setup event as we handle it separately
        if (event === 'INITIAL_SESSION') return;
        
        SessionLogger.info('auth', `Auth state changed: ${event}`, {
        userEmail: changedSession?.user?.email,
        event,
          hasUser: !!changedSession?.user
        });
        
        // Update session and user state
        setSession(changedSession);
        
        if (changedSession?.user) {
        setUser(changedSession.user);
        setStatus(AuthStatus.AUTHENTICATED);
        
        // Ensure SessionService transitions properly from anonymous to authenticated
        const sessionService = SessionService.getInstance();
        if (!sessionService.isAuthenticated()) {
          SessionLogger.info('auth', 'Updating SessionService with authenticated user');
        }
        sessionService.setUserId(changedSession.user.id);
          
          // Check if user is an author
          if (changedSession.user.email) {
            try {
              const isUserAuthor = await checkIsAuthor();
              setIsAuthor(isUserAuthor);
            } catch (e) {
              SessionLogger.error('auth', 'Error checking author status', { error: e });
              setIsAuthor(false);
            }
          }
        } else {
          setUser(null);
          setIsAuthor(false);
          setStatus(AuthStatus.UNAUTHENTICATED);
          SessionService.getInstance().setUserId(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Set up visibility change handler
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      
      if (isVisible) {
        // When tab becomes visible, refresh auth state immediately
        SessionLogger.info('session', 'Tab became visible, checking auth state');
        checkAuthState(true);
      }
    };
    
    // Set up interval for periodic auth checks
    authCheckTimer.current = setInterval(() => {
      // Only run checks if the page is visible
      if (document.visibilityState === 'visible') {
        checkAuthState(false);
      }
    }, 60000); // Check every minute while page is visible
    
    // Add event listener for visibility changes
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    // Run initial setup
    initialSetup();
    
    // Cleanup function
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      
      if (authCheckTimer.current) {
        clearInterval(authCheckTimer.current);
        authCheckTimer.current = null;
      }
      
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      
      SessionLogger.debug('auth', 'Auth context cleanup');
    };
  }, [checkAuthState]);
  
  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      SessionLogger.info('auth', 'Attempting sign in', { email });
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        SessionLogger.error('auth', 'Sign in failed', { error, email });
        setStatus(AuthStatus.ERROR);
      } else {
        SessionLogger.info('auth', 'Sign in successful', { email: data.user?.email });
        setStatus(AuthStatus.AUTHENTICATED);
        
        // Session and user state will be updated by onAuthStateChange
      }
      
      return { error };
    } catch (err) {
      SessionLogger.error('auth', 'Unexpected error during sign in', { error: err, email });
      setStatus(AuthStatus.ERROR);
      return { error: err as AuthError };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out function
  const signOut = async () => {
    try {
      SessionLogger.info('auth', 'Signing out user', { email: user?.email });
      setIsLoading(true);
      
      await customSignOut();
      
      // These will be updated by onAuthStateChange, but set them directly too
      setIsAuthor(false);
      setUser(null);
      setSession(null);
      setStatus(AuthStatus.UNAUTHENTICATED);
      
      SessionLogger.info('auth', 'User signed out successfully');
    } catch (err) {
      SessionLogger.error('auth', 'Error signing out', { error: err });
      
      // Force refresh auth state to get accurate status
      await forceRefreshAuth();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create context value
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    isAuthor,
    status,
    forceRefreshAuth
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
