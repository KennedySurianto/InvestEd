import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForumThread } from "@/models/Forum";

type PaginatedResponse = {
    data: ForumThread[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
};

export default function ForumsPage() {
    const [threads, setThreads] = useState<ForumThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- State for Search and Pagination ---
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10; // Threads per page

    // --- Debounce search input ---
    useEffect(() => {
        const timer = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1); // Reset to page 1 for a new search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- Fetch data from API ---
    useEffect(() => {
        const fetchThreads = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            let url = "";
            // Decide which endpoint to use
            if (debouncedSearchTerm) {
            url = `http://localhost:3000/api/forums/search?q=${debouncedSearchTerm}&page=${currentPage}&limit=${limit}`;
            } else {
            url = `http://localhost:3000/api/forums?page=${currentPage}&limit=${limit}`;
            }

            const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
            throw new Error(`Failed to fetch threads. Status: ${response.status}`);
            }

            const result: PaginatedResponse = await response.json();
            setThreads(result.data);
            setTotalPages(result.pagination.totalPages);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
        };

        fetchThreads();
    }, [debouncedSearchTerm, currentPage]);

    const renderList = () => {
        if (isLoading) {
        return Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-4 w-24" />
            </div>
            </li>
        ));
        }

        if (error) {
        return <p className="rounded-lg border border-destructive bg-card p-4 text-center text-sm text-destructive">{error}</p>;
        }

        if (threads.length === 0) {
        return <p className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">No threads found.</p>;
        }

        return threads.map((t) => (
            <li 
                key={t.forum_id} 
                className="rounded-lg border bg-card transition-all hover:shadow-md hover:border-primary/50"
            >
                <Link 
                to={`/forum/${t.forum_id}`} 
                className="block p-4 cursor-pointer"
                >
                <div className="flex items-center justify-between">
                    <div>
                    {/* The title is now a <p> tag since the whole card is a link */}
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-muted-foreground">by {t.author_name}</p>
                    </div>
                    <div className="text-right">
                    <span className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("en-GB", {
                        day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </span>
                    </div>
                </div>

                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {t.content}
                </p>
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
                <h1 className="text-2xl font-semibold">Forums</h1>
                <p className="mt-1 text-muted-foreground">Discuss strategies and market news.</p>
            </div>
            <Input
                type="search"
                placeholder="Search threads..."
                className="w-full sm:max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
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