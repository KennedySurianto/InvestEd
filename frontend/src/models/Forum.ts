export interface ForumThread {
    forum_id: number;
    title: string;
    content: string;
    user_id: string; // UUID
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}