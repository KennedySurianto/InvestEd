export interface CourseLesson {
    lesson_id: number;
    course_id: number;
    title: string;
    content?: string;
    video_url?: string;
    lesson_order: number;
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}