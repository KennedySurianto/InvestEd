import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

export default function CreateCourseCategoryPage() {
    const [categoryName, setCategoryName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            setError("Category name cannot be empty.");
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const response = await fetch("http://localhost:3000/api/course-categories", {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ category_name: categoryName, description }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to create category.");
            }

            // On success, redirect back to the main course categories page
            showToast({ title: "Success", description: "Course category created successfully!", type: "success" });
            navigate("/course-category");

        } catch (err: any) {
            setError(err.message);
            showToast({ title: "Error", description: "Failed to create course category.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AuthHeader />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <nav className="text-sm text-muted-foreground mb-4">
                <Link to="/course-category" className="hover:underline underline-offset-4">
                    Course Categories
                </Link>
                {" / "}
                <span className="text-foreground">Create</span>
                </nav>

                <h1 className="text-2xl font-semibold">Create New Course Category</h1>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-lg border bg-card p-6">
                <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                    id="categoryName"
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g., Value Investing"
                    required
                    disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief summary of what this category covers..."
                    rows={4}
                    disabled={isSubmitting}
                    />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Category"}
                    </Button>
                </div>
                </form>
            </main>
        </>
    );
}