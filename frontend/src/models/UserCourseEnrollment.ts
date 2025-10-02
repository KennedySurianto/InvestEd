export interface UserCourseEnrollment {
    enrollment_id: number;
    enrollment_date: string;
    completion_status: boolean;
    progress_percentage: number;
    course_id: number;
    title: string;
    description: string | null;
    category_name: string;
}