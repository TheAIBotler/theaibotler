// app/utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { SessionLogger } from '../sessionLogger'
import { User } from '@supabase/supabase-js'
import { getSessionId } from '@/services/sessionService'

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
    
    SessionLogger.debug('auth', 'Checking if user is an author', { email: user.email });
    
    // Check if there's an author with matching email
    const { data, error: authorError } = await supabase
      .from('authors')
      .select('id')
      .eq('email', user.email)
      .single();
    
    if (authorError) {
      SessionLogger.warn('auth', 'Error checking author status', { error: authorError });
      return false;
    }
    
    const isAuthor = !!data;
    SessionLogger.info('auth', `User ${isAuthor ? 'is' : 'is not'} an author`, { 
      email: user.email 
    });
    
    return isAuthor;
  } catch (error) {
    SessionLogger.error('auth', 'Unexpected error checking author status', { error });
    return false;
  }
}

// Legacy function to maintain compatibility - forwards to the session service
export { getSessionId } from '@/services/sessionService';
