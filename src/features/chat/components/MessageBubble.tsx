import { Check, CheckCheck, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import API_BASE_URL from '@/config/api';
import type { Message } from '../types';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    currentUserId: number | null;
    onEdit: (msg: Message) => void;
    onDelete: (msg: Message) => void;
    onRecall: (msg: Message) => void;
}

export function MessageBubble({
    message,
    isOwn,
    currentUserId,
    onEdit,
    onDelete,
    onRecall,
}: MessageBubbleProps) {
    const getStatusIcon = () => {
        if (!isOwn) return null;

        const otherUserStatus = message.statuses.find(s => s.user_id !== currentUserId);

        if (otherUserStatus?.seen_at) {
            return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
        }
        if (otherUserStatus?.delivered_at) {
            return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
        }
        return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    };

    return (
        <div className={cn('flex group', isOwn ? 'justify-end' : 'justify-start')}>
            {/* Action buttons for own messages */}
            {isOwn && !message.is_recalled && (
                <div className="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(message)}
                        className="p-1 rounded hover:bg-muted"
                        title="Chỉnh sửa"
                    >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => onRecall(message)}
                        className="p-1 rounded hover:bg-muted"
                        title="Thu hồi"
                    >
                        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => onDelete(message)}
                        className="p-1 rounded hover:bg-muted"
                        title="Xóa cho mình"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                </div>
            )}

            {/* Message bubble */}
            <div className={cn(
                'max-w-[70%] rounded-2xl px-4 py-2',
                message.is_recalled
                    ? 'bg-muted/50 border border-dashed'
                    : isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
            )}>
                {message.is_recalled ? (
                    <p className="text-muted-foreground italic text-sm">
                        Tin nhắn đã thu hồi
                    </p>
                ) : (
                    <>
                        {message.attachment_url && (
                            <div className="mb-2 rounded-lg overflow-hidden max-w-sm">
                                {message.attachment_type === 'image' ? (
                                    <img
                                        src={message.attachment_url.startsWith('http') ? message.attachment_url : `${API_BASE_URL}${message.attachment_url}`}
                                        alt="Attachment"
                                        className="w-full h-auto object-cover max-h-80"
                                        loading="lazy"
                                    />
                                ) : (
                                    <video
                                        src={message.attachment_url.startsWith('http') ? message.attachment_url : `${API_BASE_URL}${message.attachment_url}`}
                                        controls
                                        className="w-full h-auto max-h-80"
                                    />
                                )}
                            </div>
                        )}
                        {message.content && <p className="break-words">{message.content}</p>}
                        <div className={cn(
                            'flex items-center gap-1 mt-1',
                            isOwn ? 'justify-end' : 'justify-start'
                        )}>
                            {message.is_edited && (
                                <span className={cn(
                                    'text-[10px] italic',
                                    isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                                )}>
                                    đã chỉnh sửa
                                </span>
                            )}
                            <span className={cn(
                                'text-[10px]',
                                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>
                                {new Date(message.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {getStatusIcon()}
                        </div>
                    </>
                )}
            </div>

            {/* Delete button for received messages */}
            {!isOwn && !message.is_recalled && (
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onDelete(message)}
                        className="p-1 rounded hover:bg-muted"
                        title="Xóa cho mình"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                </div>
            )}
        </div>
    );
}
