import { useState } from 'react';
import { MessageCircle, Search, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ConversationItem } from './ConversationItem';
import { UserAvatar } from './UserAvatar';
import { CreateGroupDialog } from './CreateGroupDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Conversation, User } from '../types';

interface ConversationSidebarProps {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    currentUserId: number | null;
    availableUsers: User[];
    showNewChat: boolean;
    searchQuery: string;
    filteredUsers: User[];
    isMobileListView: boolean;
    isUserOnline: (userId: number) => boolean;
    onSelectConversation: (conv: Conversation) => void;
    onToggleNewChat: () => void;
    onSearchChange: (query: string) => void;
    onStartNewConversation: (user: User) => void;
    onDeleteConversation: (conversationId: number) => void;
    onMarkAsRead: (conversationId: number) => void;
    onMarkAsUnread: (conversationId: number) => void;
    onViewProfile: (userId: number) => void;
    onCreateGroup: (name: string, memberIds: number[]) => Promise<void>;
    onHideConversation: (conversationId: number) => Promise<void>;
}

export function ConversationSidebar({
    conversations,
    selectedConversation,
    currentUserId,
    availableUsers,
    showNewChat,
    searchQuery,
    filteredUsers,
    isMobileListView,
    isUserOnline,
    onSelectConversation,
    onToggleNewChat,
    onSearchChange,
    onStartNewConversation,
    onDeleteConversation,
    onMarkAsRead,
    onMarkAsUnread,
    onViewProfile,
    onCreateGroup,
    onHideConversation,
}: ConversationSidebarProps) {
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);

    const handleConfirmDelete = () => {
        const id = deletingConversationId;
        // Close dialog first
        setDeletingConversationId(null);

        if (id) {
            // Defer deletion to allow dialog to close cleanly
            setTimeout(() => {
                onDeleteConversation(id);

                // Safety cleanup in case Radix gets stuck
                setTimeout(() => {
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                }, 100);
            }, 300);
        }
    };

    return (
        <div className={cn(
            'w-full md:w-80 border-r flex flex-col',
            !isMobileListView && 'hidden md:flex'
        )}>
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Tin nhắn
                    </h2>
                    <Button
                        size="sm"
                        onClick={onToggleNewChat}
                        variant={showNewChat ? 'secondary' : 'default'}
                    >
                        {showNewChat ? 'Hủy' : 'Mới'}
                    </Button>
                </div>

                {showNewChat && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm người để nhắn tin..."
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                )}
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                {showNewChat ? (
                    <div className="p-2 space-y-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                            onClick={() => setIsCreateGroupOpen(true)}
                        >
                            <div className="bg-primary/10 p-1 rounded-full">
                                <Plus className="h-4 w-4 text-primary" />
                            </div>
                            Tạo nhóm chat mới
                        </Button>

                        <div className="border-t pt-2 mt-2">
                            <p className="text-xs text-muted-foreground px-2 mb-2">Gợi ý</p>
                            {filteredUsers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    Không tìm thấy người dùng
                                </p>
                            ) : (
                                filteredUsers.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => onStartNewConversation(u)}
                                        className="w-full p-2 flex items-center gap-3 rounded-lg hover:bg-muted transition-colors text-left"
                                    >
                                        <UserAvatar user={u} size="sm" isOnline={isUserOnline(u.id)} />
                                        <div>
                                            <p className="font-medium text-sm">{u.name || u.username}</p>
                                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-2">
                        {conversations.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Chưa có cuộc trò chuyện nào</p>
                                <p className="text-sm">Bấm "Mới" để bắt đầu</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const otherUser = conv.users?.find(u => u.id !== currentUserId);
                                return (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        isSelected={selectedConversation?.id === conv.id}
                                        currentUserId={currentUserId}
                                        isOnline={otherUser ? isUserOnline(otherUser.id) : false}
                                        onClick={() => onSelectConversation(conv)}
                                        onDelete={(id) => setDeletingConversationId(id)}
                                        onHide={onHideConversation}
                                        onMarkAsRead={onMarkAsRead}
                                        onMarkAsUnread={onMarkAsUnread}
                                        onViewProfile={onViewProfile}
                                    />
                                );
                            })
                        )}
                    </div>
                )}
            </ScrollArea>

            <CreateGroupDialog
                open={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                currentUserId={currentUserId}
                availableUsers={availableUsers}
                onCreateGroup={onCreateGroup}
            />

            <AlertDialog open={!!deletingConversationId} onOpenChange={(open) => !open && setDeletingConversationId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ xóa vĩnh viễn cuộc trò chuyện này khỏi danh sách của bạn.
                            Bạn sẽ không thể khôi phục lại lịch sử tin nhắn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xóa vĩnh viễn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
