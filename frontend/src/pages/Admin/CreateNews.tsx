import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, type FormEvent } from "react";
import AuthHeader from "@/components/AuthHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { ArrowLeft } from "lucide-react";
import type { NewsCategory } from "@/models/NewsCategory";

// Define the shape of the expected paginated API response
type PaginatedCategoriesResponse = {
    data: NewsCategory[];
    // We don't need pagination details here, but defining the shape is good practice
};

// This will be the main component
export default function CreateNewsPage() {
    // Form state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

    // Component state
    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hooks
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the pre-selected category from the previous page, if it exists
    const preselectedCategory = location.state as { categoryId: string; categoryName: string } | undefined;

    // --- Fetch all categories for the dropdown ---
    useEffect(() => {
        const fetchCategories = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch('http://localhost:3000/api/news-categories', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch categories.");
                
                // FIX: Expect a paginated object and extract the 'data' property which is the array.
                const result: PaginatedCategoriesResponse = await response.json();
                const categoriesArray = result.data;
                
                setCategories(categoriesArray);

                // If a category was passed from the previous page, pre-select it
                if (preselectedCategory?.categoryId) {
                    setSelectedCategoryId(preselectedCategory.categoryId);
                } else if (categoriesArray.length > 0) {
                    // Otherwise, select the first category by default, converting its number ID to a string
                    setSelectedCategoryId(String(categoriesArray[0].category_id));
                }
            } catch (err) {
                setError("Could not load categories for selection.");
            }
        };
        fetchCategories();
    }, [preselectedCategory?.categoryId]);

    // --- Handle form submission ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !selectedCategoryId) {
            setError("Title, content, and a selected category are required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found.");

            const response = await fetch(`http://localhost:3000/api/news`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    category_id: selectedCategoryId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            showToast({
                title: "Success",
                description: "News article created successfully.",
                type: "success"
            });
            // Navigate to the category page where the article was posted
            navigate(`/news-category/${selectedCategoryId}`);

        } catch (err: any) {
            setError(err.message);
            showToast({ title: "Error", description: "Failed to create the article.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AuthHeader />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6">
                    <Link
                        to={preselectedCategory ? `/news-category/${preselectedCategory.categoryId}` : '/news-categories'}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to News
                    </Link>
                    <h1 className="text-2xl font-semibold">Create New Article</h1>
                    <p className="mt-1 text-muted-foreground">Fill out the details below to publish a new article.</p>
                </div>

                <div className="rounded-lg border bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title Input */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">Title</label>
                            <Input id="title" type="text" placeholder="Article Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} required />
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">Category</label>
                            <select
                                id="category"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                disabled={loading || categories.length === 0}
                                required
                                className="h-10 border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.category_id} value={cat.category_id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                            {categories.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Loading categories...</p>}
                        </div>

                        {/* Content Textarea */}
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">Content</label>
                            <Textarea id="content" placeholder="Write your article content here..." value={content} onChange={(e) => setContent(e.target.value)} rows={10} disabled={loading} required />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Publishing...' : 'Publish Article'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}

