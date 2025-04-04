'use client'

import { useState } from 'react'
import { type CommentWithReplies } from '@/app/utils/supabase/types'
import { formatDistanceToNow } from 'date-fns'
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

  const renderComment = (comment: CommentWithReplies) => {
    const isAuthorComment = comment.is_author
    const wasEdited = comment.updated_at !== comment.created_at
    const isReplying = replyingTo === comment.id

    return (
      <div key={comment.id} className="space-y-4">
        <div className="flex gap-4">
          {/* Author Avatar or Default Avatar */}
          <div className="flex-shrink-0">
            {isAuthorComment && postAuthorImage ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                <Image
                  src={postAuthorImage}
                  alt="Author"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {comment.commenter_name?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {isAuthorComment ? 'Author' : comment.commenter_name || 'Anonymous'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {wasEdited && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  (edited {formatDistanceToNow(new Date(comment.updated_at), { addSuffix: true })})
                </span>
              )}
            </div>
            <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
            
            {/* Reply button */}
            <button
              onClick={() => setReplyingTo(isReplying ? null : comment.id)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
            >
              {isReplying ? 'Cancel Reply' : 'Reply'}
            </button>
          </div>
        </div>

        {/* Reply form */}
        {isReplying && (
          <div className="ml-12">
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

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-12 space-y-4 border-l-2 border-gray-100 dark:border-gray-700 pl-4">
            {comment.replies.map(reply => renderComment(reply))}
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

      {/* Comments list */}
      {comments.map(comment => renderComment(comment))}
      
      {comments.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  )
}

export default CommentThread