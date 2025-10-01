import { Link, useNavigate } from "react-router-dom"
import { useState, type FormEvent } from "react"
import AuthHeader from "@/components/AuthHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft } from "lucide-react"

export default function CreateNewsCategoryPage() {
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();
    const navigate = useNavigate();
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            setError("Category name cannot be empty.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // This check is still useful as a fallback
                throw new Error("Authentication token not found. Please log in again.");
            }

            const response = await fetch(`http://localhost:3000/api/news-categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ category_name: categoryName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            // Success
            showToast({
                title: "Success",
                description: "News category created successfully.",
                type: "success"
            });
            navigate('/news-category'); // Redirect back to the list

        } catch (err: any) {
            setError(err.message);
            showToast({
                title: "Error",
                description: "Failed to create news category.",
                type: "error"
            });
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
                        to="/news-category" 
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Categories
                    </Link>
                    <h1 className="text-2xl font-semibold">Create New Category</h1>
                    <p className="mt-1 text-muted-foreground">Add a new category for market news.</p>
                </div>

                <div className="rounded-lg border bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="categoryName" className="block text-sm font-medium text-foreground mb-2">
                                Category Name
                            </label>
                            <Input
                                id="categoryName"
                                type="text"
                                placeholder="e.g., Technology, Finance, Healthcare"
                                className="h-10"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Category'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}