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
    let sessionId = localStorage.getItem(SESSION_ID_KEY)
    
    if (!sessionId) {
      sessionId = uuidv4()
      localStorage.setItem(SESSION_ID_KEY, sessionId)
    }
    
    return sessionId
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
      await supabase.rpc('set_session_context', {
        session_id: sessionId
      })
    } catch (error) {
      console.error('Error setting session context:', error)
    }
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