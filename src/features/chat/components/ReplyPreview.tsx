import { X, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '../types';

interface ReplyPreviewProps {
    message: Message;
    onCancel?: () => void;
    isInBubble?: boolean;
    className?: string;
}

export function ReplyPreview({ message, onCancel, isInBubble, className }: ReplyPreviewProps) {
    const senderName = message.sender?.name || 'Ai đó';
    const previewContent = message.content.length > 50
        ? message.content.substring(0, 50) + '...'
        : message.content;

    if (isInBubble) {
        // Compact version shown inside a message bubble
        return (
            <div className={cn(
                'flex items-start gap-2 px-2 py-1.5 bg-black/5 dark:bg-white/5 rounded border-l-2 border-primary/50 mb-1',
                className
            )}>
                <Reply className="h-3 w-3 mt-0.5 text-muted-foreground rotate-180" />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground">{senderName}</p>
                    <p className="text-xs truncate opacity-80">{previewContent || '📎 Tệp đính kèm'}</p>
                </div>
            </div>
        );
    }

    // Full version shown in chat input area
    return (
        <div className={cn(
            'flex items-center gap-2 p-2 bg-muted rounded-lg mb-2',
            className
        )}>
            <div className="h-8 w-1 bg-primary rounded-full" />
            <Reply className="h-4 w-4 text-primary rotate-180" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">Đang trả lời {senderName}</p>
                <p className="text-sm text-muted-foreground truncate">{previewContent || '📎 Tệp đính kèm'}</p>
            </div>
            {onCancel && (
                <button
                    onClick={onCancel}
                    className="p-1 hover:bg-background rounded transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
