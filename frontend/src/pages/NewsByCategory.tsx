import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Input } from "@/components/ui/input"; // Assuming you have these UI components
import { Button } from "@/components/ui/button"; // Assuming you have these UI components
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have these UI components
import type { NewsArticle } from "@/models/News";

// Define the structure of the API's paginated response
type PaginatedNewsResponse = {
  data: NewsArticle[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
};

export default function NewsByCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const location = useLocation();
  const categoryName = location.state?.categoryName || categoryId;

  const [list, setList] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- New State for Search and Pagination ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10; // Number of articles per page

  // --- Debounce search input ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 for a new search
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Revamped data fetching effect ---
  useEffect(() => {
    if (!categoryId) return;

    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        let url = "";
        // Decide which API endpoint to use based on search term
        if (debouncedSearchTerm) {
          // Use the global search endpoint
          url = `http://localhost:3000/api/news/search?q=${debouncedSearchTerm}&page=${currentPage}&limit=${limit}`;
        } else {
          // Use the category-specific endpoint
          url = `http://localhost:3000/api/news/category/${categoryId}?page=${currentPage}&limit=${limit}`;
        }

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result: PaginatedNewsResponse = await response.json();
        setList(result.data);
        setTotalPages(result.pagination.totalPages);
      } catch (err: any) {
        console.error("Failed to fetch news:", err);
        setError("Could not load articles. Please try again later.");
        setList([]); // Clear list on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [categoryId, currentPage, debouncedSearchTerm]); // Re-run effect when these change

  const renderContent = () => {
    if (isLoading) {
      // Render skeleton loaders
      return Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="rounded-lg border bg-card p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </li>
      ));
    }

    if (error) {
      return <li className="rounded-lg border border-destructive bg-card p-4 text-destructive">{error}</li>;
    }

    if (list.length === 0) {
      return <li className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No articles found.</li>;
    }

    return list.map((article) => (
      <li key={article.news_id} className="rounded-lg border bg-card p-4">
        <p className="font-medium">{article.title}</p>
        <div className="text-xs text-muted-foreground flex items-center space-x-2 mt-1">
          <span>{article.author_name}</span>
          <span>•</span>
          <span>
            {new Date(article.published_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric"
            })}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{article.content}</p>
      </li>
    ));
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <nav className="text-sm text-muted-foreground">
          <Link to="/news-category" className="hover:underline underline-offset-4">
            News Category
          </Link>
          {!debouncedSearchTerm && (
            <>
              {" / "}
              <span className="text-foreground">{categoryName}</span>
            </>
          )}
        </nav>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold capitalize">
            {debouncedSearchTerm 
              ? `Results for “${debouncedSearchTerm}”` 
              : `Latest in “${categoryName}”`}
          </h1>
          <Input
            type="search"
            placeholder="Search all articles..."
            className="w-full sm:max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ul className="mt-6 space-y-4">{renderContent()}</ul>

        {/* --- Pagination Controls --- */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-4">
            <Button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((p) => p + 1)}
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