import { Pencil, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttachmentButton } from './AttachmentButton';
import { Input } from '@/components/ui/input';
import type { Message } from '../types';

interface ChatInputProps {
    value: string;
    editingMessage: Message | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSend: () => void;
    onCancelEdit: () => void;
    attachment: File | null;
    onFileSelect: (file: File) => void;
    onRemoveAttachment: () => void;
}

export function ChatInput({
    value,
    editingMessage,
    inputRef,
    onChange,
    onSend,
    onCancelEdit,
    attachment,
    onFileSelect,
    onRemoveAttachment,
}: ChatInputProps) {
    return (
        <div className="p-4 border-t">
            {editingMessage && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
                    <Pencil className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground flex-1">
                        Đang chỉnh sửa tin nhắn
                    </span>
                    <button
                        onClick={onCancelEdit}
                        className="p-1 hover:bg-background rounded"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {attachment && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg w-fit relative group">
                    {attachment.type.startsWith('image/') ? (
                        <img
                            src={URL.createObjectURL(attachment)}
                            alt="Preview"
                            className="h-16 w-16 object-cover rounded"
                        />
                    ) : (
                        <div className="h-16 w-16 bg-black flex items-center justify-center rounded text-white text-xs">
                            Video
                        </div>
                    )}
                    <button
                        onClick={onRemoveAttachment}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </button>
                    <span className="text-xs max-w-[150px] truncate">{attachment.name}</span>
                </div>
            )}

            <form
                onSubmit={e => { e.preventDefault(); onSend(); }}
                className="flex gap-2"
            >
                <AttachmentButton onFileSelect={onFileSelect} disabled={!!editingMessage} />
                <Input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    placeholder={editingMessage ? 'Chỉnh sửa tin nhắn...' : 'Nhập tin nhắn...'}
                    value={value}
                    onChange={onChange}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!value.trim() && !attachment}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
