// components/CommentForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, getSessionId } from '@/app/utils/supabase/client'
import { useAuth } from '@/app/context/AuthContext'

interface CommentFormProps {
  postId: string
  parentId?: string | null
  onCommentAdded: () => void
  isReply?: boolean
  onCancelReply?: () => void
  isAuthor?: boolean
}

export default function CommentForm({
  postId,
  parentId = null,
  onCommentAdded,
  isReply = false,
  onCancelReply,
  isAuthor = false
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check if we have a name stored in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('commenter_name');
      if (storedName) {
        setName(storedName);
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Set timeout to prevent UI from being stuck
    timeoutRef.current = setTimeout(() => {
      if (isSubmitting) {
        setIsSubmitting(false)
        setError('Request is taking longer than expected. Please try again.')
      }
    }, 8000) // 8 second timeout
    
    try {
      const sessionId = getSessionId()
      
      // For non-authors, store the name in localStorage
      if (!isAuthor && name.trim()) {
        localStorage.setItem('commenter_name', name.trim());
      }
      
      // First, set the session context for RLS policies with timeout
      const contextPromise = supabase.rpc('set_session_context', {
        session_id: sessionId
      })
      
      // Add a timeout for the RPC call
      const contextTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Setting session context timed out')), 5000);
      });
      
      try {
        // Race between the actual call and the timeout
        await Promise.race([contextPromise, contextTimeoutPromise]);
      } catch (contextError) {
        console.warn('Session context timeout, attempting to continue anyway:', contextError);
        // Continue anyway - the RPC might have succeeded even though the client timed out
      }
      
      // Create the comment data object
      const commentData = {
        post_id: postId,
        parent_id: parentId,
        content: content.trim(),
        commenter_name: isAuthor ? null : name.trim() || 'Anonymous',
        is_author: isAuthor,
        session_id: !user ? sessionId : null,
      };
      
      let supabaseError = null;
      
      try {
        // Set up a simple timeout that we can cancel
        const timeoutId = setTimeout(() => {
          setIsSubmitting(false);
          setError('Request is taking longer than expected. Please try again.');
        }, 5000);
        
        // Execute the insert operation once
        const result = await supabase.from('comments').insert([commentData]);
        
        // Clear the timeout as we got a response
        clearTimeout(timeoutId);
        
        // TypeScript-safe error handling
        if (result && 'error' in result) {
          supabaseError = result.error;
        }
      } catch (insertErr) {
        // Check if this was a timeout error or a Supabase error
        const error = insertErr as Error;
        if (error.message === 'Insert operation timed out') {
          throw error; // Re-throw the timeout error to be caught by the outer catch
        } else {
          // This was some other error from Supabase
          console.error('Error during insert:', error);
          throw error;
        }
      }

      if (supabaseError) {
        console.error('Error submitting comment:', supabaseError);
        throw supabaseError;
      }

      // Clear the timeout as the operation completed successfully
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setContent('')
      // Don't clear name - keep it for the next comment
      onCommentAdded()
      if (isReply && onCancelReply) {
        onCancelReply()
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes('timed out')) {
        setError('Operation timed out. Please try again.')
      } else {
        setError('Failed to post comment. Please try again.')
      }
      console.error('Error posting comment:', err)
    } finally {
      // Clear timeout if it's still active
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setError(null);
    // Add a slight delay before allowing retry to prevent rapid clicking
    setTimeout(() => {
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? "Write a reply..." : "Write a comment..."}
          required
          rows={isReply ? 2 : 3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {!isAuthor && (
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Posting...
            </span>
          ) : isReply ? 'Reply' : 'Post Comment'}
        </button>

        {isReply && onCancelReply && (
          <button
            type="button"
            onClick={onCancelReply}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between text-red-500 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="text-xs underline ml-2 text-blue-600 dark:text-blue-400"
          >
            Try again
          </button>
        </div>
      )}
    </form>
  )
}