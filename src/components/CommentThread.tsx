// components/CommentThread.tsx
'use client'

import { useState } from 'react'
import { type CommentWithReplies } from '@/app/utils/supabase/types'
import { formatDistanceToNowStrict } from 'date-fns'
import Image from 'next/image'
import CommentForm from './CommentForm'

interface CommentThreadProps {
  comments: CommentWithReplies[]
  postId: string
  postAuthorImage?: string | null
  isAuthor?: boolean
  onCommentAdded: () => void
}

const CommentThread = ({ 
  comments, 
  postId,
  postAuthorImage,
  isAuthor = false,
  onCommentAdded 
}: CommentThreadProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set())
  
  // Create a flat map of all comments for easy lookup
  const commentMap = new Map<string, CommentWithReplies>();
  
  // Recursive function to populate the map
  const populateCommentMap = (commentList: CommentWithReplies[]) => {
    commentList.forEach(comment => {
      commentMap.set(comment.id, comment);
      if (comment.replies && comment.replies.length > 0) {
        populateCommentMap(comment.replies);
      }
    });
  };
  
  // Populate the map with all comments
  populateCommentMap(comments);

  // Handler for collapsing/expanding comments
  const toggleCollapse = (commentId: string) => {
    setCollapsedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Count total replies (direct and nested) for a comment
  const countTotalReplies = (comment: CommentWithReplies): number => {
    if (!comment.replies || comment.replies.length === 0) {
      return 0;
    }
    
    let count = comment.replies.length;
    for (const reply of comment.replies) {
      count += countTotalReplies(reply);
    }
    
    return count;
  };

  const renderComment = (comment: CommentWithReplies, depth = 0) => {
    const isAuthorComment = comment.is_author
    const isReplying = replyingTo === comment.id
    const isCollapsed = collapsedComments.has(comment.id)
    const hasReplies = comment.replies && comment.replies.length > 0
    const totalReplies = hasReplies ? countTotalReplies(comment) : 0
    
    // Format time without "about"
    const timeAgo = formatDistanceToNowStrict(new Date(comment.created_at), { 
      addSuffix: false,
      roundingMethod: 'floor'
    })
    
    return (
      <div key={comment.id} className="relative">
        {/* Main comment row */}
        <div className="flex items-start">
          {/* Collapse/expand button */}
          <div 
            className="text-gray-500 dark:text-gray-400 flex items-center justify-center w-6 h-6 cursor-pointer flex-shrink-0 relative"
            onClick={() => toggleCollapse(comment.id)}
          >
            <span className={`${hasReplies ? 'visible' : 'invisible'}`}>
              {isCollapsed ? '▸' : '▾'}
            </span>
          </div>
          
          {/* Avatar */}
          <div className="flex-shrink-0 mr-2">
            {isAuthorComment && postAuthorImage ? (
              <div className="relative h-8 w-8 rounded-full overflow-hidden">
                <Image
                  src={postAuthorImage}
                  alt="Author"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {comment.commenter_name?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                {isAuthorComment ? 'Author' : comment.commenter_name || 'Anonymous'}
              </span>
              
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {timeAgo} ago
              </span>
              
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (edited)
                </span>
              )}
            </div>
            
            <div className="text-gray-800 dark:text-gray-200 text-sm break-words mt-1">
              {comment.content}
            </div>
            
            {/* Reply button */}
            <div className="mt-1">
              <button
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* Reply form */}
        {isReplying && (
          <div className="mt-3 ml-14">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCommentAdded={() => {
                onCommentAdded()
                setReplyingTo(null)
              }}
              isReply={true}
              onCancelReply={() => setReplyingTo(null)}
              isAuthor={isAuthor}
            />
          </div>
        )}

        {/* Replies section with proper thread lines */}
        {hasReplies && !isCollapsed && comment.replies && (
          <div className="ml-[12px] relative">
            {/* Thread line with proper connection to caret */}
            <div className="absolute left-0 top-0 w-[1px] bg-gray-300 dark:bg-gray-700" style={{
              // Position directly under the caret
              top: '6px',
              // Make sure the line starts exactly below the caret and extends the entire height
              height: 'calc(100% - 6px)'
            }}></div>
            
            <div className="space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="relative pt-2">
                  {/* Horizontal connector line properly aligned with both vertical line and avatar */}
                  <div className="absolute left-0 top-[20px] w-[20px] h-[1px] bg-gray-300 dark:bg-gray-700"></div>
                  <div className="ml-[20px]">
                    {renderComment(reply, depth + 1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show collapsed replies indicator */}
        {hasReplies && isCollapsed && (
          <div 
            className="ml-14 mt-1 text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" 
            onClick={() => toggleCollapse(comment.id)}
          >
            [{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'} collapsed]
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <div className="mb-8">
        <CommentForm 
          postId={postId}
          onCommentAdded={onCommentAdded}
          isAuthor={isAuthor}
        />
      </div>

      {/* Top level comments */}
      <div className="space-y-5">
        {comments.map((comment) => (
          <div key={comment.id} className="pt-1 pb-1">
            {renderComment(comment, 0)}
          </div>
        ))}
      </div>
      
      {comments.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  )
}

export default CommentThread