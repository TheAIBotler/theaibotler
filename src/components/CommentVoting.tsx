import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import VoteManager from './VoteManager'
import { VoteType } from './vote-types'
import { supabase, getSessionId } from '@/app/utils/supabase/client'
import { useAuth } from '@/app/context/AuthContext'

interface CommentVotingProps {
  commentId: string
  initialUpvotes?: number
  initialDownvotes?: number
}

const CommentVoting: React.FC<CommentVotingProps> = ({ 
  commentId, 
  initialUpvotes = 0,
  initialDownvotes = 0
}) => {
  const { user } = useAuth()
  
  // Calculate initial score
  const initialScore = initialUpvotes - initialDownvotes

  // Local state for UI
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<VoteType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUserContext, setLastUserContext] = useState<string | null>(null)

  // Update score whenever upvotes or downvotes change
  useEffect(() => {
    setScore(upvotes - downvotes)
  }, [upvotes, downvotes])

  // Track user context changes
  useEffect(() => {
    const currentContext = user ? user.id : getSessionId()
    
    // Reset vote state if user context has changed
    if (lastUserContext && lastUserContext !== currentContext) {
      setUserVote(null)
    }
    
    setLastUserContext(currentContext)
  }, [user, lastUserContext])

  // Fetch existing user vote on mount and when user changes
  useEffect(() => {
    const fetchExistingVote = async () => {
      try {
        const sessionId = user ? user.id : getSessionId()
        
        const { data } = await supabase
          .from('comment_votes')
          .select('vote_type')
          .eq('comment_id', commentId)
          .eq(user ? 'user_id' : 'session_id', sessionId)
          .single()
        
        if (data) {
          setUserVote(data.vote_type)
        } else {
          setUserVote(null)
        }
      } catch (error) {
        console.error('Error fetching existing vote:', error)
        setUserVote(null)
      }
    }

    fetchExistingVote()
  }, [commentId, user])

  // Handle voting
  const handleVote = async (voteType: VoteType) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      // Determine new vote type (toggle off if same vote)
      const newVoteType = userVote === voteType ? null : voteType
      
      // Optimistically update UI
      setUserVote(newVoteType)
      
      // Update vote counts
      if (newVoteType === 1) {
        // Upvoting
        if (userVote === -1) {
          // Remove previous downvote
          setDownvotes(prev => Math.max(0, prev - 1))
        }
        
        // Add upvote or remove it if already upvoted
        setUpvotes(prev => userVote === 1 ? prev - 1 : prev + 1)
      } else if (newVoteType === -1) {
        // Downvoting
        if (userVote === 1) {
          // Remove previous upvote
          setUpvotes(prev => Math.max(0, prev - 1))
        }
        
        // Add downvote or remove it if already downvoted
        setDownvotes(prev => userVote === -1 ? prev - 1 : prev + 1)
      } else {
        // Removing vote
        if (userVote === 1) {
          setUpvotes(prev => Math.max(0, prev - 1))
        } else if (userVote === -1) {
          setDownvotes(prev => Math.max(0, prev - 1))
        }
      }

      // Sync to database
      if (newVoteType === null) {
        await VoteManager.removeVote(commentId)
      } else {
        await VoteManager.vote(commentId, newVoteType)
      }
    } catch (error) {
      console.error('Voting failed:', error)
      // Revert UI on error
      setUserVote(null)
      setUpvotes(initialUpvotes)
      setDownvotes(initialDownvotes)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
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
        {score}
      </span>
      
      <button
        onClick={() => handleVote(-1)}
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
    </div>
  )
}

export default CommentVoting