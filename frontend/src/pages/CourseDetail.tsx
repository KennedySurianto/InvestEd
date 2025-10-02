import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/models/Course"; // Import both models
import type { CourseLesson } from "@/models/CourseLesson";
import { Button } from "@/components/ui/button";

// Helper to check if a lesson is completed (for future use)
// For now, it's just a placeholder
const isLessonCompleted = (lessonId: number) => {
    // In a real app, you'd check this against user progress data
    return false;
};

export default function CourseDetailPage() {
    const { courseId } = useParams<{ courseId: string }>();

    const [course, setCourse] = useState<Course | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication required.");

                const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error("Course not found or failed to load.");
                }
                
                const data: Course = await response.json();
                setCourse(data);

                // Automatically select the first lesson if it exists
                if (data.lessons && data.lessons.length > 0) {
                    setSelectedLesson(data.lessons[0]);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

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

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
            <nav className="text-sm text-muted-foreground mb-4">
                <Link to="/course-categories" className="hover:underline underline-offset-4">
                    Course Categories
                </Link>
                {" / "}
                {/* This is now a link that goes back to the specific category page */}
                <Link 
                    to={`/course-category/${course.category_id}`} 
                    className="hover:underline underline-offset-4"
                >
                    {course.category_name}
                </Link>
            </nav>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground mb-6">by {course.author_name}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Main Content (Left) */}
            <div className="md:col-span-2 rounded-lg border bg-card p-6">
                {renderLessonContent()}
            </div>

            {/* Lesson List (Right) */}
            <aside className="sticky top-24">
                <h3 className="text-lg font-semibold mb-3">Course Lessons</h3>
                <ul className="space-y-2">
                {course.lessons.length > 0 ? (
                    course.lessons.map(lesson => (
                    <li key={lesson.lesson_id}>
                        <button
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full text-left p-3 rounded-md transition-colors text-sm flex items-center gap-3 ${
                            selectedLesson?.lesson_id === lesson.lesson_id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        >
                        <span className="font-mono text-xs opacity-80">{String(lesson.lesson_order).padStart(2, '0')}</span>
                        <span className="font-medium">{lesson.title}</span>
                        </button>
                    </li>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground p-3">No lessons have been added to this course yet.</p>
                )}
                </ul>
            </aside>
            </div>
        </main>
        </>
    );
}