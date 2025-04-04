// components/CommentsContainer.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/utils/supabase/client'
import { CommentWithReplies } from '@/app/utils/supabase/types'
import CommentThread from './CommentThread'
import AuthorLogin from './AuthorLogin'
import { useAuth } from '@/app/context/AuthContext'
import { Calendar, Clock, ThumbsUp, ArrowDownUp } from 'lucide-react'
import { SessionService } from '@/services/sessionService'

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
  const { isAuthor } = useAuth()
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [isSorting, setIsSorting] = useState(false)
  const sessionService = SessionService.getInstance()

  // Helper function to sort comments by the given sort option
  const sortComments = useCallback((commentsToSort: CommentWithReplies[], option: SortOption): CommentWithReplies[] => {
    // Create a deep copy to avoid mutating the original
    const sortedComments = [...commentsToSort];
    
    // Sort root comments based on the selected option
    switch (option) {
      case 'newest':
        sortedComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sortedComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'popular':
        sortedComments.sort((a, b) => {
          // First sort by score
          const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
          const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
          
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          
          // If scores are equal, sort by newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
    }
    
    // Recursively sort replies within each comment
    // Note: Replies are typically shown chronologically regardless of the main sort
    sortedComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        // Always sort replies by oldest first (typical in comment threads)
        comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });
    
    return sortedComments;
  }, []);
  
  // Apply initial sorting to initialComments - sort by newest first
  const sortedInitialComments = sortComments(initialComments, 'newest');
  // Initialize state with sorted comments
  const [comments, setComments] = useState<CommentWithReplies[]>(sortedInitialComments);

  // Google Maps style sorting menu component
  const SortMenu = ({ 
    currentSort, 
    onSelect, 
    disabled 
  }: { 
    currentSort: SortOption, 
    onSelect: (option: SortOption) => void,
    disabled: boolean 
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Get label for current sort option
    const getSortLabel = (option: SortOption): string => {
      switch (option) {
        case 'newest': return 'Newest';
        case 'oldest': return 'Oldest';
        case 'popular': return 'Most popular';
      }
    };
    
    return (
      <div className="relative" ref={menuRef}>
        {/* Sort Button - Google Maps Style */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
          aria-label="Sort comments"
        >
          <ArrowDownUp size={14} className="text-gray-600 dark:text-gray-300" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
            {getSortLabel(currentSort)}
          </span>
        </button>
        
        {/* Popup Menu - Centered below button */}
        {isOpen && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
            <div className="py-1">
              <button
                onClick={() => { onSelect('newest'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                  currentSort === 'newest' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Clock size={18} className={currentSort === 'newest' ? 'text-blue-600 dark:text-blue-400' : ''} />
                <span>Newest</span>
              </button>
              
              <button
                onClick={() => { onSelect('oldest'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                  currentSort === 'oldest' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Calendar size={18} className={currentSort === 'oldest' ? 'text-blue-600 dark:text-blue-400' : ''} />
                <span>Oldest</span>
              </button>
              
              <button
                onClick={() => { onSelect('popular'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                  currentSort === 'popular' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <ThumbsUp size={18} className={currentSort === 'popular' ? 'text-blue-600 dark:text-blue-400' : ''} />
                <span>Most popular</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to organize comments into a nested structure
  const organizeCommentsIntoThreads = useCallback((flatComments: CommentWithReplies[]): CommentWithReplies[] => {
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
  }, []);

  // Memoize refreshComments to avoid recreating it on every render
  const refreshComments = useCallback(async () => {
    try {
      setIsSorting(true);

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
      
      // Sort the comments according to the current sort option before setting state
      const sortedComments = sortComments(organizedComments, sortOption);
      
      setComments(sortedComments);
      router.refresh(); // For any server components that need refreshing
    } catch (err) {
      console.error('Error processing comments:', err);
    } finally {
      setIsSorting(false);
    }
  }, [postId, sortOption, router, organizeCommentsIntoThreads, sortComments]); // Include all dependencies used in the function

  // Initialize session when component mounts
  useEffect(() => {
    // Initialize the session service and mark as ready
    sessionService.getSessionId();
    setSessionInitialized(true);
  }, [sessionService]);

  // Update sorting when option changes
  useEffect(() => {
    if (sessionInitialized) {
      refreshComments();
    }
  }, [sortOption, sessionInitialized, refreshComments]); // Include refreshComments in dependencies

  // Memoize the edit function to avoid recreating it on every render
  const handleEditComment = useCallback(async (commentId: string, newContent: string) => {
    try {
      // Get current comment to check ownership
      const { data: comment } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .single();
      
      // Use session service to check if user can modify this comment
      if (!comment || !sessionService.canModifyComment(comment, isAuthor)) {
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
  }, [isAuthor, refreshComments, sessionService]);

  // Memoize the delete function to avoid recreating it on every render
  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
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
      
      // Use session service to check if user can modify this comment
      if (!sessionService.canModifyComment(comment, isAuthor)) {
        console.error('Permission denied: cannot delete this comment');
        return;
      }
      
      // Check if this comment has any active (non-deleted) child comments
      const { data: childComments, error: childError } = await supabase
        .from('comments')
        .select('id, is_deleted')
        .eq('parent_id', commentId);
        
      if (childError) {
        console.error('Error checking for child comments:', childError);
        return;
      }
      
      const hasChildren = childComments && childComments.length > 0;
      const hasActiveChildren = hasChildren && childComments.some(child => !child.is_deleted);
      
      console.log('Comment deletion analysis:', {
        commentId,
        hasChildren,
        hasActiveChildren,
        childCount: childComments?.length || 0,
        activeChildCount: childComments?.filter(c => !c.is_deleted).length || 0
      });
      
      // CASE 1: Comment is a reply or has active (non-deleted) children - Use soft delete
      if (comment.parent_id !== null || hasActiveChildren) {
        console.log('Soft deleting comment:', commentId, 
          comment.parent_id !== null ? '(is a reply)' : '(has active children)');
        
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
      // CASE 2: Comment has children but all are soft-deleted - Delete entire thread
      else if (hasChildren && !hasActiveChildren) {
        console.log('Hard deleting entire thread with soft-deleted children:', commentId);
        let hadError = false;
        
        // First, delete all child comments
        for (const child of childComments) {
          const { error: childDeleteError } = await supabase
            .from('comments')
            .delete()
            .eq('id', child.id);
          
          if (childDeleteError) {
            console.error(`Error deleting child comment ${child.id}:`, childDeleteError);
            hadError = true;
            // Continue with other deletions even if one fails
          }
        }
        
        if (hadError) {
          console.warn('Some child comments could not be deleted, falling back to soft delete for parent');
          // Soft delete the parent as fallback
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
            console.error('Error in fallback soft-delete of parent:', error);
            return;
          }
        } else {
          // All children deleted successfully, now delete the parent
          const { error: parentDeleteError } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
          
          if (parentDeleteError) {
            console.error('Error deleting parent comment after deleting children:', parentDeleteError);
            
            // Fall back to soft delete if hard delete fails
            const { error: softError } = await supabase
              .from('comments')
              .update({
                is_deleted: true,
                original_content: comment.content,
                content: "Comment removed by " + (isAuthor ? "Author" : "poster"),
                deleted_by: isAuthor ? "author" : "user",
                commenter_name: isAuthor ? null : "[deleted]"
              })
              .eq('id', commentId);
              
            if (softError) {
              console.error('Error in fallback soft-delete of parent:', softError);
              return;
            }
          }
        }
      }
      // CASE 3: Comment has no children - Can hard delete directly
      else {
        console.log('Hard deleting comment with no children:', commentId);
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
          
        if (error) {
          console.error('Error hard-deleting comment:', error);
          
          // If hard delete fails, fall back to soft delete
          console.log('Falling back to soft delete');
          const { error: softError } = await supabase
            .from('comments')
            .update({
              is_deleted: true,
              original_content: comment.content,
              content: "Comment removed by " + (isAuthor ? "Author" : "poster"),
              deleted_by: isAuthor ? "author" : "user",
              commenter_name: isAuthor ? null : "[deleted]"
            })
            .eq('id', commentId);
            
          if (softError) {
            console.error('Error in fallback soft-delete:', softError);
            return;
          }
        }
      }
      
      // Refresh comments after deletion
      await refreshComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  }, [isAuthor, refreshComments, sessionService]);

  // Handler for changing sort option
  const handleSortChange = useCallback((option: SortOption) => {
    setSortOption(option);
  }, []);

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

  // Don't render anything until session is initialized
  if (!sessionInitialized) {
    return <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">Comments</h2>
      <div className="text-center py-4">Loading comments...</div>
    </div>;
  }

  return (
    <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
      <div className="flex flex-row justify-between items-center gap-2 mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            Comments ({totalCommentCount})
          </h2>
          
          {/* Sort menu - Same position on both mobile and desktop */}
          <SortMenu 
            currentSort={sortOption}
            onSelect={handleSortChange}
            disabled={isSorting}
          />
        </div>
        
        {/* Login button */}
        <div className="flex-shrink-0">
          <AuthorLogin />
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