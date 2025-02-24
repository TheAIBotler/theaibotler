// types/comments.ts
export type CommentWithReplies = {
    id: string;
    post_id: string;
    parent_id: string | null;
    content: string;
    author_id: string | null;
    commenter_name: string | null;
    session_id: string | null;
    created_at: string;
    updated_at: string;
    replies?: CommentWithReplies[];
    edits?: CommentEdit[];
    is_author?: boolean;
  };
  
  export type CommentEdit = {
    id: string;
    comment_id: string;
    content: string;
    edited_by_author: boolean;
    edited_at: string;
  };
  
  export type Author = {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    created_at: string;
  };