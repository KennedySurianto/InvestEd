import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CourseCategory } from "@/models/CourseCategory";

export default function CreateCoursePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { categoryId: preselectedCategoryId, categoryName: preselectedCategoryName } = location.state || {};

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(preselectedCategoryId);
    
    const [allCategories, setAllCategories] = useState<CourseCategory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch all course categories to populate the dropdown
    useEffect(() => {
        const fetchCategories = async () => {
        try {
            // This is a public endpoint
            const response = await fetch("http://localhost:3000/api/course-categories");
            if (!response.ok) throw new Error("Failed to fetch categories.");
            const data = await response.json();
            // The endpoint returns a paginated structure, we need the `data` property
            setAllCategories(data.data || data); // Handle both paginated and non-paginated responses
        } catch (err: any) {
            setError("Could not load course categories. Please try again later.");
        }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !selectedCategoryId) {
            setError("Title and category are required.");
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token is missing.");

            const response = await fetch("http://localhost:3000/api/courses", {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    title, 
                    description, 
                    category_id: Number(selectedCategoryId) 
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to create the course.");
            }

            // On success, navigate to the category page where the course was added
            const newCourse = result.course;
            navigate(`/admin/course/${newCourse.course_id}/lesson/create`, { 
                state: { courseTitle: newCourse.title } 
            });

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
            <Link to="/course-categories" className="hover:underline underline-offset-4">
                Course Categories
            </Link>
            {preselectedCategoryName && (
                <>
                {" / "}
                <Link to={`/courses/category/${preselectedCategoryId}`} className="hover:underline underline-offset-4">
                    {preselectedCategoryName}
                </Link>
                </>
            )}
            {" / "}
            <span className="text-foreground">Create Course</span>
            </nav>

            <h1 className="text-2xl font-semibold">Create a New Course</h1>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-lg border bg-card p-6">
            <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Technical Analysis"
                required
                disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                value={selectedCategoryId} 
                onValueChange={setSelectedCategoryId}
                required
                disabled={isSubmitting}
                >
                <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {allCategories.length > 0 ? (
                    allCategories.map(cat => (
                        <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                        {cat.category_name}
                        </SelectItem>
                    ))
                    ) : (
                    <p className="p-2 text-sm text-muted-foreground">Loading categories...</p>
                    )}
                </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the course content and objectives."
                rows={8}
                disabled={isSubmitting}
                />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Course"}
                </Button>
            </div>
            </form>
        </main>
        </>
    );
}