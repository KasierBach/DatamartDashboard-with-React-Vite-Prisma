import { ArrowLeft, Info, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './UserAvatar';
import type { Conversation } from '../types';

interface ChatHeaderProps {
    conversation: Conversation;
    currentUserId: number | null;
    isUserOnline: (userId: number) => boolean;
    onBackClick: () => void;
    onInfoClick?: () => void;
    onSearchClick?: () => void;
}

export function ChatHeader({
    conversation,
    currentUserId,
    isUserOnline,
    onBackClick,
    onInfoClick,
    onSearchClick
}: ChatHeaderProps) {
    const isGroup = conversation.type === 'group';
    const otherUser = isGroup ? undefined : conversation.users?.find(u => u.id !== currentUserId);
    const displayUser = isGroup ? { id: 0, username: 'group', name: conversation.name, role: 'group' } : otherUser;

    const isOnline = !isGroup && otherUser ? isUserOnline(otherUser.id) : false;
    const subtitle = isGroup
        ? `${conversation.members?.length || conversation.users?.length || 0} thành viên`
        : (isOnline ? 'Đang hoạt động' : 'Ngoại tuyến');

    return (
        <div className="p-4 border-b flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    onClick={onBackClick}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <UserAvatar user={displayUser as any} size="sm" isOnline={isOnline} />

                <div>
                    <p className="font-medium">{isGroup ? conversation.name : otherUser?.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onSearchClick} title="Tìm kiếm tin nhắn">
                    <Search className="h-5 w-5 text-muted-foreground" />
                </Button>

                {isGroup && (
                    <Button variant="ghost" size="icon" onClick={onInfoClick} title="Thông tin nhóm">
                        <Info className="h-5 w-5 text-muted-foreground" />
                    </Button>
                )}
            </div>
        </div>
    );
}
