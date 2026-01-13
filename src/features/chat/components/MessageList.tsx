import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface MessageListProps {
    messages: Message[];
    isGroup: boolean;
    currentUserId: number | null;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onEdit: (msg: Message) => void;
    onDelete: (msg: Message) => void;
    onRecall: (msg: Message) => void;
    onReply?: (msg: Message) => void;
    onForward?: (msg: Message) => void;
    onPin?: (msg: Message) => void;
    onReaction?: (msgId: number, emoji: string, hasUserReacted: boolean) => void;
}

export function MessageList({
    messages,
    isGroup,
    currentUserId,
    messagesEndRef,
    onEdit,
    onDelete,
    onRecall,
    onReply,
    onForward,
    onPin,
    onReaction,
}: MessageListProps) {
    return (
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
                {messages.map((msg, index) => {
                    const isSameSenderAsPrev = index > 0 && messages[index - 1].sender_id === msg.sender_id;
                    const isOwn = msg.sender_id === currentUserId;

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={isOwn}
                            isGroup={isGroup}
                            isSameSenderAsPrev={isSameSenderAsPrev}
                            currentUserId={currentUserId}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onRecall={onRecall}
                            onReply={onReply}
                            onForward={onForward}
                            onPin={onPin}
                            onReaction={onReaction}
                        />
                    );
                })}
                <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
            </div>
        </ScrollArea>
    );
}
