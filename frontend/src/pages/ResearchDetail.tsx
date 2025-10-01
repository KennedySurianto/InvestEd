import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResearchArticle } from "@/models/Research";

export default function ResearchDetailPage() {
    const { researchId } = useParams<{ researchId: string }>();
    const [article, setArticle] = useState<ResearchArticle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    if (!researchId) return;

    const fetchResearchDetail = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const response = await fetch(`http://localhost:3000/api/researches/${researchId}`, {
            headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: ResearchArticle = await response.json();
            setArticle(data);
        } catch (err: any) {
            console.error("Failed to fetch research detail:", err);
            setError("Could not load the research article. Please try again later.");
        } finally {
            setIsLoading(false);
        }
        };

        fetchResearchDetail();
    }, [researchId]);

    const renderDetail = () => {
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

        return (
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
                <div className="mt-2 flex items-center space-x-3 text-sm text-muted-foreground">
                <span>By {article.author_name}</span>
                <span>•</span>
                <span>Stock: <span className="font-semibold text-foreground">{article.stock_symbol}</span></span>
                <span>•</span>
                <span>
                    {new Date(article.published_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                    })}
                </span>
                </div>
                <div className="mt-6 prose dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                <p>{article.content}</p>
                </div>
            </div>
        );
    };

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <nav className="text-sm text-muted-foreground mb-6">
            <Link to="/research" className="hover:underline underline-offset-4">
                Research
            </Link>
            {" / "}
            <span className="text-foreground">
                {isLoading ? "Loading..." : article?.title ?? "Detail"}
            </span>
            </nav>

            {renderDetail()}
        </main>
        </>
    );
}