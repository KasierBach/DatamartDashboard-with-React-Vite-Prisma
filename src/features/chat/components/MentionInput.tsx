import { useState, useRef, useEffect, forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { User } from '../types';

interface MentionInputProps extends Omit<React.ComponentProps<typeof Textarea>, 'onChange'> {
    users: User[];
    onValueChange: (value: string) => void;
    onMention?: (user: User) => void;
    onPasteFile?: (file: File) => void;
    onKeyDownCustom?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
    ({ users, onValueChange, onMention, onPasteFile, onKeyDownCustom, className, ...props }, ref) => {
        const [showSuggestions, setShowSuggestions] = useState(false);
        const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
        const [mentionStartPos, setMentionStartPos] = useState(-1);
        const [selectedIndex, setSelectedIndex] = useState(0);
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        // Merge refs
        useEffect(() => {
            if (ref && typeof ref === 'function') {
                ref(textareaRef.current);
            } else if (ref && 'current' in ref) {
                (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textareaRef.current;
            }
        }, [ref]);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const value = e.target.value;
            const cursorPos = e.target.selectionStart || 0;

            onValueChange(value);

            // Check for @ mention
            const textBeforeCursor = value.slice(0, cursorPos);
            const lastAtIndex = textBeforeCursor.lastIndexOf('@');

            // Ensure @ is preceded by start of string or whitespace
            if (lastAtIndex !== -1 && (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))) {
                const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
                // Check if there's no space after @
                if (!textAfterAt.includes(' ')) {
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
            const input = textareaRef.current;
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

        const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (showSuggestions) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
                    return;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    return;
                } else if (e.key === 'Enter' && filteredUsers[selectedIndex]) {
                    e.preventDefault();
                    insertMention(filteredUsers[selectedIndex]);
                    return;
                } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    return;
                }
            }

            // Normal key handling passed from parent (e.g., Send on Enter)
            if (onKeyDownCustom) {
                onKeyDownCustom(e);
            }
        };

        const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1 || items[i].type.indexOf('application') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob && onPasteFile) {
                        e.preventDefault();
                        onPasteFile(blob);
                    }
                }
            }
        };

        return (
            <div ref={containerRef} className="relative flex-1">
                <Textarea
                    ref={textareaRef}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className={cn('flex-1 py-2 h-auto max-h-32', className)}
                    rows={1}
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
