import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CreateForumPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError("Title and content cannot be empty.");
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const response = await fetch("http://localhost:3000/api/forums", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, content }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create thread.");
        }

        // On success, redirect the user back to the main forums page
        navigate("/forum");

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AuthHeader />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <nav className="text-sm text-muted-foreground mb-4">
                <Link to="/forum" className="hover:underline underline-offset-4">
                    Forums
                </Link>
                {" / "}
                <span className="text-foreground">Create Thread</span>
                </nav>

                <h1 className="text-2xl font-semibold">Create a New Thread</h1>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-lg border bg-card p-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title"
                    required
                    disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts, analysis, or questions..."
                    rows={10}
                    required
                    disabled={isSubmitting}
                    />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Posting..." : "Post Thread"}
                    </Button>
                </div>
                </form>
            </main>
        </>
    );
}