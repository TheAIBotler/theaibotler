import { supabase } from '@/app/utils/supabase/client'
import { VoteType, CommentVoteEntry, VoteStorageEntry } from './vote-types'
import { SessionService } from '@/services/sessionService'

class VoteManager {
  private static STORAGE_KEY = 'comment_votes_v2';
  private static USER_VOTES_KEY = 'user_votes';

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

  // Get user votes from local storage
  private static getUserVotesFromStorage(): Record<string, VoteType> {
    try {
      const stored = localStorage.getItem(this.USER_VOTES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading user votes storage:', error);
      return {};
    }
  }

  // Save user votes to local storage
  private static saveUserVotesToStorage(votes: Record<string, VoteType>): void {
    try {
      localStorage.setItem(this.USER_VOTES_KEY, JSON.stringify(votes));
    } catch (error) {
      console.error('Error saving user votes storage:', error);
    }
  }

  // Get the user's vote for a specific comment
  static async getUserVote(commentId: string): Promise<VoteType | null> {
    try {
      const sessionService = SessionService.getInstance();
      const isAuthenticated = sessionService.isAuthenticated();
      const userId = sessionService.getUserId();
      const sessionId = sessionService.getSessionId();
      
      // Define a unique key for this user/session and comment
      const userKey = isAuthenticated ? `user_${userId}` : `session_${sessionId}`;
      const storageKey = `${userKey}_${commentId}`;
      
      // Check if we have this vote cached in localStorage
      const userVotes = this.getUserVotesFromStorage();
      if (storageKey in userVotes) {
        return userVotes[storageKey];
      }
      
      // No cached vote, query from Supabase
      const { data, error } = await supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('comment_id', commentId)
        .eq(isAuthenticated ? 'user_id' : 'session_id', isAuthenticated ? userId : sessionId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors
      
      if (error) {
        console.error('Error fetching user vote:', error);
        return null;
      }
      
      // Cache the result in localStorage
      const voteType = data ? data.vote_type : null;
      userVotes[storageKey] = voteType;
      this.saveUserVotesToStorage(userVotes);
      
      return voteType;
    } catch (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
  }

  // Fetch and update vote counts for multiple comments
  static async refreshCommentVotes(commentIds: string[]): Promise<Record<string, CommentVoteEntry>> {
    if (commentIds.length === 0) return {};

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, upvotes, downvotes, score')
        .in('id', commentIds);

      if (error) {
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
      
      const sessionService = SessionService.getInstance();
      const isAuthenticated = sessionService.isAuthenticated();
      const userId = sessionService.getUserId();
      const sessionId = sessionService.getSessionId();
      
      console.log('Current Session:', isAuthenticated ? `Authenticated: ${userId}` : `Anonymous: ${sessionId}`);

      // Prepare vote data
      const voteData = {
        comment_id: commentId,
        vote_type: voteType,
        session_id: isAuthenticated ? null : sessionId,
        user_id: isAuthenticated ? userId : null
      };

      console.log('Vote Data Prepared:', voteData);

      // Update local cache first - optimistic update
      const userKey = isAuthenticated ? `user_${userId}` : `session_${sessionId}`;
      const storageKey = `${userKey}_${commentId}`;
      const userVotes = this.getUserVotesFromStorage();
      userVotes[storageKey] = voteType;
      this.saveUserVotesToStorage(userVotes);

      // Remove existing vote first
      const { error: removeError } = await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq(isAuthenticated ? 'user_id' : 'session_id', isAuthenticated ? userId : sessionId);

      if (removeError) {
        console.warn('Error removing existing vote:', removeError);
      }

      // Insert new vote
      const { error } = await supabase
        .from('comment_votes')
        .insert(voteData);

      if (error) {
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
      const sessionService = SessionService.getInstance();
      const isAuthenticated = sessionService.isAuthenticated();
      const userId = sessionService.getUserId();
      const sessionId = sessionService.getSessionId();

      // Update local cache first - optimistic update
      const userKey = isAuthenticated ? `user_${userId}` : `session_${sessionId}`;
      const storageKey = `${userKey}_${commentId}`;
      const userVotes = this.getUserVotesFromStorage();
      userVotes[storageKey] = null;
      this.saveUserVotesToStorage(userVotes);

      // Remove vote
      const { error } = await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq(isAuthenticated ? 'user_id' : 'session_id', isAuthenticated ? userId : sessionId);

      if (error) {
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