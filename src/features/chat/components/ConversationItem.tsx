import { cn } from '@/lib/utils';
import { Check, Trash2, User, MessageCircle } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { UserAvatar } from './UserAvatar';
import type { Conversation } from '../types';

interface ConversationItemProps {
    conversation: Conversation;
    isSelected: boolean;
    currentUserId: number | null;
    isOnline: boolean;
    onClick: () => void;
    onMarkAsRead?: (conversationId: number) => void;
    onMarkAsUnread?: (conversationId: number) => void;
    onDelete?: (conversationId: number) => void;
    onViewProfile?: (userId: number) => void;
}

export function ConversationItem({
    conversation,
    isSelected,
    currentUserId,
    isOnline,
    onClick,

    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
    onViewProfile,
}: ConversationItemProps) {
    const otherUser = conversation.users?.find(u => u.id !== currentUserId);
    const lastMessage = conversation.messages?.[0];
    const hasUnread = conversation.unreadCount > 0;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <button
                    onClick={onClick}
                    className={cn(
                        'w-full p-3 flex items-center gap-3 rounded-lg transition-colors text-left',
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                >
                    <UserAvatar user={otherUser} isOnline={isOnline} />

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                            <p className="font-medium truncate">
                                {otherUser?.name || 'Người dùng'}
                            </p>
                            {lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                    {new Date(lastMessage.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                        {lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                                {lastMessage.sender_id === currentUserId ? 'Bạn: ' : ''}
                                {lastMessage.content}
                            </p>
                        )}
                    </div>

                    {hasUnread && (
                        <div className="h-5 min-w-[20px] px-1.5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-foreground">
                                {conversation.unreadCount}
                            </span>
                        </div>
                    )}
                </button>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-56">
                {hasUnread ? (
                    onMarkAsRead && (
                        <ContextMenuItem onClick={() => onMarkAsRead(conversation.id)}>
                            <Check className="h-4 w-4" />
                            Đánh dấu đã đọc
                        </ContextMenuItem>
                    )
                ) : (
                    onMarkAsUnread && (
                        <ContextMenuItem onClick={() => onMarkAsUnread(conversation.id)}>
                            <MessageCircle className="h-4 w-4" />
                            Đánh dấu chưa đọc
                        </ContextMenuItem>
                    )
                )}

                {otherUser && onViewProfile && (
                    <ContextMenuItem onClick={() => onViewProfile(otherUser.id)}>
                        <User className="h-4 w-4" />
                        Xem thông tin
                    </ContextMenuItem>
                )}

                {onDelete && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            variant="destructive"
                            onClick={() => onDelete(conversation.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa đoạn chat
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}
