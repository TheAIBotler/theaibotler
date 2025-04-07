// app/utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { SessionLogger } from '../sessionLogger'

// Constants for author status caching
const AUTHOR_STATUS_KEY = 'author_status_cache'
const AUTHOR_STATUS_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

// Make sure these environment variables are correctly set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Ensure the keys are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Modified sign out to create new session
export const customSignOut = async () => {
  try {
    SessionLogger.info('auth', 'Signing out user');
    
    // Clear author status cache immediately to prevent stale data
    clearCachedAuthorStatus();
    
    // Perform Supabase sign out
    await supabase.auth.signOut();
    SessionLogger.info('auth', 'User signed out successfully');

    // Import dynamically to avoid circular dependency
    const { SessionService } = await import('@/services/sessionService');
    
    // Create a new anonymous session
    SessionService.getInstance().createNewSession();
    
    return true;
  } catch (error) {
    SessionLogger.error('auth', 'Error during sign out', { error });
    return false;
  }
}

// Function to check if the current authenticated user is an author
export const checkIsAuthor = async (): Promise<boolean> => {
  try {
    // Get the currently authenticated user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      SessionLogger.error('auth', 'Error getting current user', { error });
      return false;
    }
    
    if (!user || !user.email) {
      SessionLogger.debug('auth', 'No authenticated user found');
      return false;
    }
    
    // Check if we have a valid cached result
    const cachedStatus = getCachedAuthorStatus(user.email);
    if (cachedStatus !== null) {
      SessionLogger.info('auth', `Using cached author status: user ${cachedStatus ? 'is' : 'is not'} an author`, { 
        email: user.email
      });
      return cachedStatus;
    }
    
    SessionLogger.info('auth', 'Checking if user is an author (no cache or expired)', { 
      email: user.email,
      userId: user.id
    });
    
    // Check if there's an author with matching email
    // Note: Removed information_schema query attempt as it's not needed and was causing errors

    // Now try to query the authors table
    const { data, error: authorError } = await supabase
      .from('authors')
      .select('id, email')
      .eq('email', user.email);
    
    // Log the raw query results for debugging
    SessionLogger.info('auth', 'Authors query results', { 
      data,
      hasError: !!authorError,
      errorMessage: authorError?.message
    });
    
    if (authorError) {
      SessionLogger.warn('auth', 'Error checking author status', { 
        error: authorError,
        message: authorError.message,
        code: authorError.code,
        details: authorError.details
      });
      return false;
    }
    
    // Check if data exists and is not empty
    const isAuthor = !!(data && data.length > 0);
    SessionLogger.info('auth', `User ${isAuthor ? 'is' : 'is not'} an author`, { 
      email: user.email,
      authorData: data
    });
    
    // Cache the result for future use
    setCachedAuthorStatus(user.email, isAuthor);
    
    return isAuthor;
  } catch (error) {
    SessionLogger.error('auth', 'Unexpected error checking author status', { 
      error,
      message: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

// Author status caching functions
interface AuthorCacheEntry {
  email: string
  isAuthor: boolean
  timestamp: number
}

/**
 * Gets cached author status for the given email
 * @param email User's email
 * @returns boolean if valid cache exists, null if no cache or expired
 */
export const getCachedAuthorStatus = (email: string): boolean | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheStr = localStorage.getItem(AUTHOR_STATUS_KEY);
    if (!cacheStr) return null;
    
    const cache = JSON.parse(cacheStr) as AuthorCacheEntry;
    const now = Date.now();
    
    // Check if cache is valid and not expired
    if (
      cache &&
      cache.email === email &&
      cache.timestamp + AUTHOR_STATUS_EXPIRY > now
    ) {
      SessionLogger.debug('auth', 'Using cached author status', {
        email: email.substring(0, 3) + '...', 
        isAuthor: cache.isAuthor,
        age: Math.round((now - cache.timestamp) / 60000) + ' minutes'
      });
      return cache.isAuthor;
    }
    
    // Clear invalid cache
    localStorage.removeItem(AUTHOR_STATUS_KEY);
    return null;
  } catch (error) {
    SessionLogger.warn('auth', 'Error reading author status cache', { error });
    return null;
  }
}

/**
 * Sets the cached author status for a user
 * @param email User's email
 * @param isAuthor Whether the user is an author
 */
export const setCachedAuthorStatus = (email: string, isAuthor: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheEntry: AuthorCacheEntry = {
      email,
      isAuthor,
      timestamp: Date.now()
    };
    
    localStorage.setItem(AUTHOR_STATUS_KEY, JSON.stringify(cacheEntry));
    SessionLogger.debug('auth', 'Cached author status', { 
      email: email.substring(0, 3) + '...', 
      isAuthor 
    });
  } catch (error) {
    SessionLogger.warn('auth', 'Error caching author status', { error });
  }
}

/**
 * Clears the cached author status
 */
export const clearCachedAuthorStatus = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(AUTHOR_STATUS_KEY);
    SessionLogger.debug('auth', 'Cleared author status cache');
  } catch {
    // Ignore errors
  }
}

// Legacy function to maintain compatibility - forwards to the session service
export { getSessionId } from '@/services/sessionService';

/**
 * Attempts to recover from session-related errors by resetting session state
 * and creating a fresh anonymous session if needed.
 */
export const recoverFromSessionError = async (): Promise<boolean> => {
  try {
    SessionLogger.info('session', 'Attempting to recover from session error');
    
    // Import dynamically to avoid circular dependency
    const { SessionService } = await import('@/services/sessionService');
    
    // Reset the session service state
    SessionService.getInstance().reset();
    
    // Check current auth status
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      SessionLogger.error('session', 'Error getting auth session during recovery', { error });
      return false;
    }
    
    if (session?.user) {
      // Still authenticated, update the session service
      SessionLogger.info('session', 'Recovery found authenticated user', { 
        email: session.user.email 
      });
      SessionService.getInstance().setUserId(session.user.id);
    } else {
      // Not authenticated, create a new anonymous session
      SessionLogger.info('session', 'Recovery creating new anonymous session');
      SessionService.getInstance().createNewSession();
    }
    
    return true;
  } catch (error) {
    SessionLogger.error('session', 'Recovery attempt failed', { error });
    return false;
  }
}
