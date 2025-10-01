import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { useToast } from "@/hooks/useToast";
import { ArrowLeft } from "lucide-react";

export default function CreateResearchPage() {
    const [stockSymbol, setStockSymbol] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!stockSymbol.trim() || !title.trim() || !content.trim()) {
            setError("Stock symbol, title, and content are required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const response = await fetch(`http://localhost:3000/api/researches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    stock_symbol: stockSymbol.toUpperCase(),
                    title: title,
                    content: content
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            // Success
            showToast({
                title: "Success",
                description: "Research article created successfully.",
                type: "success"
            });
            navigate('/research'); // Redirect back to the research list

        } catch (err: any) {
            setError(err.message);
            showToast({
                title: "Error",
                description: err.message || "Failed to create research article.",
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
                        to="/research"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Research
                    </Link>
                    <h1 className="text-2xl font-semibold">Create New Research</h1>
                    <p className="mt-1 text-muted-foreground">Publish a new research article or analyst note.</p>
                </div>

                <div className="rounded-lg border bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="stockSymbol" className="block text-sm font-medium text-foreground mb-2">
                                    Stock Symbol
                                </label>
                                <Input
                                    id="stockSymbol"
                                    type="text"
                                    placeholder="e.g., AAPL, GOOGL"
                                    className="h-10"
                                    value={stockSymbol}
                                    onChange={(e) => setStockSymbol(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                                    Title
                                </label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="Article Title"
                                    className="h-10"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
                                Content
                            </label>
                            <Textarea
                                id="content"
                                placeholder="Write the research content here..."
                                className="min-h-[200px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Publishing...' : 'Publish Research'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
