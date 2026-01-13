import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    className?: string;
}

export function ReactionPicker({ onSelect, className }: ReactionPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100',
                    className
                )}
                title="Thêm biểu cảm"
            >
                <Smile className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-popover border rounded-lg shadow-lg p-1 flex items-center gap-0.5 z-50">
                    {QUICK_REACTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSelect(emoji)}
                            className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
