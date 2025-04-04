// app/utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Make sure these environment variables are correctly set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Ensure the keys are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,  // Enable this to persist the session in localStorage
    autoRefreshToken: true
  }
})

// Function to get or create a session ID for anonymous users
export const getSessionId = (): string => {
  const SESSION_ID_KEY = 'commenter_session_id'
  
  // Check if running in a browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      let sessionId = localStorage.getItem(SESSION_ID_KEY)
      
      if (!sessionId) {
        // Generate a new session ID only if one doesn't exist
        sessionId = uuidv4()
        localStorage.setItem(SESSION_ID_KEY, sessionId)
        console.log('Created new session ID:', sessionId)
      }
      
      return sessionId
    } catch (error) {
      // Handle errors with localStorage (e.g., in private browsing mode)
      console.error('Error accessing localStorage:', error)
      // Return a temporary session ID
      return 'temp-' + uuidv4()
    }
  }
  
  // Return a placeholder for server-side rendering
  return 'server-side-session'
}

// Helper to set current session ID in Supabase connection
export const setSessionContext = async (): Promise<void> => {
  // Check if running in a browser environment
  if (typeof window !== 'undefined') {
    const sessionId = getSessionId()
    
    try {
      // Try to set session context
      const { error } = await supabase.rpc('set_session_context', {
        session_id: sessionId
      });

      if (error) {
        console.error('Error setting session context:', error);
        
        // If we get a 406 error or similar, try refreshing the client
        if (error.code === '406' || error.code === '42501') {
          console.log('Attempting to recover from session error...');
          
          // Force create a new session ID
          const newSessionId = uuidv4();
          localStorage.setItem('commenter_session_id', newSessionId);
          
          // Try again with the new session ID
          const secondAttempt = await supabase.rpc('set_session_context', {
            session_id: newSessionId
          });
          
          if (secondAttempt.error) {
            console.error('Recovery attempt failed:', secondAttempt.error);
          } else {
            console.log('Successfully recovered session');
            // Force reload the page to ensure all components use the new session
            window.location.reload();
          }
        }
      }
    } catch (error) {
      console.error('Catch block - Error setting session context:', error)
    }
  }
}

// Modified sign out to clear session
export const customSignOut = async () => {
  try {
    // Clear session-related local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('commenter_session_id')
    }
    
    // Perform Supabase sign out
    await supabase.auth.signOut()

    // Explicitly set the new session context after signing out
    const newSessionId = getSessionId()
    await supabase.rpc('set_session_context', {
      session_id: newSessionId
    })
  } catch (error) {
    console.error('Error during sign out:', error)
  }
}

// Function to check if the current authenticated user is an author
export const checkIsAuthor = async (): Promise<boolean> => {
  try {
    // Get the currently authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !user.email) return false
    
    // Check if there's an author with matching email
    const { data } = await supabase
      .from('authors')
      .select('id')
      .eq('email', user.email)
      .single()
    
    return !!data
  } catch (error) {
    console.error('Error checking author status:', error)
    return false
  }
}

// Function to recover from 406 errors
export const recoverFromSessionError = async (): Promise<boolean> => {
  try {
    // Force create a new session ID
    const newSessionId = uuidv4();
    localStorage.setItem('commenter_session_id', newSessionId);
    
    // Set the new session context
    const { error } = await supabase.rpc('set_session_context', {
      session_id: newSessionId
    });
    
    if (error) {
      console.error('Session recovery failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in session recovery:', error);
    return false;
  }
}