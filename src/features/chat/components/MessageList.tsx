import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface MessageListProps {
    messages: Message[];
    currentUserId: number | null;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onEdit: (msg: Message) => void;
    onDelete: (msg: Message) => void;
    onRecall: (msg: Message) => void;
}

export function MessageList({
    messages,
    currentUserId,
    messagesEndRef,
    onEdit,
    onDelete,
    onRecall,
}: MessageListProps) {
    return (
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
                {messages.map(msg => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender_id === currentUserId}
                        currentUserId={currentUserId}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRecall={onRecall}
                    />
                ))}
                <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
            </div>
        </ScrollArea>
    );
}
