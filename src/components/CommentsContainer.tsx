// components/CommentsContainer.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getSessionId } from '@/app/utils/supabase/client'
import { CommentWithReplies } from '@/app/utils/supabase/types'
import CommentThread from './CommentThread'
import AuthorLogin from './AuthorLogin'
import { useAuth } from '@/app/context/AuthContext'
import { Clock, ThumbsUp } from 'lucide-react'

type SortOption = 'newest' | 'oldest' | 'popular'

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
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [isSorting, setIsSorting] = useState(false)

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

  // Update sorting when option changes
  useEffect(() => {
    if (sessionInitialized) {
      refreshComments();
    }
  }, [sortOption, sessionInitialized]);

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
      setIsSorting(true);
      
      // Set session context before fetching
      if (!user) {
        await supabase.rpc('set_session_context', {
          session_id: getSessionId()
        });
      }

      // Construct the query based on sort option
      let query = supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId);
        
      // Apply different sorting based on the selected option
      switch (sortOption) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'popular':
          query = query.order('score', { ascending: false })
                       .order('created_at', { ascending: false });
          break;
      }
      
      const { data: allComments, error } = await query;

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
    } finally {
      setIsSorting(false);
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
      
      if (!comment) {
        console.error('Comment not found');
        return;
      }
      
      // For non-authors, check if comment belongs to current session
      if (!isAuthor && comment.session_id !== getSessionId()) {
        console.error('Permission denied: cannot delete this comment');
        return;
      }
      
      // Check if this is a top-level comment with no replies
      const { data: childComments, error: childError } = await supabase
        .from('comments')
        .select('id')
        .eq('parent_id', commentId);
        
      if (childError) {
        console.error('Error checking for child comments:', childError);
      }
      
      // If it's a top-level comment with no replies, hard delete it
      if (comment.parent_id === null && (!childComments || childComments.length === 0)) {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
          
        if (error) {
          console.error('Error hard-deleting comment:', error);
          return;
        }
      } else {
        // Otherwise, soft delete the comment
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
      }
      
      // Refresh comments after deletion
      await refreshComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Handler for changing sort option
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  // Don't render anything until session is initialized
  if (!sessionInitialized) {
    return <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">Comments</h2>
      <div className="text-center py-4">Loading comments...</div>
    </div>;
  }

  // Count total comments including replies
  const totalCommentCount = comments.reduce((total, comment) => {
    return total + countCommentReplies(comment);
  }, 0);

  // Helper function to count a comment and all its replies
  function countCommentReplies(comment: CommentWithReplies): number {
    let count = 1; // Count the comment itself
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        count += countCommentReplies(reply);
      });
    }
    return count;
  }

  return (
    <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Comments ({totalCommentCount})
          </h2>
          <div className="sm:hidden">
            <AuthorLogin />
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
          <div className="flex items-center">
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button 
                onClick={() => handleSortChange('newest')}
                disabled={isSorting}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  sortOption === 'newest' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Clock size={14} />
                <span className="hidden sm:inline">Newest</span>
              </button>
              
              <button 
                onClick={() => handleSortChange('oldest')}
                disabled={isSorting}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  sortOption === 'oldest' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Clock size={14} />
                <span className="hidden sm:inline">Oldest</span>
              </button>
              
              <button 
                onClick={() => handleSortChange('popular')}
                disabled={isSorting}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  sortOption === 'popular' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <ThumbsUp size={14} />
                <span className="hidden sm:inline">Popular</span>
              </button>
            </div>
          </div>
          
          <div className="hidden sm:block">
            <AuthorLogin />
          </div>
        </div>
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