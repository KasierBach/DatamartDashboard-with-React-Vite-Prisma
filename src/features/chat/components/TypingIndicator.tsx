import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
    userName?: string;
    className?: string;
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
    return (
        <div className={cn('flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground', className)}>
            <div className="flex items-center gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
            </div>
            <span className="italic">
                {userName ? `${userName} đang nhập...` : 'Đang nhập...'}
            </span>
        </div>
    );
}
