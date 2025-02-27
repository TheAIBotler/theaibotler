// Update Comment and CommentWithReplies types in your app/utils/supabase/types.ts file

export type Comment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author_id: string | null;
  commenter_name: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  is_author: boolean;
  // Add the new fields for soft deletion
  is_deleted?: boolean;
  deleted_by?: string | null;
  original_content?: string | null;
};

export type CommentWithReplies = Comment & {
  replies?: CommentWithReplies[];
  edits?: CommentEdit[];
};

export type CommentEdit = {
  id: string;
  comment_id: string;
  previous_content: string;
  edited_by_author: boolean;
  created_at: string;
};