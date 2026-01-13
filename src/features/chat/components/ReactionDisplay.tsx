import { cn } from '@/lib/utils';
import type { MessageReaction } from '../types';

interface ReactionDisplayProps {
    reactions: MessageReaction[];
    currentUserId: number | null;
    onReactionClick: (emoji: string, hasUserReacted: boolean) => void;
    isOwn?: boolean;
    className?: string;
}

export function ReactionDisplay({
    reactions,
    currentUserId,
    onReactionClick,
    isOwn,
    className
}: ReactionDisplayProps) {
    if (!reactions || reactions.length === 0) return null;

    // Group reactions by emoji
    const grouped = reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) {
            acc[r.emoji] = { count: 0, userIds: [] };
        }
        acc[r.emoji].count++;
        acc[r.emoji].userIds.push(r.user_id);
        return acc;
    }, {} as Record<string, { count: number; userIds: number[] }>);

    return (
        <div className={cn(
            'flex flex-wrap gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start',
            className
        )}>
            {Object.entries(grouped).map(([emoji, data]) => {
                const hasUserReacted = currentUserId ? data.userIds.includes(currentUserId) : false;
                return (
                    <button
                        key={emoji}
                        onClick={() => onReactionClick(emoji, hasUserReacted)}
                        className={cn(
                            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors',
                            hasUserReacted
                                ? 'bg-primary/20 border border-primary/40'
                                : 'bg-muted hover:bg-muted/80 border border-transparent'
                        )}
                    >
                        <span>{emoji}</span>
                        <span className="text-[10px] text-muted-foreground">{data.count}</span>
                    </button>
                );
            })}
        </div>
    );
}
