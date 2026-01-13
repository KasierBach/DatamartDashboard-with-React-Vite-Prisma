import { useState, useRef, useEffect, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { User } from '../types';

interface MentionInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
    users: User[];
    onValueChange: (value: string) => void;
    onMention?: (user: User) => void;
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(
    ({ users, onValueChange, onMention, className, ...props }, ref) => {
        const [showSuggestions, setShowSuggestions] = useState(false);
        const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
        const [mentionQuery, setMentionQuery] = useState('');
        const [mentionStartPos, setMentionStartPos] = useState(-1);
        const [selectedIndex, setSelectedIndex] = useState(0);
        const inputRef = useRef<HTMLInputElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        // Merge refs
        useEffect(() => {
            if (ref && typeof ref === 'function') {
                ref(inputRef.current);
            } else if (ref) {
                ref.current = inputRef.current;
            }
        }, [ref]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const cursorPos = e.target.selectionStart || 0;

            onValueChange(value);

            // Check for @ mention
            const textBeforeCursor = value.slice(0, cursorPos);
            const lastAtIndex = textBeforeCursor.lastIndexOf('@');

            if (lastAtIndex !== -1) {
                const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
                // Check if there's no space after @
                if (!textAfterAt.includes(' ')) {
                    setMentionQuery(textAfterAt.toLowerCase());
                    setMentionStartPos(lastAtIndex);
                    const filtered = users.filter(u =>
                        u.name?.toLowerCase().includes(textAfterAt.toLowerCase()) ||
                        u.username.toLowerCase().includes(textAfterAt.toLowerCase())
                    );
                    setFilteredUsers(filtered.slice(0, 5));
                    setShowSuggestions(filtered.length > 0);
                    setSelectedIndex(0);
                    return;
                }
            }

            setShowSuggestions(false);
            setMentionStartPos(-1);
        };

        const insertMention = (user: User) => {
            const input = inputRef.current;
            if (!input || mentionStartPos === -1) return;

            const currentValue = input.value;
            const beforeMention = currentValue.slice(0, mentionStartPos);
            const afterCursor = currentValue.slice(input.selectionStart || 0);

            const newValue = `${beforeMention}@${user.username} ${afterCursor}`;
            onValueChange(newValue);

            if (onMention) {
                onMention(user);
            }

            setShowSuggestions(false);
            setMentionStartPos(-1);

            // Focus back and set cursor
            setTimeout(() => {
                if (input) {
                    input.focus();
                    const newPos = beforeMention.length + user.username.length + 2;
                    input.setSelectionRange(newPos, newPos);
                }
            }, 0);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!showSuggestions) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && filteredUsers[selectedIndex]) {
                e.preventDefault();
                insertMention(filteredUsers[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        };

        return (
            <div ref={containerRef} className="relative flex-1">
                <Input
                    ref={inputRef}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={cn('flex-1', className)}
                    {...props}
                />

                {/* Mention Suggestions */}
                {showSuggestions && (
                    <div className="absolute bottom-full left-0 mb-1 w-full max-w-[250px] bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
                        {filteredUsers.map((user, index) => (
                            <div
                                key={user.id}
                                onClick={() => insertMention(user)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                                    index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                                )}
                            >
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                                    {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);

MentionInput.displayName = 'MentionInput';
