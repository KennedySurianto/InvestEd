export interface ForumThread {
    forum_id: number;
    title: string;
    content: string;
    user_id: string; // UUID
    author_name: string; // Full name of the author
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}