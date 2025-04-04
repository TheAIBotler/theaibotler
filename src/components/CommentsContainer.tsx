// components/CommentsContainer.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSessionId } from '@/app/utils/supabase/client'
import { CommentWithReplies } from '@/app/utils/supabase/types'
import CommentThread from './CommentThread'
import AuthorLogin from './AuthorLogin'
import { useAuth } from '@/app/context/AuthContext'

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
  const { isAuthor, user } = useAuth()
  const [sessionInitialized, setSessionInitialized] = useState(false)

  // Initialize session when component mounts
  useEffect(() => {
    const initializeSession = async () => {
      // Set the session context for anonymous users
      if (!user) {
        const sessionId = getSessionId();
        try {
          await supabase.rpc('set_session_context', {
            session_id: sessionId
          });
        } catch (error) {
          console.error('Error setting session context:', error);
        }
      }
      setSessionInitialized(true);
    };

    initializeSession();
  }, [user]);

  // Function to organize comments into a nested structure
  const organizeCommentsIntoThreads = (flatComments: CommentWithReplies[]): CommentWithReplies[] => {
    // Create a map for quick lookup by ID
    const commentMap = new Map<string, CommentWithReplies>();
    
    // Initialize replies arrays and add to map
    flatComments.forEach(comment => {
      commentMap.set(comment.id, {
        ...comment,
        replies: []
      });
    });
    
    // Organize into parent-child relationships
    const rootComments: CommentWithReplies[] = [];
    
    flatComments.forEach(comment => {
      // Get the comment with initialized replies array from the map
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id === null) {
        // This is a root-level comment
        rootComments.push(commentWithReplies);
      } else {
        // This is a reply, add it to its parent's replies array
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies!.push(commentWithReplies);
        } else {
          // If parent not found (rare case), treat as root comment
          rootComments.push(commentWithReplies);
        }
      }
    });
    
    return rootComments;
  };

  const refreshComments = async () => {
    try {
      // Set session context before fetching
      if (!user) {
        await supabase.rpc('set_session_context', {
          session_id: getSessionId()
        });
      }

      // Fetch all comments for this post in a single query
      const { data: allComments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // Organize the flat list of comments into a nested structure
      const organizedComments = organizeCommentsIntoThreads(allComments);
      
      setComments(organizedComments);
      router.refresh(); // For any server components that need refreshing
    } catch (err) {
      console.error('Error processing comments:', err);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      // For anonymous users, set session context
      if (!user) {
        const sessionId = getSessionId();
        await supabase.rpc('set_session_context', {
          session_id: sessionId
        });
      }
      
      // Get current comment to check ownership
      const { data: comment } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .single();
      
      // For non-authors, check if comment belongs to current session
      if (!isAuthor && (!comment || comment.session_id !== getSessionId())) {
        console.error('Permission denied: cannot edit this comment');
        return;
      }
      
      // Update the comment
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);
        
      if (error) {
        console.error('Error updating comment:', error);
        return;
      }
      
      // Refresh comments after update
      await refreshComments();
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      // For anonymous users, set session context
      if (!user) {
        const sessionId = getSessionId();
        await supabase.rpc('set_session_context', {
          session_id: sessionId
        });
      }
      
      // Get current comment to check ownership
      const { data: comment } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .single();
      
      // For non-authors, check if comment belongs to current session
      if (!isAuthor && (!comment || comment.session_id !== getSessionId())) {
        console.error('Permission denied: cannot delete this comment');
        return;
      }
      
      // Soft delete the comment
      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          original_content: comment.content,
          content: "Comment removed by " + (isAuthor ? "Author" : "poster"),
          deleted_by: isAuthor ? "author" : "user",
          commenter_name: isAuthor ? null : "[deleted]"
        })
        .eq('id', commentId);
        
      if (error) {
        console.error('Error soft-deleting comment:', error);
        return;
      }
      
      // Refresh comments after deletion
      await refreshComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Don't render anything until session is initialized
  if (!sessionInitialized) {
    return <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">Comments</h2>
      <div className="text-center py-4">Loading comments...</div>
    </div>;
  }

  return (
    <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comments</h2>
        <AuthorLogin />
      </div>
      <CommentThread 
        comments={comments}
        postId={postId}
        postAuthorImage={postAuthorImage}
        isAuthor={isAuthor}
        onCommentAdded={refreshComments}
        onDeleteComment={handleDeleteComment}
        onEditComment={handleEditComment}
      />
    </div>
  );
}