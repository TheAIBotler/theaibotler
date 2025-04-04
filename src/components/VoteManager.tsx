import { supabase, getSessionId, setSessionContext, recoverFromSessionError } from '@/app/utils/supabase/client'
import { VoteType, CommentVoteEntry, VoteStorageEntry } from './vote-types'

class VoteManager {
  private static STORAGE_KEY = 'comment_votes_v2';

  // Retrieve votes from local storage
  private static getStoredVotes(): Record<string, VoteStorageEntry> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading vote storage:', error);
      return {};
    }
  }

  // Save votes to local storage
  private static saveStoredVotes(votes: Record<string, VoteStorageEntry>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(votes));
    } catch (error) {
      console.error('Error saving vote storage:', error);
    }
  }

  // Fetch and update vote counts for multiple comments
  static async refreshCommentVotes(commentIds: string[]): Promise<Record<string, CommentVoteEntry>> {
    if (commentIds.length === 0) return {};

    try {
      // Ensure session context is set before querying
      await setSessionContext();

      const { data, error } = await supabase
        .from('comments')
        .select('id, upvotes, downvotes, score')
        .in('id', commentIds);

      if (error) {
        // Check if this is a session error (406, 401, etc.)
        if (error.code === '406' || error.code === '401' || error.code === '42501') {
          console.log('Session error detected, attempting recovery...');
          const recovered = await recoverFromSessionError();
          if (recovered) {
            // Try again with the new session
            return this.refreshCommentVotes(commentIds);
          }
        }
        throw error;
      }

      // Update local storage and prepare return object
      const storedVotes = this.getStoredVotes();
      const voteUpdates: Record<string, CommentVoteEntry> = {};

      data.forEach(comment => {
        const { id, upvotes, downvotes, score } = comment;
        
        // Update local storage
        storedVotes[id] = {
          upvotes: upvotes ?? 0,
          downvotes: downvotes ?? 0,
          score: score ?? 0,
          lastUpdated: Date.now()
        };

        // Prepare return object
        voteUpdates[id] = {
          upvotes: upvotes ?? 0,
          downvotes: downvotes ?? 0,
          score: score ?? 0
        };
      });

      // Save updated storage
      this.saveStoredVotes(storedVotes);

      return voteUpdates;
    } catch (error) {
      console.error('Error refreshing comment votes:', error);
      return {};
    }
  }

  // Cast a vote for a comment
  static async vote(commentId: string, voteType: VoteType): Promise<void> {
    try {
      console.group('Vote Operation');
      
      // Ensure session context is set before voting
      await setSessionContext();
      
      // Log current session context details
      const currentSessionId = getSessionId();
      console.log('Current Session ID:', currentSessionId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current User:', user ? user.id : 'No authenticated user');

      // Prepare vote data
      const voteData = {
        comment_id: commentId,
        vote_type: voteType,
        session_id: user ? null : currentSessionId,
        user_id: user ? user.id : null
      };

      console.log('Vote Data Prepared:', voteData);

      // Remove existing vote first
      const { error: removeError } = await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq(user ? 'user_id' : 'session_id', user ? user.id : currentSessionId);

      if (removeError) {
        // Check if this is a session error
        if (removeError.code === '406' || removeError.code === '401' || removeError.code === '42501') {
          console.log('Session error during vote removal, attempting recovery...');
          const recovered = await recoverFromSessionError();
          if (recovered) {
            console.log('Recovery successful, retrying vote operation');
            console.groupEnd();
            // Try the whole operation again
            return this.vote(commentId, voteType);
          }
        }
        console.warn('Error removing existing vote:', removeError);
      }

      // Insert new vote
      const { error } = await supabase
        .from('comment_votes')
        .insert(voteData);

      if (error) {
        // Check if this is a session error
        if (error.code === '406' || error.code === '401' || error.code === '42501') {
          console.log('Session error during vote insertion, attempting recovery...');
          const recovered = await recoverFromSessionError();
          if (recovered) {
            console.log('Recovery successful, retrying vote operation');
            console.groupEnd();
            // Try the whole operation again
            return this.vote(commentId, voteType);
          }
        }
        console.error('Vote insertion error:', error);
        throw error;
      }

      console.log('Vote successfully inserted');
      console.groupEnd();
    } catch (error) {
      console.error('Voting failed:', error);
      console.groupEnd();
      throw error;
    }
  }

  // Remove vote for a comment
  static async removeVote(commentId: string): Promise<void> {
    try {
      // Ensure session context is set
      await setSessionContext();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Remove vote
      const { error } = await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq(user ? 'user_id' : 'session_id', user ? user.id : getSessionId());

      if (error) {
        // Check if this is a session error
        if (error.code === '406' || error.code === '401' || error.code === '42501') {
          console.log('Session error during vote removal, attempting recovery...');
          const recovered = await recoverFromSessionError();
          if (recovered) {
            // Try again with new session
            return this.removeVote(commentId);
          }
        }
        console.error('Error removing vote:', error);
        throw error;
      }
    } catch (error) {
      console.error('Remove vote failed:', error);
      throw error;
    }
  }

  // Get stored vote counts for a specific comment
  static getStoredVoteCount(commentId: string): CommentVoteEntry | undefined {
    const storedVotes = this.getStoredVotes();
    const storedEntry = storedVotes[commentId];
    
    return storedEntry ? {
      upvotes: storedEntry.upvotes,
      downvotes: storedEntry.downvotes,
      score: storedEntry.score
    } : undefined;
  }
}

export default VoteManager;