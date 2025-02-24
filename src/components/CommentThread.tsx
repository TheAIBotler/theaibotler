// components/CommentThread.tsx
import { type CommentWithReplies } from '@/utils/supabase/types'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

interface CommentThreadProps {
  comments: CommentWithReplies[]
  postAuthorImage?: string | null
}

const CommentThread = ({ comments, postAuthorImage }: CommentThreadProps) => {
  const renderComment = (comment: CommentWithReplies) => {
    const isAuthor = comment.is_author
    const wasEdited = comment.updated_at !== comment.created_at

    return (
      <div key={comment.id} className="space-y-4">
        <div className="flex gap-4">
          {/* Author Avatar or Default Avatar */}
          <div className="flex-shrink-0">
            {isAuthor && postAuthorImage ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                <Image
                  src={postAuthorImage}
                  alt="Author"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">
                  {comment.commenter_name?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {isAuthor ? 'Author' : comment.commenter_name || 'Anonymous'}
              </span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {wasEdited && (
                <span className="text-sm text-gray-500">
                  (edited {formatDistanceToNow(new Date(comment.updated_at), { addSuffix: true })})
                </span>
              )}
            </div>
            <p className="text-gray-800">{comment.content}</p>
          </div>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-12 space-y-4 border-l-2 border-gray-100 pl-4">
            {comment.replies.map(reply => renderComment(reply))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map(comment => renderComment(comment))}
      {comments.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  )
}

export default CommentThread