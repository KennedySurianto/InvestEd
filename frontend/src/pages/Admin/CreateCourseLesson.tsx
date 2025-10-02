import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseLesson } from "@/models/CourseLesson";

export default function CreateLessonPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const courseTitle = location.state?.courseTitle || "Course";

  const [existingLessons, setExistingLessons] = useState<CourseLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);

  // Function to fetch existing lessons for this course
  const fetchLessons = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use the GET /api/courses/:id endpoint which returns the course with its lessons
      const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch existing lessons.");

      const courseData = await response.json();
      setExistingLessons(courseData.lessons || []);
      // Automatically set the next lesson order
      setLessonOrder((courseData.lessons?.length || 0) + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          content,
          video_url: videoUrl,
          lesson_order: lessonOrder,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      // Clear the form and refetch lessons to update the list
      setTitle("");
      setContent("");
      setVideoUrl("");
      await fetchLessons(); // This will also increment the lessonOrder for the next entry

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AuthHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/course-categories" className="hover:underline">Course Categories</Link>
          {" / "}
          <span className="text-foreground truncate">{courseTitle}</span>
          {" / "}
          <span className="text-foreground">Add Lessons</span>
        </nav>
        <h1 className="text-2xl font-semibold">Add Lessons to "{courseTitle}"</h1>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Side: Form */}
          <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold border-b pb-2">Create New Lesson</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessonOrder">Lesson Order</Label>
                <Input id="lessonOrder" type="number" value={lessonOrder} onChange={(e) => setLessonOrder(Number(e.target.value))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (Optional)</Label>
              <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Lesson Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Detailed text content for the lesson..." />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>Done</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Lesson"}</Button>
            </div>
          </form>

          {/* Right Side: Existing Lessons List */}
          <aside className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Existing Lessons</h3>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            ) : existingLessons.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {existingLessons.map(lesson => (
                  <li key={lesson.lesson_id} className="flex justify-between items-center rounded-md bg-muted/50 p-2">
                    <span>{lesson.lesson_order}. {lesson.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No lessons added yet.</p>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}