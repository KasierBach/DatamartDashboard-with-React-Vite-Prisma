import { Pencil, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttachmentButton } from './AttachmentButton';
import { MentionInput } from './MentionInput';
import { EmojiPicker } from './EmojiPicker';
import { ReplyPreview } from './ReplyPreview';
import { VoiceRecorder } from './VoiceRecorder';
import type { Message, User } from '../types';

interface ChatInputProps {
    value: string;
    editingMessage: Message | null;
    replyingMessage?: Message | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
    onSend: () => void;
    onVoiceSend?: (voiceUrl: string, duration: number) => void;
    onCancelEdit: () => void;
    onCancelReply?: () => void;
    onFocus?: () => void;
    attachment: File | null;
    onFileSelect: (file: File) => void;
    onRemoveAttachment: () => void;
    onEmojiSelect: (emoji: string) => void;
    isSending?: boolean;
    conversationUsers?: User[];
}

export function ChatInput({
    value,
    editingMessage,
    replyingMessage,
    inputRef,
    onChange,
    onSend,
    onVoiceSend,
    onCancelEdit,
    onCancelReply,
    onFocus,
    attachment,
    onFileSelect,
    onRemoveAttachment,
    onEmojiSelect,
    isSending,
    conversationUsers = [],
}: ChatInputProps) {
    return (
        <div className="p-4 border-t">
            {editingMessage && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg border-l-4 border-primary">
                    <Pencil className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary font-medium flex-1">
                        Đang chỉnh sửa tin nhắn
                    </span>
                    <button
                        onClick={onCancelEdit}
                        className="p-1 hover:bg-background rounded transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {replyingMessage && (
                <ReplyPreview
                    message={replyingMessage}
                    onCancel={onCancelReply}
                    className="mb-2"
                />
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
                className="flex items-end gap-2"
            >
                <div className="flex items-center gap-1 mb-1">
                    <EmojiPicker onSelect={onEmojiSelect} disabled={!!editingMessage} />
                    <AttachmentButton onFileSelect={onFileSelect} disabled={!!editingMessage} />
                    {!editingMessage && onVoiceSend && (
                        <VoiceRecorder
                            onRecordComplete={onVoiceSend}
                            onCancel={() => { }}
                            disabled={!!attachment || !!value.trim()}
                        />
                    )}
                </div>

                <MentionInput
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    value={value}
                    onValueChange={onChange}
                    onFocus={onFocus}
                    placeholder={attachment ? "Thêm chú thích..." : "Nhập tin nhắn..."}
                    className="flex-1"
                    disabled={isSending}
                    users={conversationUsers}
                />

                <Button
                    type="submit"
                    size="icon"
                    className="mb-1"
                    disabled={(!!(!value.trim() && !attachment)) || isSending}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
