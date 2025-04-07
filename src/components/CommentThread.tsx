// components/CommentThread.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { type CommentWithReplies } from '@/app/utils/supabase/types'
import { formatDistanceToNowStrict } from 'date-fns'
import Image from 'next/image'
import CommentForm from './CommentForm'
import CommentEditHistory from './CommentEditHistory'
import CommentVoting from './CommentVoting' // Import the new voting component
import { getSessionId } from '@/app/utils/supabase/client'
import { useAuth } from '@/app/context/AuthContext' // Add this import

interface CommentThreadProps {
  comments: CommentWithReplies[]
  postId: string
  postAuthorImage?: string | null
  isAuthor?: boolean
  onCommentAdded: () => void
  onDeleteComment: (commentId: string) => Promise<void>
  onEditComment: (commentId: string, newContent: string) => Promise<void>
}

const CommentThread = ({ 
  comments, 
  postId,
  postAuthorImage,
  isAuthor = false,
  onCommentAdded,
  onDeleteComment,
  onEditComment
}: CommentThreadProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewingEditHistory, setViewingEditHistory] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Get current session ID for checking own comments
  const currentSessionId = getSessionId();
  
  // Get the authenticated user
  const { user } = useAuth();
  
  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Helper function to find deep comments
  const findDeepComments = useCallback((commentList: CommentWithReplies[], currentDepth: number): string[] => {
    let result: string[] = [];
    
    commentList.forEach(comment => {
      if (currentDepth > 3) {
        result.push(comment.id);
      }
      
      if (comment.replies && comment.replies.length > 0) {
        result = [...result, ...findDeepComments(comment.replies, currentDepth + 1)];
      }
    });
    
    return result;
  }, []);
  
  // Auto-collapse deep comments on mobile
  useEffect(() => {
    if (isMobile) {
      // Get all comments with depth > 3
      const deepComments = findDeepComments(comments, 0);
      
      // Collapse them
      setCollapsedComments(prevCollapsed => {
        const newCollapsed = new Set(prevCollapsed);
        deepComments.forEach(commentId => newCollapsed.add(commentId));
        return newCollapsed;
      });
    }
  }, [comments, isMobile, findDeepComments]); 

  
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

  // Handle edit comment submission
  const handleEditSubmit = async (commentId: string) => {
    if (!editText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await onEditComment(commentId, editText.trim());
      
      // Exit edit mode
      setEditingComment(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: CommentWithReplies, depth = 0) => {
    const isAuthorComment = comment.is_author;
    const isReplying = replyingTo === comment.id;
    const isEditing = editingComment === comment.id;
    const isCollapsed = collapsedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const totalReplies = hasReplies ? countTotalReplies(comment) : 0;
    
    // Determine if this is the user's own comment
    const isOwnComment = 
      // For anonymous users (compare session ID)
      (!user && comment.session_id === currentSessionId) ||
      // For authenticated users with author comments
      (user && comment.is_author && isAuthor);
    
    // Format time without "about" and with abbreviated units
    let timeAgo = formatDistanceToNowStrict(new Date(comment.created_at), { 
      addSuffix: false,
      roundingMethod: 'floor'
    });
    
    // Replace full unit names with abbreviations
    timeAgo = timeAgo
      .replace(' seconds', 's')
      .replace(' second', 's')
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' months', 'mo')
      .replace(' month', 'mo')
      .replace(' years', 'y')
      .replace(' year', 'y');
    
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
                {isAuthorComment 
                  ? 'TheAIBotler' // Hardcoded author name - FUTURE LLMs: This should be dynamically retrieved from the authors table
                  : comment.commenter_name || 'Anonymous'}
              </span>
              
              {isAuthorComment && (
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded">
                  Author
                </span>
              )}
              
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {timeAgo} ago
                {comment.updated_at !== comment.created_at && (
                  <span 
                    className="ml-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingEditHistory(comment.id);
                    }}
                  >
                    • edited {formatDistanceToNowStrict(new Date(comment.updated_at), {
                      addSuffix: false,
                      roundingMethod: 'floor'
                    }).replace(/ seconds/g, 's')
                      .replace(/ second/g, 's')
                      .replace(/ minutes/g, 'm')
                      .replace(/ minute/g, 'm')
                      .replace(/ hours/g, 'h')
                      .replace(/ hour/g, 'h')
                      .replace(/ days/g, 'd')
                      .replace(/ day/g, 'd')
                      .replace(/ months/g, 'mo')
                      .replace(/ month/g, 'mo')
                      .replace(/ years/g, 'y')
                      .replace(/ year/g, 'y')} ago
                  </span>
                )}
              </span>
            </div>
            
            {isEditing ? (
              <div className="mt-1 space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSubmit(comment.id)}
                    disabled={isSubmitting}
                    className="px-3 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingComment(null)}
                    className="px-3 py-1 text-xs rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-800 dark:text-gray-200 text-sm break-words mt-1">
                {comment.content}
              </div>
            )}
            
            {/* Action buttons and voting */}
            {!isEditing && !comment.is_deleted && (
              <div className="mt-1 flex items-center gap-4">
                {/* Add the CommentVoting component */}
                <CommentVoting 
                  commentId={comment.id}
                  initialUpvotes={comment.upvotes || 0}
                  initialDownvotes={comment.downvotes || 0}
                />
                
                <button
                  onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Reply
                </button>
                
                <>
                  {/* Only show edit for own comments */}
                  {isOwnComment && (
                    <button
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditText(comment.content);
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Edit
                    </button>
                  )}
                  
                  {/* Show delete for own comments or if user is author */}
                  {(isOwnComment || isAuthor) && (
                    <button
                      onClick={() => {
                        console.log('Delete button clicked', {
                          commentId: comment.id,
                          isOwnComment,
                          isAuthor,
                          sessionId: currentSessionId, 
                          commentSessionId: comment.session_id
                        });
                        onDeleteComment(comment.id);
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </>
              </div>
            )}
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

      {/* Edit history modal */}
      {viewingEditHistory && (
        <CommentEditHistory 
          commentId={viewingEditHistory} 
          onClose={() => setViewingEditHistory(null)} 
        />
      )}
    </div>
  )
}

export default CommentThread