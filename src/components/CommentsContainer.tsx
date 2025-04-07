// components/CommentsContainer.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, setSessionContext } from '@/app/utils/supabase/client'
import { CommentWithReplies } from '@/app/utils/supabase/types'
import CommentThread from './CommentThread'
import AuthorLogin from './AuthorLogin'
import { useAuth } from '@/app/context/AuthContext'
import { Calendar, Clock, ThumbsUp, ArrowDownUp } from 'lucide-react'
import { SessionService } from '@/services/sessionService'
import { SessionLogger } from '@/app/utils/sessionLogger'

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
      SessionLogger.info('comment', 'Refreshing comments', { postId, sortOption });

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
        SessionLogger.error('comment', 'Error fetching comments', { error, postId });
        return;
      }

      SessionLogger.debug('comment', 'Raw comments received from database', { 
        count: allComments?.length || 0,
        postId 
      });

      // Organize the flat list of comments into a nested structure
      const organizedComments = organizeCommentsIntoThreads(allComments);
      
      // Sort the comments according to the current sort option before setting state
      const sortedComments = sortComments(organizedComments, sortOption);
      
      setComments(sortedComments);
      
      // Force a refresh of server components
      router.refresh(); 
      
      SessionLogger.info('comment', 'Comments refreshed successfully', { 
        count: sortedComments?.length || 0,
        postId 
      });
    } catch (err) {
      SessionLogger.error('comment', 'Error processing comments', { error: err, postId });
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
      // Helper functions for comment operations
      // =======================================
      
      /**
       * Sets the session context for anonymous users if needed
       */
      const setContextIfNeeded = async (): Promise<boolean> => {
        // Only need to set context for anonymous users
        if (isAuthor || sessionService.isAuthenticated()) {
          return true;
        }
        
        const sessionId = sessionService.getSessionId();
        const contextSet = await setSessionContext(sessionId);
        
        if (!contextSet) {
          SessionLogger.error('comment', 'Failed to set session context for anonymous user', {
            sessionId: sessionId.substring(0, 8) + '...'
          });
          return false;
        }
        
        return true;
      };

      /**
       * Checks if a comment is a leaf (has no replies)
       */
      const isLeafComment = async (commentId: string): Promise<boolean> => {
        await setContextIfNeeded();
        
        const { data, error } = await supabase
          .from('comments')
          .select('id')
          .eq('parent_id', commentId)
          .limit(1);
        
        if (error) {
          SessionLogger.error('comment', 'Error checking for replies', { commentId, error });
          return false; // Assume it's not a leaf on error
        }
        
        return !data || data.length === 0;
      };

      /**
       * Checks if all replies to a comment are inactive (soft-deleted)
       */
      const hasOnlyInactiveReplies = async (commentId: string): Promise<boolean> => {
        await setContextIfNeeded();
        
        const { data, error } = await supabase
          .from('comments')
          .select('id, is_deleted')
          .eq('parent_id', commentId);
        
        if (error) {
          SessionLogger.error('comment', 'Error checking for active replies', { commentId, error });
          return false; // Assume it has active replies on error
        }
        
        // No replies means we don't have "only inactive replies"
        if (!data || data.length === 0) {
          return false;
        }
        
        // Check if all replies are inactive
        return data.every(reply => reply.is_deleted);
      };

      /**
       * Gets all direct replies to a comment
       */
      const getReplies = async (commentId: string): Promise<CommentWithReplies[]> => {
        await setContextIfNeeded();
        
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('parent_id', commentId);
        
        if (error) {
          SessionLogger.error('comment', 'Error getting replies', { commentId, error });
          return [];
        }
        
        return data || [];
      };

      /**
       * Checks if a comment is soft-deleted
       */
      const isCommentSoftDeleted = async (commentId: string): Promise<boolean> => {
        await setContextIfNeeded();
        
        const { data, error } = await supabase
          .from('comments')
          .select('is_deleted')
          .eq('id', commentId)
          .single();
        
        if (error) {
          SessionLogger.error('comment', 'Error checking if comment is deleted', { commentId, error });
          return false;
        }
        
        return data && data.is_deleted === true;
      };

      /**
       * Cleans up soft-deleted parents with no active children
       */
      const cleanupSoftDeletedParents = async (parentId: string): Promise<void> => {
        if (!parentId) return;
        
        await setContextIfNeeded();
        
        // Check if parent is soft-deleted
        const isSoftDeleted = await isCommentSoftDeleted(parentId);
        if (!isSoftDeleted) {
          return; // Not soft-deleted, no cleanup needed
        }
        
        // Check if parent has any active children
        const replies = await getReplies(parentId);
        const hasActiveChildren = replies.some(reply => !reply.is_deleted);
        
        if (!hasActiveChildren) {
          // No active children, hard delete the parent
          const { data: parent } = await supabase
            .from('comments')
            .select('parent_id')
            .eq('id', parentId)
            .single();
            
          const grandparentId = parent?.parent_id;
          
          // Delete the parent
          const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', parentId);
          
          if (error) {
            SessionLogger.error('comment', 'Error cleaning up soft-deleted parent', { 
              parentId, 
              error 
            });
            return;
          }
          
          SessionLogger.info('comment', 'Cleaned up soft-deleted parent', { parentId });
          
          // Continue cleanup for grandparent if needed
          if (grandparentId) {
            await cleanupSoftDeletedParents(grandparentId);
          }
        }
      };

      /**
       * Hard deletes a comment (completely removes it from the database)
       */
      const hardDeleteComment = async (commentId: string): Promise<boolean> => {
        await setContextIfNeeded();
        
        // Get the comment's parent_id before deleting it
        const { data: comment } = await supabase
          .from('comments')
          .select('parent_id')
          .eq('id', commentId)
          .single();
        
        const parentId = comment?.parent_id;
        
        // Delete the comment
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
        
        if (error) {
          SessionLogger.error('comment', 'Error hard-deleting comment', { 
            commentId, 
            error,
            errorMessage: error.message,
            errorCode: error.code 
          });
          return false;
        }
        
        SessionLogger.info('comment', 'Hard deleted comment', { commentId });
        
        // If this was a child comment, check if we need to clean up its parent
        if (parentId) {
          await cleanupSoftDeletedParents(parentId);
        }
        
        return true;
      };

      /**
       * Soft deletes a comment (marks as deleted but keeps in database)
       */
      const softDeleteComment = async (commentId: string, byAuthor: boolean): Promise<boolean> => {
        await setContextIfNeeded();
        
        // Get current comment data
        const { data: comment } = await supabase
          .from('comments')
          .select('*')
          .eq('id', commentId)
          .single();
        
        if (!comment) {
          SessionLogger.error('comment', 'Comment not found for soft delete', { commentId });
          return false;
        }
        
        // Update data
        const updateData = {
          is_deleted: true,
          original_content: comment.content,
          content: "Comment removed by " + (byAuthor ? "author" : "poster"),
          deleted_by: byAuthor ? "author" : "user",
          commenter_name: byAuthor ? null : "[deleted]"
        };
        
        // Perform update
        const { data: updated, error } = await supabase
          .from('comments')
          .update(updateData)
          .eq('id', commentId)
          .select();
        
        if (error) {
          SessionLogger.error('comment', 'Error soft-deleting comment', { 
            commentId, 
            error,
            errorMessage: error.message
          });
          return false;
        }
        
        const success = !!updated && updated.length > 0;
        SessionLogger.info('comment', 'Soft deleted comment', { 
          commentId,
          success
        });
        
        return success;
      };

      /**
       * Hard deletes a comment and all its replies recursively
       */
      const hardDeleteThread = async (commentId: string): Promise<boolean> => {
        await setContextIfNeeded();
        
        // Get parent_id before deleting
        const { data: comment } = await supabase
          .from('comments')
          .select('parent_id')
          .eq('id', commentId)
          .single();
        
        const parentId = comment?.parent_id;
        
        // Get all replies
        const replies = await getReplies(commentId);
        
        // Delete all replies first
        let success = true;
        for (const reply of replies) {
          // Recursively delete reply threads
          const deleted = await hardDeleteThread(reply.id);
          if (!deleted) {
            success = false;
          }
        }
        
        // Now delete the comment itself
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
        
        if (error) {
          SessionLogger.error('comment', 'Error deleting thread root comment', { 
            commentId, 
            error 
          });
          success = false;
        }
        
        // If this was a reply, check if we need to clean up its parent
        if (success && parentId) {
          await cleanupSoftDeletedParents(parentId);
        }
        
        return success;
      };
      
      // MAIN DELETION LOGIC
      // ==========================================
      
      // Set session context for anonymous users
      if (!isAuthor && !sessionService.isAuthenticated()) {
        const contextSet = await setContextIfNeeded();
        if (!contextSet) {
          // Continue anyway, but log the issue
          SessionLogger.warn('comment', 'Proceeding with deletion despite session context error');
        }
      }
      
      // Get comment to check ownership and state
      const { data: comment, error } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .single();
      
      if (error || !comment) {
        SessionLogger.error('comment', 'Comment not found', { commentId, error });
        return;
      }
      
      // Check permissions
      const canModify = sessionService.canModifyComment(comment, isAuthor);
      if (!canModify) {
        SessionLogger.error('comment', 'Permission denied: cannot delete this comment', { 
          commentId,
          isAuthor,
          userId: sessionService.getUserId(),
          isAuthenticated: sessionService.isAuthenticated(),
          sessionId: sessionService.getSessionId().substring(0, 8) + '...'
        });
        return;
      }
      
      SessionLogger.info('comment', 'Starting comment deletion', { 
        commentId,
        isAuthor,
        deletedByType: isAuthor ? 'author' : 'owner'
      });
      
      // Check if leaf comment (no replies)
      const isLeaf = await isLeafComment(commentId);
      
      // Check if has only inactive replies
      const hasOnlyInactive = await hasOnlyInactiveReplies(commentId);
      
      // Log deletion strategy
      SessionLogger.info('comment', 'Deletion strategy analysis', {
        commentId,
        isLeaf,
        hasOnlyInactive,
        parentId: comment.parent_id || null
      });
      
      let success = false;
      
      // CASE 1: Leaf comment - hard delete it
      if (isLeaf) {
        success = await hardDeleteComment(commentId);
      }
      // CASE 2: Comment has only inactive replies - hard delete the thread
      else if (hasOnlyInactive) {
        success = await hardDeleteThread(commentId);
      }
      // CASE 3: Comment has active replies - soft delete it
      else {
        success = await softDeleteComment(commentId, isAuthor);
      }
      
      if (success) {
        // Refresh the comments list
        await refreshComments();
      }
    } catch (err) {
      SessionLogger.error('comment', 'Unexpected error in comment deletion', { 
        commentId, 
        error: err 
      });
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