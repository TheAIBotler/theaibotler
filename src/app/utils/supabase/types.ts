// app/utils/supabase/types.ts
// Update your existing CommentWithReplies interface to include voting fields

export interface CommentWithReplies {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  commenter_name: string | null;
  is_author: boolean;
  author_id?: string | null;
  session_id?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  original_content?: string | null;
  deleted_by?: string | null;
  replies?: CommentWithReplies[];
  
  // New fields for voting
  upvotes?: number;
  downvotes?: number;
  score?: number;
}

export interface CommentEdit {
  id: string;
  comment_id: string;
  previous_content: string;
  created_at: string;
  edited_by_author: boolean;
}

// New type for comment votes
export interface CommentVote {
  id: string;
  comment_id: string;
  session_id: string | null;
  user_id: string | null;
  vote_type: number; // 1 for upvote, -1 for downvote
  created_at: string;
}