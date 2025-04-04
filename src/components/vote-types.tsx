// Types for comment voting system
export type VoteType = 1 | -1;

export interface CommentVoteEntry {
  upvotes: number;
  downvotes: number;
  score: number;
}

export interface VoteStorageEntry extends CommentVoteEntry {
  lastUpdated: number;
}