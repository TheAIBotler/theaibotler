// app/utils/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get session ID (client-side only)
export const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  
  // Check if we have a session ID in localStorage
  let sessionId = localStorage.getItem('comment_session_id');
  
  // If no session ID exists, create one
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('comment_session_id', sessionId);
  }
  
  return sessionId;
};