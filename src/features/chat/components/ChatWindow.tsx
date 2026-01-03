import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { Conversation, Message } from '../types';

interface ChatWindowProps {
    conversation: Conversation | null;
    messages: Message[];
    currentUserId: number | null;
    newMessage: string;
    editingMessage: Message | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    isMobileListView: boolean;
    isUserOnline: (userId: number) => boolean;
    onBackClick: () => void;
    onTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSend: () => void;
    onCancelEdit: () => void;
    onEditMessage: (msg: Message) => void;
    onDeleteMessage: (msg: Message) => void;
    onRecallMessage: (msg: Message) => void;
    attachment: File | null;
    onFileSelect: (file: File) => void;
    onRemoveAttachment: () => void;
    onFocus?: () => void;
    onInfoClick?: () => void;
}

export function ChatWindow({
    conversation,
    messages,
    currentUserId,
    newMessage,
    editingMessage,
    inputRef,
    messagesEndRef,
    isMobileListView,
    isUserOnline,
    onBackClick,
    onTyping,
    onSend,
    onCancelEdit,
    onEditMessage,
    onDeleteMessage,
    onRecallMessage,
    attachment,
    onFileSelect,
    onRemoveAttachment,
    onFocus,
    onInfoClick,
}: ChatWindowProps) {
    if (!conversation) {
        return (
            <div className={cn(
                'flex-1 flex flex-col',
                isMobileListView && 'hidden md:flex'
            )}>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Chọn một cuộc trò chuyện</p>
                        <p className="text-sm">hoặc bắt đầu cuộc trò chuyện mới</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex-1 flex flex-col',
                isMobileListView && 'hidden md:flex'
            )}
            onClick={onFocus}
        >
            <ChatHeader
                conversation={conversation}
                currentUserId={currentUserId}
                isUserOnline={isUserOnline}
                onBackClick={onBackClick}
                onInfoClick={onInfoClick}
            />

            <MessageList
                messages={messages}
                isGroup={conversation.type === 'group'}
                currentUserId={currentUserId}
                messagesEndRef={messagesEndRef}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onRecall={onRecallMessage}
            />

            <ChatInput
                value={newMessage}
                editingMessage={editingMessage}
                inputRef={inputRef}
                onChange={onTyping}
                onSend={onSend}
                onCancelEdit={onCancelEdit}
                onFocus={onFocus}
                attachment={attachment}
                onFileSelect={onFileSelect}
                onRemoveAttachment={onRemoveAttachment}
            />
        </div>
    );
}
