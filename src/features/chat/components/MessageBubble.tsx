import { Check, CheckCheck, Pencil, RotateCcw, Trash2, FileText, Download, Reply, Forward, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import API_BASE_URL from '@/config/api';
import type { Message } from '../types';
import { useState } from 'react';
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { ReplyPreview } from './ReplyPreview';
import { ReactionDisplay } from './ReactionDisplay';
import { ReactionPicker } from './ReactionPicker';
import { VoicePlayer } from './VoicePlayer';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    isGroup: boolean;
    isSameSenderAsPrev: boolean;
    currentUserId: number | null;
    onEdit: (msg: Message) => void;
    onDelete: (msg: Message) => void;
    onRecall: (msg: Message) => void;
    onReply?: (msg: Message) => void;
    onForward?: (msg: Message) => void;
    onPin?: (msg: Message) => void;
    onReaction?: (msgId: number, emoji: string, hasUserReacted: boolean) => void;
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
    onReply,
    onForward,
    onPin,
    onReaction,
}: MessageBubbleProps) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

    const attachmentUrl = message.attachment_url?.startsWith('http')
        ? message.attachment_url
        : `${API_BASE_URL}${message.attachment_url}`;

    return (
        <>
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
                                {/* Forwarded indicator */}
                                {message.forwarded_from && (
                                    <div className="flex items-center gap-1 text-[10px] opacity-60 mb-1">
                                        <Forward className="h-3 w-3" />
                                        <span>Tin nhắn được chuyển tiếp</span>
                                    </div>
                                )}

                                {/* Reply preview */}
                                {message.reply_to && (
                                    <ReplyPreview message={message.reply_to as any} isInBubble />
                                )}

                                {/* Voice message */}
                                {message.voice_url && (
                                    <VoicePlayer
                                        src={message.voice_url.startsWith('http') ? message.voice_url : `${API_BASE_URL}${message.voice_url}`}
                                        duration={message.voice_duration}
                                        className="mb-2"
                                    />
                                )}

                                {message.attachment_url && (
                                    <div className="mb-2 rounded-lg overflow-hidden max-w-sm">
                                        {message.attachment_type === 'image' ? (
                                            <div className="relative group/img cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
                                                <img
                                                    src={attachmentUrl}
                                                    alt="Attachment"
                                                    className="w-full h-auto object-cover max-h-80 hover:brightness-90 transition-all"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : message.attachment_type === 'video' ? (
                                            <video
                                                src={attachmentUrl}
                                                controls
                                                className="w-full h-auto max-h-80"
                                            />
                                        ) : (
                                            <div
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors w-full relative group/file",
                                                    isOwn ? "text-primary-foreground" : "text-foreground"
                                                )}
                                            >
                                                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                    <FileText className="h-6 w-6 text-primary" />
                                                </div>
                                                <a
                                                    href={attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 min-w-0"
                                                    download
                                                >
                                                    <p className="text-sm font-semibold truncate hover:underline" title={message.attachment_url.split('/').pop()}>
                                                        {message.attachment_url.split('/').pop()}
                                                    </p>
                                                    <p className="text-[10px] opacity-70">Tệp đính kèm</p>
                                                </a>
                                                <div className="flex items-center gap-1">
                                                    <a
                                                        href={attachmentUrl}
                                                        download
                                                        className={cn(
                                                            "p-1 rounded hover:bg-background/50 transition-colors",
                                                            "opacity-50 group-hover/file:opacity-100"
                                                        )}
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                    {isOwn && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRecall(message);
                                                            }}
                                                            className={cn(
                                                                "p-1 rounded hover:bg-background/50 transition-colors text-destructive-foreground",
                                                                "opacity-50 group-hover/file:opacity-100"
                                                            )}
                                                            title="Thu hồi"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
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

                    {/* Reactions display */}
                    {!message.is_recalled && message.reactions && message.reactions.length > 0 && (
                        <ReactionDisplay
                            reactions={message.reactions}
                            currentUserId={currentUserId}
                            isOwn={isOwn}
                            onReactionClick={(emoji, hasUserReacted) => {
                                onReaction?.(message.id, emoji, hasUserReacted);
                            }}
                        />
                    )}

                    {/* Action buttons (Absolute positioned for small offset) */}
                    {!message.is_recalled && (
                        <div className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-2",
                            isOwn ? "right-full mr-2" : "left-full ml-2"
                        )}>
                            {/* Reaction picker */}
                            <ReactionPicker
                                onSelect={(emoji) => onReaction?.(message.id, emoji, false)}
                            />

                            {/* Reply button */}
                            {onReply && (
                                <button
                                    onClick={() => onReply(message)}
                                    className="p-1 rounded hover:bg-muted"
                                    title="Trả lời"
                                >
                                    <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}

                            {/* Forward button */}
                            {onForward && (
                                <button
                                    onClick={() => onForward(message)}
                                    className="p-1 rounded hover:bg-muted"
                                    title="Chuyển tiếp"
                                >
                                    <Forward className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}

                            {/* Pin button */}
                            {onPin && (
                                <button
                                    onClick={() => onPin(message)}
                                    className="p-1 rounded hover:bg-muted"
                                    title="Ghim"
                                >
                                    <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            )}

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

            <ImagePreviewDialog
                src={attachmentUrl}
                open={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />
        </>
    );
}
