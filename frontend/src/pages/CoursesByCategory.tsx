import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthHeader from "@/components/AuthHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/models/Course";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type PaginatedResponse = {
    data: Course[];
    pagination: {
        totalPages: number;
    };
};

export default function CoursesByCategoryPage() {
    const { categoryId } = useParams<{ categoryId: string }>();
    const [categoryName, setCategoryName] = useState<string>("");

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const { user } = useAuth(); // Corrected to useUser
    const limit = 9; // Items per page

    // Fetch the category name for the header
    useEffect(() => {
        const fetchCategoryName = async () => {
            try {
                // This GET request is public and does not need a token
                const response = await fetch(`http://localhost:3000/api/course-categories/${categoryId}`);
                if (response.ok) {  
                    const data = await response.json();
                    setCategoryName(data.category_name);
                } else {
                    setCategoryName(`Category ${categoryId}`);
                }
            } catch (err) {
                setCategoryName(`Category ${categoryId}`);
            }
        };
        if (categoryId) fetchCategoryName();
    }, [categoryId]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Refactored data fetching logic
    useEffect(() => {
        if (!categoryId) return;

        const fetchCourses = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found.");

                let url = "";
                // If searching, use the global course search endpoint
                if (debouncedSearchTerm) {
                    // This assumes a global course search endpoint exists
                    url = `http://localhost:3000/api/courses/search?q=${debouncedSearchTerm}&page=${currentPage}&limit=${limit}`;
                } else {
                    // Otherwise, use the new category-specific endpoint
                    url = `http://localhost:3000/api/courses/category/${categoryId}?page=${currentPage}&limit=${limit}`;
                }

                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const result: PaginatedResponse = await response.json();
                setCourses(result.data);
                setTotalPages(result.pagination.totalPages);
            } catch (err: any) {
                setError(err.message);
                setCourses([]); // Clear the list on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, [categoryId, currentPage, debouncedSearchTerm, limit]);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 6 }).map((_, index) => (
                <li key={index} className="rounded-lg border bg-card p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </li>
            ));
        }
        if (error) return <p className="text-destructive col-span-full text-center py-8">{error}</p>;
        if (courses.length === 0) return <p className="text-muted-foreground col-span-full text-center py-8">No courses found.</p>;

        return courses.map((course) => (
            <li key={course.course_id} className="rounded-lg border bg-card p-5 transition-all hover:shadow-lg">
                <h2 className="text-lg font-semibold">{course.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">by {course.author_name}</p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 h-[40px]">{course.description}</p>
                <Link to={`/course/${course.course_id}`} className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
                    View Course
                </Link>
            </li>
        ));
    };

    return (
        <>
            <AuthHeader />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <nav className="text-sm text-muted-foreground">
                    <Link to="/course-category" className="hover:underline underline-offset-4">Course Categories</Link>
                    {" / "}
                    <span className="text-foreground">{categoryName || "Loading..."}</span>
                </nav>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-semibold capitalize">
                        {debouncedSearchTerm ? `Results for "${debouncedSearchTerm}"` : `Courses in “${categoryName}”`}
                    </h1>
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Input
                            type="search"
                            placeholder="Search courses..."
                            className="w-full sm:max-w-xs h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {user?.role === 'admin' && (
                            <Link to="/admin/course/create" state={{ categoryId, categoryName }}>
                                <Button className="h-10">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {renderContent()}
                </ul>

                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center space-x-4">
                        <Button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1 || isLoading}>Previous</Button>
                        <span className="font-medium">Page {currentPage} of {totalPages}</span>
                        <Button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages || isLoading}>Next</Button>
                    </div>
                )}
            </main>
        </>
    );
}