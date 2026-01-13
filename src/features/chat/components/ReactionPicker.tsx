import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    className?: string;
}

export function ReactionPicker({ onSelect, className }: ReactionPickerProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        'p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100',
                        className
                    )}
                    title="Thêm biểu cảm"
                >
                    <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="top"
                align="center"
                className="flex items-center gap-0.5 p-1 min-w-0 shadow-lg border-muted mb-1"
            >
                {QUICK_REACTIONS.map((emoji) => (
                    <DropdownMenuItem
                        key={emoji}
                        onSelect={() => onSelect(emoji)}
                        className="p-1.5 hover:bg-muted rounded transition-colors text-lg flex items-center justify-center cursor-pointer focus:bg-muted"
                    >
                        {emoji}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
