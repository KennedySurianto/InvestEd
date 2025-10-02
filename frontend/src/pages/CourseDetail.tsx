import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/models/Course"; // Import both models
import type { CourseLesson } from "@/models/CourseLesson";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";

export default function CourseDetailPage() {
    const { courseId } = useParams<{ courseId: string }>();

    const [course, setCourse] = useState<Course | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourseData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication required.");
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch course details and completion status in parallel
                const [courseRes, completionRes] = await Promise.all([
                fetch(`http://localhost:3000/api/courses/${courseId}`, { headers }),
                fetch(`http://localhost:3000/api/enrollments/course/${courseId}/completed-lessons`, { headers })
                ]);

                if (!courseRes.ok) throw new Error("Course not found.");
                if (!completionRes.ok) throw new Error("Could not load progress.");
                
                const courseData: Course = await courseRes.json();
                const completedData: number[] = await completionRes.json();
                
                setCourse(courseData);
                setCompletedLessons(new Set(completedData));

                // Automatically select the first uncompleted lesson, or the first lesson if all are complete
                if (courseData.lessons && courseData.lessons.length > 0) {
                const firstUncompleted = courseData.lessons.find(lesson => !completedData.includes(lesson.lesson_id));
                setSelectedLesson(firstUncompleted || courseData.lessons[0]);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId]);

    const handleMarkAsComplete = async () => {
        if (!selectedLesson || isCompleting) return;

        setIsCompleting(true);
        try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3000/api/lessons/${selectedLesson.lesson_id}/complete`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to mark as complete.");
        }

        // Optimistically update the UI
        setCompletedLessons(prev => new Set(prev).add(selectedLesson.lesson_id));

        // Find and navigate to the next lesson
        const currentIndex = course?.lessons.findIndex(l => l.lesson_id === selectedLesson.lesson_id) ?? -1;
        const nextLesson = course?.lessons[currentIndex + 1];
        if (nextLesson) {
            setSelectedLesson(nextLesson);
        } else {
            // Last lesson completed, maybe show a congrats message
            console.log("Course complete!");
        }
        } catch (err: any) {
        // You can show a toast notification with this error
        console.error(err.message);
        } finally {
        setIsCompleting(false);
        }
    };

    const renderLessonContent = () => {
        if (!selectedLesson) {
            return <p className="text-muted-foreground">Select a lesson to begin.</p>;
        }
        
        // Check if the video URL is a YouTube link to create an embeddable URL
        let videoEmbedUrl = null;
        if (selectedLesson.video_url) {
            try {
                const url = new URL(selectedLesson.video_url);
                if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
                const videoId = url.searchParams.get("v");
                if (videoId) {
                    videoEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
                }
            } catch (e) {
                console.error("Invalid video URL:", selectedLesson.video_url);
            }
        }

        return (
            <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
                {videoEmbedUrl && (
                <div className="aspect-video w-full rounded-lg overflow-hidden my-4">
                    <iframe
                    src={videoEmbedUrl}
                    title={selectedLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                    ></iframe>
                </div>
                )}
                {selectedLesson.content && (
                    <div className="mt-4 whitespace-pre-wrap leading-relaxed">
                        {selectedLesson.content}
                    </div>
                )}
            </div>
        );
    };
    
    if (isLoading) {
        return (
            <>
                <AuthHeader />
                <main className="mx-auto max-w-6xl px-4 py-8">
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="aspect-video w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </main>
            </>
        )
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
        )
    }

    const isCurrentLessonCompleted = selectedLesson ? completedLessons.has(selectedLesson.lesson_id) : false;

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
            <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/course-categories" className="hover:underline">Course Categories</Link>
            {" / "}
            <Link to={`/courses/category/${course.category_id}`} className="hover:underline">
                {course.category_name}
            </Link>
            </nav>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground mb-6">by {course.author_name}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Main Content (Left) */}
                <div className="md:col-span-2 rounded-lg border bg-card p-6">
                    {renderLessonContent()}
                    {/* --- Completion Button --- */}
                    {selectedLesson && (
                    <div className="mt-6 border-t pt-4 flex justify-end">
                        <Button onClick={handleMarkAsComplete} disabled={isCompleting || isCurrentLessonCompleted}>
                        {isCompleting ? "Saving..." : isCurrentLessonCompleted ? "Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                    )}
                </div>

                {/* Lesson List (Right) */}
                <aside className="sticky top-24">
                    <h3 className="text-lg font-semibold mb-3">Course Lessons</h3>
                    <ul className="space-y-2">
                    {course.lessons.map(lesson => {
                        const isCompleted = completedLessons.has(lesson.lesson_id);
                        return (
                        <li key={lesson.lesson_id}>
                            <button
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full text-left p-3 rounded-md transition-colors text-sm flex items-center gap-3 ${
                                selectedLesson?.lesson_id === lesson.lesson_id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            >
                            {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-medium flex-1">{lesson.title}</span>
                            <span className="font-mono text-xs opacity-80">{String(lesson.lesson_order).padStart(2, '0')}</span>
                            </button>
                        </li>
                        );
                    })}
                    </ul>
                </aside>
            </div>
        </main>
    </>
    );
}