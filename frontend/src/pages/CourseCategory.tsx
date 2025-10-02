import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthHeader from "@/components/AuthHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { type CourseCategory } from "@/models/CourseCategory"; // <-- Use the new model
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type PaginatedResponse = {
    data: CourseCategory[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
};

export default function CourseCategoriesPage() {
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 8;

    const { showToast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        const timerId = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            setError(null);
            
            try {
                let url = "";
                // Use the new course categories endpoints
                if (debouncedSearchTerm) {
                    url = `http://localhost:3000/api/course-categories/search?q=${debouncedSearchTerm}&page=${currentPage}&limit=${limit}`;
                } else {
                    url = `http://localhost:3000/api/course-categories?page=${currentPage}&limit=${limit}`;
                }

                // GET request is public, so no Authorization header is needed
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data: PaginatedResponse = await response.json();

                setCategories(data.data);
                setTotalPages(data.pagination.totalPages);
                
            } catch (err: any) {
                setError(err.message);
                showToast({ title: "Error", description: "Failed to fetch course categories.", type: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [debouncedSearchTerm, currentPage, limit, showToast]);

    const renderPagination = () => {
        if (debouncedSearchTerm || totalPages <= 1) return null;
        // ... (Pagination JSX is the same)
        return (
            <div className="mt-8 flex items-center justify-center space-x-4">
                <Button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1 || loading}>
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages || loading}>
                    Next
                </Button>
            </div>
        );
    }

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Course Categories</h1>
                <p className="mt-1 text-muted-foreground">Browse courses by topic and learning paths.</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input
                    type="search"
                    placeholder="Search categories..."
                    className="w-full sm:max-w-xs h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {user?.role === 'admin' && (
                    <Link to="/admin/course-category/create">
                        <Button className="h-10">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </Link>
                )}
            </div>
            </div>

            {error && <p className="mt-6 rounded-md border border-destructive bg-card p-4 text-center text-sm text-destructive">Error: {error}</p>}

            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                <li key={index} className="rounded-lg border bg-card p-5">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-1 h-4 w-1/2" />
                </li>
                ))
                : categories.map((c) => (
                <li key={c.category_id} className="rounded-lg border bg-card p-5 transition-all hover:shadow-md">
                    <h2 className="text-lg font-semibold">{c.category_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description || "No description available."}</p>
                    <Link
                        to={`/course-category/${c.category_id}`}
                        state={{ categoryName: c.category_name }}
                        className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                        View Courses
                    </Link>
                </li>
                ))}
            </ul>

            {!loading && categories.length === 0 && !error && (
                <div className="mt-6 rounded-md border bg-card p-8 text-center text-muted-foreground">
                    <p className="font-semibold">No Categories Found</p>
                    <p className="mt-1 text-sm">
                        {debouncedSearchTerm 
                            ? `Your search for "${debouncedSearchTerm}" did not return any results.` 
                            : 'There are no course categories to display.'
                        }
                    </p>
                </div>
            )}
            {renderPagination()}
        </main>
        </>
    );
}