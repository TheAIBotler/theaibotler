// components/CommentVoting.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, getSessionId } from '@/app/utils/supabase/client'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'

interface CommentVotingProps {
  commentId: string
  initialUpvotes?: number
  initialDownvotes?: number
}

export default function CommentVoting({
  commentId,
  initialUpvotes = 0,
  initialDownvotes = 0
}: CommentVotingProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  // Fetch the user's existing vote on component mount
  useEffect(() => {
    async function fetchUserVote() {
      try {
        const sessionId = getSessionId()
        
        // First, set the session context for RLS policies
        // FIXED: Using the correct parameter name 'session_id' instead of 'current_session_id'
        await supabase.rpc('set_session_context', {
          session_id: sessionId
        })
        
        const { data, error } = await supabase
          .from('comment_votes')
          .select('vote_type')
          .eq('comment_id', commentId)
          .eq(user ? 'user_id' : 'session_id', user ? user.id : sessionId)
          .maybeSingle()
        
        if (error) {
          console.error('Error fetching vote:', error)
          return
        }
        
        if (data) {
          setUserVote(data.vote_type)
        }
      } catch (err) {
        console.error('Error fetching vote:', err)
      }
    }
    
    fetchUserVote()
  }, [commentId, user])

  const handleVote = async (voteType: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // If user is clicking the same vote button they already selected, remove their vote
      const newVoteType = userVote === voteType ? null : voteType
      
      const sessionId = getSessionId()
      
      // Set timeout to prevent UI from being stuck
      timeoutRef.current = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false)
          setError('Request is taking longer than expected. Please try again.')
        }
      }, 5000) // 5 second timeout
      
      // First, set the session context for RLS policies
      // FIXED: Using the correct parameter name 'session_id' instead of 'current_session_id'
      await supabase.rpc('set_session_context', {
        session_id: sessionId
      })

      // Update votes optimistically for better UX
      updateVotesOptimistically(voteType)

      if (newVoteType === null) {
        // Remove the vote
        const { error } = await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq(user ? 'user_id' : 'session_id', user ? user.id : sessionId)
        
        if (error) {
          // Revert optimistic update
          revertOptimisticUpdate()
          throw error
        }
      } else if (userVote === null) {
        // Insert new vote
        const { error } = await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            session_id: user ? null : sessionId,
            user_id: user ? user.id : null,
            vote_type: voteType
          })
        
        if (error) {
          // Revert optimistic update
          revertOptimisticUpdate()
          throw error
        }
      } else {
        // Update existing vote
        const { error } = await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('comment_id', commentId)
          .eq(user ? 'user_id' : 'session_id', user ? user.id : sessionId)
        
        if (error) {
          // Revert optimistic update
          revertOptimisticUpdate()
          throw error
        }
      }

      // Success - set the new vote state
      setUserVote(newVoteType)
    } catch (err) {
      const error = err as Error
      console.error('Error voting:', error)
      setError('Failed to cast vote. Please try again.')
    } finally {
      // Clear timeout if it's still active
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsLoading(false)
    }
  }

  // Handle optimistic UI updates for better UX
  const updateVotesOptimistically = (newVoteType: number) => {
    // When removing a vote (clicking the same button again)
    if (userVote === newVoteType) {
      if (userVote === 1) {
        setUpvotes(prev => Math.max(0, prev - 1))
      } else if (userVote === -1) {
        setDownvotes(prev => Math.max(0, prev - 1))
      }
      setUserVote(null)
    } 
    // When changing vote type (from upvote to downvote or vice versa)
    else if (userVote !== null && userVote !== newVoteType) {
      if (newVoteType === 1) {
        setUpvotes(prev => prev + 1)
        setDownvotes(prev => Math.max(0, prev - 1))
      } else {
        setDownvotes(prev => prev + 1)
        setUpvotes(prev => Math.max(0, prev - 1))
      }
      setUserVote(newVoteType)
    } 
    // When voting for the first time
    else {
      if (newVoteType === 1) {
        setUpvotes(prev => prev + 1)
      } else {
        setDownvotes(prev => prev + 1)
      }
      setUserVote(newVoteType)
    }
  }

  // Revert optimistic update if the operation fails
  const revertOptimisticUpdate = () => {
    // Reset to initial state
    setUpvotes(initialUpvotes)
    setDownvotes(initialDownvotes)
    setUserVote(null)
    
    // Re-fetch the user's vote to ensure consistency
    const fetchVote = async () => {
      try {
        const sessionId = getSessionId()
        
        await supabase.rpc('set_session_context', {
          session_id: sessionId
        })
        
        const { data } = await supabase
          .from('comment_votes')
          .select('vote_type')
          .eq('comment_id', commentId)
          .eq(user ? 'user_id' : 'session_id', user ? user.id : sessionId)
          .maybeSingle()
        
        if (data) {
          setUserVote(data.vote_type)
        }
      } catch (err) {
        console.error('Error re-fetching vote:', err)
      }
    }
    
    fetchVote()
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => !isLoading && handleVote(1)}
        disabled={isLoading}
        className={`p-1 rounded transition-colors ${
          userVote === 1 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }`}
        aria-label="Upvote"
      >
        <ArrowUp size={16} />
      </button>
      
      <span className="text-xs font-medium">
        {upvotes - downvotes}
      </span>
      
      <button
        onClick={() => !isLoading && handleVote(-1)}
        disabled={isLoading}
        className={`p-1 rounded transition-colors ${
          userVote === -1 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }`}
        aria-label="Downvote"
      >
        <ArrowDown size={16} />
      </button>
      
      {error && (
        <span className="text-xs text-red-500 ml-1">{error}</span>
      )}
    </div>
  )
}