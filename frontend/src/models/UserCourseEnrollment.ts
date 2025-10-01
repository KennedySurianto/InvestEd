export interface UserCourseEnrollment {
    enrollment_id: number;
    user_id: string; // UUID
    course_id: number;
    enrollment_date: string; // ISO 8601 date string
    completion_status: boolean;
    progress_percentage: number;
}