import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { PinnedMessages } from './PinnedMessages';
import { SearchMessages } from './SearchMessages';
import { TypingIndicator } from './TypingIndicator';
import type { Conversation, Message, User } from '../types';

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
    typingUsers?: User[];
    onBackClick: () => void;
    onTyping: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
    onSend: () => void;
    onCancelEdit: () => void;
    onEditMessage: (msg: Message) => void;
    onDeleteMessage: (msg: Message) => void;
    onRecallMessage: (msg: Message) => void;
    onReplyMessage?: (msg: Message) => void;
    onCancelReply?: () => void;
    replyingMessage?: Message | null;
    onForwardMessage?: (msg: Message) => void;
    onPinMessage?: (msg: Message) => void;
    onUnpinMessage?: (messageId: number) => void;
    onReaction?: (messageId: number, emoji: string, hasUserReacted: boolean) => void;
    onJumpToMessage?: (messageId: number) => void;
    onVoiceSend?: (voiceUrl: string, duration: number) => void;
    attachment: File | null;
    onFileSelect: (file: File) => void;
    onRemoveAttachment: () => void;
    onEmojiSelect: (emoji: string) => void;
    onFocus?: () => void;
    onInfoClick?: () => void;
    isSending?: boolean;
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
    typingUsers = [],
    onBackClick,
    onTyping,
    onSend,
    onCancelEdit,
    onEditMessage,
    onDeleteMessage,
    onRecallMessage,
    onReplyMessage,
    onCancelReply,
    replyingMessage,
    onForwardMessage,
    onPinMessage,
    onUnpinMessage,
    onReaction,
    onJumpToMessage,
    onVoiceSend,
    attachment,
    onFileSelect,
    onRemoveAttachment,
    onEmojiSelect,
    onFocus,
    onInfoClick,
    isSending,
}: ChatWindowProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

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
                'flex-1 flex flex-col relative',
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
                onSearchClick={() => setIsSearchOpen(true)}
            />

            <PinnedMessages
                conversationId={conversation.id}
                onMessageClick={(id) => onJumpToMessage?.(id)}
                onUnpin={onUnpinMessage}
            />

            {isSearchOpen && (
                <SearchMessages
                    conversationId={conversation.id}
                    userId={currentUserId}
                    onResultClick={(id) => {
                        onJumpToMessage?.(id);
                        setIsSearchOpen(false);
                    }}
                    onClose={() => setIsSearchOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <MessageList
                    messages={messages}
                    isGroup={conversation.type === 'group'}
                    currentUserId={currentUserId}
                    messagesEndRef={messagesEndRef}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    onRecall={onRecallMessage}
                    onReply={onReplyMessage}
                    onForward={onForwardMessage}
                    onPin={onPinMessage}
                    onReaction={onReaction}
                />

                {typingUsers.length > 0 && (
                    <div className="absolute bottom-2 left-0 right-0 z-10">
                        <TypingIndicator
                            userName={typingUsers.length === 1 ? typingUsers[0].name : undefined}
                        />
                    </div>
                )}
            </div>

            <ChatInput
                value={newMessage}
                editingMessage={editingMessage}
                replyingMessage={replyingMessage}
                inputRef={inputRef}
                onChange={onTyping}
                onSend={onSend}
                onVoiceSend={onVoiceSend}
                onCancelEdit={onCancelEdit}
                onCancelReply={onCancelReply}
                onFocus={onFocus}
                attachment={attachment}
                onFileSelect={onFileSelect}
                onRemoveAttachment={onRemoveAttachment}
                onEmojiSelect={onEmojiSelect}
                isSending={isSending}
                conversationUsers={conversation.users}
            />
        </div>
    );
}
