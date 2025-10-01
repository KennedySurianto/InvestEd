import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp } from "lucide-react"; // Icon for the back-to-top button
import type { NewsArticle } from "@/models/News";
import AuthHeader from "@/components/AuthHeader";

export default function NewsDetailPage() {
    const { newsId } = useParams<{ newsId: string }>();
    const location = useLocation();

    // Attempt to get category info from the previous page's state for the breadcrumb
    const { categoryName, categoryId } = location.state || { categoryName: "News", categoryId: null };

    const [article, setArticle] = useState<NewsArticle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for UI features
    const [isExpanded, setIsExpanded] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    // --- Effect for fetching the single news article ---
    useEffect(() => {
        if (!newsId) return;

        const fetchArticle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const response = await fetch(`http://localhost:3000/api/news/${newsId}`, {
            headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: NewsArticle = await response.json();
            setArticle(data);
        } catch (err: any) {
            console.error("Failed to fetch article:", err);
            setError("Could not load the article. It may not exist or an error occurred.");
        } finally {
            setIsLoading(false);
        }
        };

        fetchArticle();
    }, [newsId]);

    // --- Effect for the "Back to Top" button visibility ---
    useEffect(() => {
        const handleScroll = () => {
        if (window.scrollY > 300) {
            setShowBackToTop(true);
        } else {
            setShowBackToTop(false);
        }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll); // Cleanup listener
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
        top: 0,
        behavior: "smooth",
        });
    };

    const renderContent = () => {
        if (isLoading) {
        return (
            <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
            </div>
            </div>
        );
        }

        if (error || !article) {
        return <p className="rounded-lg border border-destructive bg-card p-4 text-destructive">{error}</p>;
        }

        const CONTENT_TRUNCATE_LENGTH = 600;
        const isContentLong = article.content.length > CONTENT_TRUNCATE_LENGTH;

        return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
            <div className="mt-2 flex items-center space-x-3 text-sm text-muted-foreground">
            <span>By {article.author_name}</span>
            <span>•</span>
            <span>Category: {categoryName}</span>
            <span>•</span>
            <span>
                {new Date(article.published_at).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric"
                })}
            </span>
            </div>
            <div className="mt-6 prose dark:prose-invert max-w-none text-foreground">
            <p>
                {isContentLong && !isExpanded
                ? `${article.content.substring(0, CONTENT_TRUNCATE_LENGTH)}...`
                : article.content}
            </p>
            </div>

            {isContentLong && (
            <Button variant="link" className="px-0 pt-2" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? "View Less" : "View More"}
            </Button>
            )}
        </div>
        );
    };

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <nav className="text-sm text-muted-foreground mb-6">
            <Link to={'/news-category'} className="hover:underline underline-offset-4">
                News Categories
            </Link>
            {" / "}
            <Link to={categoryId ? `/news-category/${categoryId}` : '/news-category'} 
            state={{ categoryName }}className="hover:underline underline-offset-4">
                {categoryName}
            </Link>
            {" / "}
            <span className="text-foreground">
                {isLoading ? "Loading article..." : article?.title ?? "Details"}
            </span>
            </nav>

            {renderContent()}
        </main>

        {/* --- Back to Top Button --- */}
        {showBackToTop && (
            <Button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg"
            size="icon"
            >
            <ArrowUp className="h-6 w-6" />
            </Button>
        )}
        </>
    );
}