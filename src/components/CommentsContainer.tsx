'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/utils/supabase/client'
import { CommentWithReplies } from '@/app/utils/supabase/types'
import CommentThread from './CommentThread'

interface CommentsContainerProps {
  postId: string
  postAuthorImage: string | null
  initialComments: CommentWithReplies[]
}

export default function CommentsContainer({ 
  postId, 
  postAuthorImage,
  initialComments 
}: CommentsContainerProps) {
  const router = useRouter()
  const [comments, setComments] = useState<CommentWithReplies[]>(initialComments)
  const [isAuthor] = useState(false)
  // We could add author auth check here if implementing that feature

  const refreshComments = async () => {
    const { data: topLevelComments, error } = await supabase
      .from('comments')
      .select('*')
      .is('parent_id', null)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select('*')
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
          return comment;
        }

        return {
          ...comment,
          replies: replies || []
        };
      })
    );

    setComments(commentsWithReplies);
    router.refresh(); // For any server components that need refreshing
  };

  return (
    <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">Comments</h2>
      <CommentThread 
        comments={comments}
        postId={postId}
        postAuthorImage={postAuthorImage}
        isAuthor={isAuthor}
        onCommentAdded={refreshComments}
      />
    </div>
  );
}