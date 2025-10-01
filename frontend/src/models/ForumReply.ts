export interface ForumReply {
    reply_id: number;
    forum_id: number;
    user_id: string; // UUID
    content: string;
    parent_reply_id?: number; // For threaded replies
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}
