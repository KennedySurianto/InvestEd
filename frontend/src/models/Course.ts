export interface Course {
    course_id: number;
    title: string;
    description?: string;
    category_id: number;
    author_id: string; // UUID of a user with 'admin' role
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}