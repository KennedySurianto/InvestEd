import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

type ReplyFormProps = {
    onSubmit: (content: string) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    initialContent?: string;
};

export default function ReplyForm({ onSubmit, onCancel, isSubmitting, initialContent = "" }: ReplyFormProps) {
    const [content, setContent] = useState(initialContent);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
        onSubmit(content);
        setContent(""); // Clear form on submit
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 mt-2">
        <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Your Reply</label>
            <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
            <X className="h-4 w-4" />
            </Button>
        </div>
        <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
        />
        <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Posting..." : "Submit Reply"}
            </Button>
        </div>
        </form>
    );
}