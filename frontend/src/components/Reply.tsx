import type { ForumReply } from "@/models/ForumReply";
import { Button } from "@/components/ui/button";
import { CornerDownRight } from "lucide-react";
import ReplyForm from './ReplyForm'; // Adjust path if needed

type ReplyProps = {
    reply: ForumReply;
    onSetReplyingTo: (replyId: number | null) => void;
    activeReplyId: number | null;
    onSubmitReply: (content: string, parentReplyId: number) => void;
    isSubmitting: boolean;
};

export default function Reply({ reply, onSetReplyingTo, activeReplyId, onSubmitReply, isSubmitting }: ReplyProps) {
    const isReplying = activeReplyId === reply.reply_id;

    return (
        <div className="ml-4 pl-4 border-l-2 space-y-4">
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center text-sm mb-2">
            <span className="font-semibold">{reply.author_name}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap">{reply.content}</p>
            <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-auto p-1 text-xs"
            onClick={() => onSetReplyingTo(reply.reply_id)}
            >
            <CornerDownRight className="h-3 w-3 mr-1" />
            Reply
            </Button>
        </div>
        
        {isReplying && (
            <ReplyForm
            onSubmit={(content) => onSubmitReply(content, reply.reply_id)}
            onCancel={() => onSetReplyingTo(null)}
            isSubmitting={false}
            />
        )}

        {/* Render children replies recursively */}
        {reply.children?.map(childReply => (
            <Reply
            key={childReply.reply_id}
            reply={childReply}
            onSetReplyingTo={onSetReplyingTo}
            activeReplyId={activeReplyId}
            onSubmitReply={onSubmitReply}
            isSubmitting={isSubmitting}
            />
        ))}
        </div>
    );
}