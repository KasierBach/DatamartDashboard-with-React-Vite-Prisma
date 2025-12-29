import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './UserAvatar';
import type { Conversation } from '../types';

interface ChatHeaderProps {
    conversation: Conversation;
    currentUserId: number | null;
    isUserOnline: (userId: number) => boolean;
    onBackClick: () => void;
}

export function ChatHeader({
    conversation,
    currentUserId,
    isUserOnline,
    onBackClick,
}: ChatHeaderProps) {
    const otherUser = conversation.users?.find(u => u.id !== currentUserId);
    const isOnline = otherUser ? isUserOnline(otherUser.id) : false;

    return (
        <div className="p-4 border-b flex items-center gap-3">
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onBackClick}
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>

            <UserAvatar user={otherUser} size="sm" isOnline={isOnline} />

            <div>
                <p className="font-medium">{otherUser?.name}</p>
                <p className="text-xs text-muted-foreground">
                    {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                </p>
            </div>
        </div>
    );
}
