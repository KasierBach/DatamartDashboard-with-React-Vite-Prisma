import { Check, CheckCheck, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import API_BASE_URL from '@/config/api';
import type { Message } from '../types';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    isGroup: boolean;
    isSameSenderAsPrev: boolean;
    currentUserId: number | null;
    onEdit: (msg: Message) => void;
    onDelete: (msg: Message) => void;
    onRecall: (msg: Message) => void;
}

export function MessageBubble({
    message,
    isOwn,
    isGroup,
    isSameSenderAsPrev,
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

    const showSenderInfo = !isOwn && isGroup && !isSameSenderAsPrev;

    return (
        <div className={cn('flex group gap-2', isOwn ? 'justify-end' : 'justify-start')}>
            {/* Avatar for others in group */}
            {!isOwn && isGroup && (
                <div className="flex-shrink-0 mt-auto mb-1 w-8">
                    {showSenderInfo && (
                        <div className="h-8 w-8 rounded-full bg-muted overflow-hidden border shadow-sm">
                            {message.sender?.avatar ? (
                                <img
                                    src={message.sender.avatar.startsWith('http') ? message.sender.avatar : `${API_BASE_URL}${message.sender.avatar}`}
                                    alt={message.sender.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold uppercase">
                                    {message.sender?.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className={cn('flex flex-col max-w-[70%] relative', isOwn ? 'items-end' : 'items-start')}>
                {/* Sender Name for others in group */}
                {showSenderInfo && message.sender && (
                    <span className="text-[10px] text-muted-foreground ml-1 mb-0.5 font-medium">
                        {message.sender.name}
                    </span>
                )}

                {/* Message bubble */}
                <div className={cn(
                    'rounded-2xl px-4 py-2 w-full',
                    message.is_recalled
                        ? 'bg-muted/50 border border-dashed text-muted-foreground italic text-sm'
                        : isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md font-medium shadow-sm'
                            : 'bg-muted rounded-bl-md font-medium shadow-sm'
                )}>
                    {message.is_recalled ? (
                        <p>Tin nhắn đã thu hồi</p>
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
                                'flex items-center gap-1 mt-1 font-normal opacity-80',
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

                {/* Action buttons (Absolute positioned for small offset) */}
                {!message.is_recalled && (
                    <div className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-2",
                        isOwn ? "right-full mr-2" : "left-full ml-2"
                    )}>
                        {isOwn && (
                            <>
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
                            </>
                        )}
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
        </div>
    );
}
