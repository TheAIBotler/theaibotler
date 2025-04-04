// components/CommentForm.tsx
'use client'

import { useState, useEffect } from 'react'
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
  
  // Check if we have a name stored in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('commenter_name');
      if (storedName) {
        setName(storedName);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const sessionId = getSessionId()
      
      // For non-authors, store the name in localStorage
      if (!isAuthor && name.trim()) {
        localStorage.setItem('commenter_name', name.trim());
      }
      
      // First, set the session context for RLS policies
      await supabase.rpc('set_session_context', {
        session_id: sessionId
      })
      
      const { error: supabaseError } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            parent_id: parentId,
            content: content.trim(),
            commenter_name: isAuthor ? null : name.trim() || 'Anonymous',
            // Set is_author directly instead of relying on trigger
            is_author: isAuthor,
            // Only set session_id for non-authenticated users
            session_id: !user ? sessionId : null,
          }
        ])

      if (supabaseError) {
        console.error('Error submitting comment:', supabaseError);
        throw supabaseError
      }

      setContent('')
      // Don't clear name - keep it for the next comment
      onCommentAdded()
      if (isReply && onCancelReply) {
        onCancelReply()
      }
    } catch (err) {
      setError('Failed to post comment. Please try again.')
      console.error('Error posting comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

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
          {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Post Comment'}
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
        <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
      )}
    </form>
  )
}