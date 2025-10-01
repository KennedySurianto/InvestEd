import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForumThread } from "@/models/Forum";
import type { ForumReply } from "@/models/ForumReply";
import ReplyForm from '@/components/ReplyForm'; // Adjust path
import Reply from '@/components/Reply'; // Adjust path

export default function ForumDetailPage() {
    const { forumId } = useParams<{ forumId: string }>();
    
    const [thread, setThread] = useState<ForumThread | null>(null);
    const [replies, setReplies] = useState<ForumReply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [replyingTo, setReplyingTo] = useState<number | null | "main">(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Memoize the data transformation to avoid re-calculating the tree on every render
    const nestedReplies = useMemo(() => {
        const replyMap = new Map<number, ForumReply>();
        const topLevelReplies: ForumReply[] = [];

        replies.forEach(reply => {
        replyMap.set(reply.reply_id, { ...reply, children: [] });
        });

        replyMap.forEach(reply => {
        if (reply.parent_reply_id && replyMap.has(reply.parent_reply_id)) {
            replyMap.get(reply.parent_reply_id)?.children?.push(reply);
        } else {
            topLevelReplies.push(reply);
        }
        });
        return topLevelReplies;
    }, [replies]);

    const fetchAllData = async () => {
        if (!forumId) return;
        setIsLoading(true);
        setError(null);
        try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        const headers = { Authorization: `Bearer ${token}` };

        const [threadRes, repliesRes] = await Promise.all([
            fetch(`http://localhost:3000/api/forums/${forumId}`, { headers }),
            fetch(`http://localhost:3000/api/forums/${forumId}/replies`, { headers })
        ]);

        if (!threadRes.ok) throw new Error("Failed to load thread.");
        if (!repliesRes.ok) throw new Error("Failed to load replies.");

        const threadData = await threadRes.json();
        const repliesData = await repliesRes.json();

        setThread(threadData);
        setReplies(repliesData.data); // Assuming replies API is now paginated and returns { data: [] }
        
        } catch (err: any) {
        setError(err.message);
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [forumId]);

    const handleReplySubmit = async (content: string, parentReplyId: number | null = null) => {
        if (content.trim() === "" || isSubmitting) return;
        setIsSubmitting(true);
        try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:3000/api/forums/${forumId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ content, parent_reply_id: parentReplyId })
        });

        if (!res.ok) throw new Error("Failed to post reply.");
        
        setReplyingTo(null);
        await fetchAllData();
        } catch (err: any) {
        console.error("Reply submission error:", err);
        // You can add a toast notification here for the user
        } finally {
        setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <AuthHeader />
                <main className="mx-auto max-w-5xl px-4 py-8">
                    <Skeleton className="h-6 w-1/2 mb-6" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-5 w-1/3" />
                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                </main>
            </>
        )
    }

    if (error || !thread) {
        return (
            <>
                <AuthHeader />
                <main className="mx-auto max-w-5xl px-4 py-8 text-center text-destructive">
                    <p>{error || "Thread not found."}</p>
                </main>
            </>
        )
    }

    return (
        <>
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">
            <nav className="text-sm text-muted-foreground mb-6">
            <Link to="/forum" className="hover:underline underline-offset-4">Forums</Link>
            {" / "}
            <span className="text-foreground truncate">{thread?.title ?? ""}</span>
            </nav>

            <div className="rounded-lg border bg-card p-6">
            <h1 className="text-2xl font-bold">{thread?.title ?? ""}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
                <span>By {thread?.author_name ?? ""}</span> • <span>{new Date(thread?.created_at ?? "").toLocaleString()}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap">{thread?.content ?? ""}</p>
            </div>

            <div className="mt-6">
            {replyingTo !== 'main' ? (
                <Button onClick={() => setReplyingTo('main')}>Post a Reply</Button>
            ) : (
                <ReplyForm
                onSubmit={(content: string) => handleReplySubmit(content, null)}
                onCancel={() => setReplyingTo(null)}
                isSubmitting={isSubmitting}
                />
            )}
            </div>

            <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Replies ({replies.length})</h2>
            <div className="space-y-4">
                {nestedReplies.map(reply => (
                <Reply
                    key={reply.reply_id}
                    reply={reply}
                    onSetReplyingTo={setReplyingTo}
                    activeReplyId={typeof replyingTo === 'number' ? replyingTo : null}
                    onSubmitReply={handleReplySubmit}
                    isSubmitting={isSubmitting}
                />
                ))}
            </div>
            </div>
        </main>
        </>
    );
}