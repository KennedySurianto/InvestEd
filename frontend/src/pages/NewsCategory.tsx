import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import AuthHeader from "@/components/AuthHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input" // Assuming you have this
import { Button } from "@/components/ui/button" // Assuming you have this
import { useToast } from "@/hooks/useToast"
import { type NewsCategory } from "@/models/NewsCategory"
import { PlusCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// The API response for pagination will be structured like this
type PaginatedResponse = {
    data: NewsCategory[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
};

export default function NewsCategoriesPage() {
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // State for search
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 8; // Items per page

    const { showToast } = useToast();
    const { user } = useAuth();

    // Debounce the search term to avoid excessive API calls
    useEffect(() => {
        const timerId = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1); // Reset to first page on new search
        }, 500); // 500ms delay

        return () => {
        clearTimeout(timerId);
        };
    }, [searchTerm]);

    // Fetch data when page or debounced search term changes
    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error("Authentication token not found.");
                }

                let url = "";
                // Decide which endpoint to use
                if (debouncedSearchTerm) {
                    url = `http://localhost:3000/api/news-categories/search?q=${debouncedSearchTerm}`;
                } else {
                    url = `http://localhost:3000/api/news-categories?page=${currentPage}&limit=${limit}`;
                }

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                // Handle different response structures
                if (debouncedSearchTerm) {
                    setCategories(data);
                    setTotalPages(1); // Search results are not paginated in this implementation
                } else {
                    const paginatedData = data as PaginatedResponse;
                    setCategories(paginatedData.data);
                    setTotalPages(paginatedData.pagination.totalPages);
                }
            } catch (err: any) {
                setError(err.message);
                showToast({ title: "Error", description: "Failed to fetch news categories.", type: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [debouncedSearchTerm, currentPage, limit, showToast]);

    const renderPagination = () => {
        // Only show pagination if not searching and there's more than one page
        if (debouncedSearchTerm || totalPages <= 1) return null;

        return (
        <div className="mt-8 flex items-center justify-center space-x-4">
            <Button
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1 || loading}
            >
            Previous
            </Button>
            <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
            </span>
            <Button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage === totalPages || loading}
            >
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
                <h1 className="text-2xl font-semibold">News Categories</h1>
                <p className="mt-1 text-muted-foreground">Explore market news by your favorite category.</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input
                    type="search"
                    placeholder="Search categories..."
                    className="w-full sm:max-w-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* Conditionally render the button ONLY if the user is an admin */}
                {user?.role === 'admin' && (
                    <Link to="/admin/news-categories/create">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </Link>
                )}
            </div>
            </div>

            {error && <p className="mt-6 rounded-md border border-destructive bg-card p-4 text-center text-sm text-destructive">Error: {error}</p>}

            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {loading
                ? Array.from({ length: limit }).map((_, index) => (
                <li key={index} className="rounded-lg border bg-card p-5">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-4 h-4 w-1/2" />
                </li>
                ))
                : categories.map((c) => (
                <li key={c.category_id} className="rounded-lg border bg-card p-5 transition-all hover:shadow-md">
                    <h2 className="text-lg font-semibold">{c.category_name}</h2>
                    <Link
                    to={`/news-category/${c.category_id}`}
                    className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
                    >
                    View news in this category
                    </Link>
                </li>
                ))}
            </ul>

            {/* Render a message if no results are found */}
            {!loading && categories.length === 0 && !error && (
                <div className="mt-6 rounded-md border bg-card p-8 text-center text-muted-foreground">
                    <p className="font-semibold">No Categories Found</p>
                    <p className="mt-1 text-sm">
                        {debouncedSearchTerm 
                            ? `Your search for "${debouncedSearchTerm}" did not return any results.` : 
                            'There are no categories to display.'
                        }
                    </p>
                </div>
            )}

            {renderPagination()}
        </main>
        </>
    );
}