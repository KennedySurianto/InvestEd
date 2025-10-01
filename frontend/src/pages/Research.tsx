import { useState, useEffect } from "react";
import AuthHeader from "@/components/AuthHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResearchArticle } from "@/models/Research";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle } from "lucide-react";

type PaginatedResponse = {
    data: ResearchArticle[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
};

export default function ResearchPage() {
    const [researches, setResearches] = useState<ResearchArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- State for Search and Pagination ---
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10; // Articles per page

    const { user } = useAuth();

    // --- Debounce search input to avoid excessive API calls ---
    useEffect(() => {
        const timer = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1); // Reset to the first page for a new search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- Fetch data when the page or search term changes ---
    useEffect(() => {
        const fetchResearches = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            let url = "";
            // Decide which endpoint to use
            if (debouncedSearchTerm) {
            url = `http://localhost:3000/api/researches/search?q=${debouncedSearchTerm}&page=${currentPage}&limit=${limit}`;
            } else {
            url = `http://localhost:3000/api/researches?page=${currentPage}&limit=${limit}`;
            }

            const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
            throw new Error(`Failed to fetch research. Status: ${response.status}`);
            }

            const result: PaginatedResponse = await response.json();
            setResearches(result.data);
            setTotalPages(result.pagination.totalPages);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
        };

        fetchResearches();
    }, [debouncedSearchTerm, currentPage]);

    const renderList = () => {
        if (isLoading) {
            return Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                </div>
                </li>
            ));
        }

        if (error) {
            return <p className="rounded-lg border border-destructive bg-card p-4 text-center text-sm text-destructive">{error}</p>;
        }

        if (researches.length === 0) {
            return <p className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">No research found.</p>;
        }

        return researches.map((r) => (
            <li 
                key={r.research_id} 
                className="rounded-lg border bg-card transition-all hover:shadow-md hover:border-primary/50"
            >
                <Link 
                to={`/research/${r.research_id}`} 
                className="block p-4 cursor-pointer"
                >
                <div className="flex items-center justify-between">
                    <div>
                    <p className="font-medium">{r.title} ({r.stock_symbol})</p>
                    <p className="text-sm text-muted-foreground">{r.author_name}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                    {new Date(r.published_at).toLocaleDateString("en-GB", {
                        day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    </span>
                </div>
                </Link>
            </li>
        ));
    };

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Research</h1>
                <p className="mt-1 text-muted-foreground">Analyst notes, watchlists, and reports.</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input
                    type="search"
                    placeholder="Search by title, symbol..."
                    className="w-full sm:max-w-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {user?.role === 'admin' && (
                    <Link to="/admin/research/create">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </Link>
                )}
            </div>
            </div>

            <ul className="mt-6 space-y-3">
            {renderList()}
            </ul>

            {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-4">
                <Button
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage <= 1 || isLoading}
                >
                Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
                </span>
                <Button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages || isLoading}
                >
                Next
                </Button>
            </div>
            )}
        </main>
        </>
    );
}