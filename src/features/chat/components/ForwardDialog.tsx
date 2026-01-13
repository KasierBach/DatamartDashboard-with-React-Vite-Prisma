import { useState } from 'react';
import { Search, Forward, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from './UserAvatar';
import type { Conversation, Message } from '../types';

interface ForwardDialogProps {
    open: boolean;
    onClose: () => void;
    message: Message | null;
    conversations: Conversation[];
    currentUserId: number | null;
    onForward: (messageId: number, targetConversationIds: number[]) => Promise<void>;
}

export function ForwardDialog({
    open,
    onClose,
    message,
    conversations,
    currentUserId,
    onForward
}: ForwardDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isForwarding, setIsForwarding] = useState(false);

    const filteredConversations = conversations.filter(conv => {
        if (conv.id === message?.conversation_id) return false; // Exclude current conversation
        const otherUser = conv.users?.find(u => u.id !== currentUserId);
        const name = conv.type === 'group'
            ? conv.name
            : otherUser?.name || otherUser?.username;

        if (!name && conv.type !== 'group') return false; // Hide direct chats with no other user info

        return (name || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleForward = async () => {
        if (!message || selectedIds.length === 0) return;
        setIsForwarding(true);
        try {
            await onForward(message.id, selectedIds);
            setSelectedIds([]);
            onClose();
        } catch (error) {
            console.error('Forward failed:', error);
        } finally {
            setIsForwarding(false);
        }
    };

    const handleClose = () => {
        setSelectedIds([]);
        setSearchQuery('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Forward className="h-5 w-5" />
                        Chuyển tiếp tin nhắn
                    </DialogTitle>
                </DialogHeader>

                {message && (
                    <div className="p-2 bg-muted rounded-lg text-sm mb-2">
                        <p className="truncate">{message.content || '📎 Tệp đính kèm'}</p>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm cuộc trò chuyện..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <ScrollArea className="h-[250px] pr-2">
                    <div className="space-y-1">
                        {filteredConversations.map(conv => {
                            const isGroup = conv.type === 'group';
                            const otherUser = conv.users.find(u => u.id !== currentUserId);
                            const name = isGroup ? conv.name : otherUser?.name;
                            const isSelected = selectedIds.includes(conv.id);

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => toggleSelect(conv.id)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                                >
                                    <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                    {isGroup ? (
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                            {conv.name?.charAt(0).toUpperCase()}
                                        </div>
                                    ) : (
                                        <UserAvatar user={otherUser!} size="sm" />
                                    )}
                                    <span className="flex-1 font-medium text-sm truncate">{name}</span>
                                </div>
                            );
                        })}
                        {filteredConversations.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">
                                Không tìm thấy cuộc trò chuyện nào
                            </p>
                        )}
                    </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={handleClose}>Hủy</Button>
                    <Button
                        onClick={handleForward}
                        disabled={selectedIds.length === 0 || isForwarding}
                    >
                        {isForwarding ? 'Đang gửi...' : `Gửi (${selectedIds.length})`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
