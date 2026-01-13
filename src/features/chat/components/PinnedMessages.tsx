import { useState, useEffect } from 'react';
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { API_ENDPOINTS } from '@/config/api';
import type { PinnedMessage } from '../types';

interface PinnedMessagesProps {
    conversationId: number;
    onMessageClick: (messageId: number) => void;
    onUnpin?: (messageId: number) => void;
    className?: string;
}

export function PinnedMessages({
    conversationId,
    onMessageClick,
    onUnpin,
    className
}: PinnedMessagesProps) {
    const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchPinned = async () => {
            if (!conversationId) return;

            try {
                const response = await fetch(
                    `${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/pinned`
                );
                const data = await response.json();
                setPinnedMessages(data);
            } catch (error) {
                console.error('Failed to fetch pinned messages:', error);
            }
        };

        fetchPinned();
    }, [conversationId]);

    if (pinnedMessages.length === 0) return null;

    const firstPinned = pinnedMessages[0];
    const hasMore = pinnedMessages.length > 1;

    return (
        <div className={cn('border-b bg-muted/30', className)}>
            {/* Collapsed view - show first pinned */}
            <div
                className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => hasMore && setIsExpanded(!isExpanded)}
            >
                <Pin className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Tin nhắn đã ghim</p>
                    <p className="text-sm truncate">{firstPinned.message.content || '📎 Tệp đính kèm'}</p>
                </div>
                {hasMore && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>+{pinnedMessages.length - 1}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                )}
            </div>

            {/* Expanded view */}
            {isExpanded && (
                <ScrollArea className="max-h-[150px]">
                    <div className="px-4 pb-2 space-y-1">
                        {pinnedMessages.map((pm) => (
                            <div
                                key={pm.id}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted group cursor-pointer"
                                onClick={() => onMessageClick(pm.message_id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        {pm.message.sender?.name}
                                    </p>
                                    <p className="text-sm truncate">{pm.message.content}</p>
                                </div>
                                {onUnpin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUnpin(pm.message_id);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
