import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/models/Course";
import { BookOpen } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function CourseLandingPage() {
    const { courseId } = useParams<{ courseId: string }>();

    const [course, setCourse] = useState<Course | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    
    const { showToast } = useToast();

    useEffect(() => {
        if (!courseId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication required.");
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch course details and user's enrollments in parallel
                const [courseRes, enrollmentsRes] = await Promise.all([
                    fetch(`http://localhost:3000/api/courses/${courseId}`, { headers }),
                    fetch(`http://localhost:3000/api/my-enrollments`, { headers }),
                ]);

                if (!courseRes.ok) throw new Error("Course not found.");
                if (!enrollmentsRes.ok) throw new Error("Could not verify enrollment status.");

                const courseData: Course = await courseRes.json();
                const enrollmentsData = await enrollmentsRes.json();
                
                setCourse(courseData);

                // Check if the current course ID is in the user's enrollments
                const enrolled = enrollmentsData.some(
                    (enrollment: any) => enrollment.course_id === Number(courseId)
                );
                setIsEnrolled(enrolled);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [courseId]);

    const handleEnroll = async () => {
        setIsEnrolling(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:3000/api/courses/${courseId}/enroll`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Enrollment failed.");

            // On success, update the state to show the "Go to Course" button
            setIsEnrolled(true);
            showToast({ title: "Success", description: "You are now enrolled in this course!", type: "success" });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsEnrolling(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <AuthHeader />
                <main className="mx-auto max-w-5xl px-4 py-8">
                    <Skeleton className="h-6 w-1/4 mb-4" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-5 w-1/3 mt-2 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        <Skeleton className="h-32 w-full" />
                    </div>
                </main>
            </>
        );
    }

    if (error || !course) {
        return (
            <>
                <AuthHeader />
                <main className="mx-auto max-w-5xl px-4 py-8 text-center">
                    <p className="text-destructive">{error || "This course could not be found."}</p>
                    <Link to="/course-category" className="mt-4 inline-block">
                        <Button variant="outline">Back to Categories</Button>
                    </Link>
                </main>
            </>
        );
    }
    
    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/course-category" className="hover:underline">Course Categories</Link>
            {" / "}
            <Link to={`/course-category/${course.category_id}`} className="hover:underline">
                {course.category_name}
            </Link>
            </nav>
            <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">by {course.author_name}</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Side: Description and Lessons */}
            <div className="md:col-span-2">
                <div className="prose dark:prose-invert max-w-none">
                <p>{course.description}</p>
                </div>

                <h2 className="mt-8 text-2xl font-semibold border-b pb-2 mb-4">What you'll learn</h2>
                <ul className="space-y-3">
                {course.lessons?.length > 0 ? (
                    course.lessons.map(lesson => (
                    <li key={lesson.lesson_id} className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                        <div>
                        <p className="font-semibold">{lesson.title}</p>
                        </div>
                    </li>
                    ))
                ) : (
                    <p className="text-muted-foreground">Lessons for this course will be available soon.</p>
                )}
                </ul>
            </div>

            {/* Right Side: CTA Card */}
            <aside className="sticky top-24">
                <div className="rounded-lg border bg-card p-6 text-center">
                <h3 className="text-lg font-semibold">Start Learning Now</h3>
                {isEnrolled ? (
                    <>
                    <p className="mt-2 text-sm text-green-600">You are enrolled in this course.</p>
                    <Link to={`/course/${course.course_id}/learn`} className="mt-4 inline-block w-full">
                        <Button className="w-full">Go to Course</Button>
                    </Link>
                    </>
                ) : (
                    <>
                    <p className="mt-2 text-sm text-muted-foreground">Gain access to all lessons and materials.</p>
                    <Button className="w-full mt-4" onClick={handleEnroll} disabled={isEnrolling}>
                        {isEnrolling ? "Enrolling..." : "Enroll Now"}
                    </Button>
                    </>
                )}
                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                </div>
            </aside>
            </div>
        </main>
        </>
    );
}