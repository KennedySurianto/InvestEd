export interface UserLessonCompletion {
    completion_id: number;
    user_id: string; // UUID
    lesson_id: number;
    completed_at: string; // ISO 8601 date string
}