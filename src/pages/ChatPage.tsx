import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';
import {
    useConversations,
    useMessages,
    useChatActions,
    ConversationSidebar,
    ChatWindow,
    UserProfileSidebar,
    GroupSettingsDialog,
    ForwardDialog,
} from '@/features/chat';
import type { User, Message } from '@/features/chat/types';

export function ChatPage() {
    const { updateUser } = useAuth();
    const { onlineUsers, currentUserId, typingUsers } = useSocket();

    // Conversations hook
    const {
        conversations,
        selectedConversation,
        showNewChat,
        searchQuery,
        isMobileListView,
        filteredUsers,
        setSelectedConversation,
        setShowNewChat,
        setSearchQuery,
        setIsMobileListView,
        startNewConversation,
        deleteConversation,
        markConversationAsRead,
        markConversationAsUnread,
        createGroup,
        availableUsers,
        hideConversation,
        clearConversationHistory,
    } = useConversations({ userId: currentUserId });

    // Messages hook
    const { messages, messagesEndRef, restoreMessage, clearMessages } = useMessages({
        userId: currentUserId,
        selectedConversation,
    });

    // Chat actions hook
    const {
        newMessage,
        editingMessage,
        inputRef,
        handleSendMessage,
        handleStartEdit,
        handleCancelEdit,
        handleDeleteMessage,
        handleRecallMessage,

        handleTyping,
        handleVoiceSend,
        handleReply,
        handleCancelReply,
        replyingMessage,
        attachment,
        handleFileSelect,
        handleRemoveAttachment,
        handleAddEmoji,
        isSending,
    } = useChatActions({ selectedConversation, restoreMessage });

    // Manual mark as read handler for ChatWindow interaction
    const handleWindowFocus = useCallback(() => {
        if (selectedConversation) {
            markConversationAsRead(selectedConversation.id);
        }
    }, [selectedConversation, markConversationAsRead]);

    // Check if user is online
    const isUserOnline = (checkUserId: number): boolean => {
        return onlineUsers.some(u => u.userId === checkUserId);
    };

    // Handle conversation selection
    const handleSelectConversation = (conv: typeof selectedConversation) => {
        setSelectedConversation(conv);
        setIsMobileListView(false);
    };

    // State for viewing user profile
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    // Handle view profile
    const handleViewProfile = (userId: number) => {
        // Try to find user in selected conversation
        let user = selectedConversation?.users?.find(u => u.id === userId);

        // If not found, check all conversations
        if (!user) {
            for (const conv of conversations) {
                user = conv.users?.find(u => u.id === userId);
                if (user) break;
            }
        }

        // If still not found, check available users (search results)
        if (!user) {
            user = filteredUsers.find(u => u.id === userId);
        }

        if (user) {
            setViewingUser(user);
        }
    };

    // State for group settings
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

    // State for forwarding
    const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

    // Get typing users for current conversation
    const currentTypingUsers = typingUsers.get(selectedConversation?.id || 0) || [];

    const { pinMessage, unpinMessage, addReaction, removeReaction } = useSocket();

    const handleReaction = useCallback((messageId: number, emoji: string, hasUserReacted: boolean) => {
        if (!selectedConversation) return;
        if (hasUserReacted) {
            removeReaction(messageId, emoji, selectedConversation.id);
        } else {
            addReaction(messageId, emoji, selectedConversation.id);
        }
    }, [selectedConversation, addReaction, removeReaction]);

    const handlePin = useCallback((msg: Message) => {
        if (!selectedConversation) return;
        pinMessage(msg.id, selectedConversation.id);
    }, [selectedConversation, pinMessage]);

    const handleUnpin = useCallback((messageId: number) => {
        if (!selectedConversation) return;
        unpinMessage(messageId, selectedConversation.id);
    }, [selectedConversation, unpinMessage]);

    const handleJumpToMessage = useCallback((messageId: number) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-primary/10');
            setTimeout(() => {
                element.classList.remove('bg-primary/10');
            }, 2000);
        }
    }, []);

    const handleForward = useCallback(async (messageId: number, targetConversationIds: number[]) => {
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/${messageId}/forward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetConversationIds, userId: currentUserId })
            });
            if (res.ok) {
                toast.success('Đã chuyển tiếp tin nhắn');
            } else {
                toast.error('Không thể chuyển tiếp tin nhắn');
            }
        } catch (error) {
            console.error('Forward error:', error);
            toast.error('Có lỗi xảy ra khi chuyển tiếp');
        }
    }, [currentUserId]);

    const handleClearHistory = useCallback(async (conversationId: number) => {
        await clearConversationHistory(conversationId);
        // If we clear history of currently selected conversation, clear local messages
        if (selectedConversation?.id === conversationId) {
            clearMessages();
        }
    }, [clearConversationHistory, selectedConversation, clearMessages]);

    return (
        <>
            <div className="h-[calc(100vh-8rem)] flex bg-card rounded-xl border shadow-sm overflow-hidden">
                <ConversationSidebar
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    currentUserId={currentUserId}
                    availableUsers={availableUsers}
                    showNewChat={showNewChat}
                    searchQuery={searchQuery}
                    filteredUsers={filteredUsers}
                    isMobileListView={isMobileListView}
                    isUserOnline={isUserOnline}
                    onSelectConversation={handleSelectConversation}
                    onToggleNewChat={() => setShowNewChat(!showNewChat)}
                    onSearchChange={setSearchQuery}
                    onStartNewConversation={startNewConversation}
                    onDeleteConversation={deleteConversation}
                    onMarkAsRead={markConversationAsRead}
                    onMarkAsUnread={markConversationAsUnread}
                    onViewProfile={handleViewProfile}
                    onCreateGroup={createGroup}
                    onHideConversation={hideConversation}
                    onClearHistory={handleClearHistory}
                />

                <ChatWindow
                    conversation={selectedConversation}
                    messages={messages}
                    currentUserId={currentUserId}
                    newMessage={newMessage}
                    editingMessage={editingMessage}
                    inputRef={inputRef}
                    messagesEndRef={messagesEndRef}
                    isMobileListView={isMobileListView}
                    isUserOnline={isUserOnline}
                    onBackClick={() => setIsMobileListView(true)}
                    onTyping={handleTyping}
                    onFocus={handleWindowFocus}
                    onSend={() => {
                        handleSendMessage();
                        if (selectedConversation) markConversationAsRead(selectedConversation.id);
                    }}
                    onCancelEdit={handleCancelEdit}
                    onEditMessage={handleStartEdit}
                    onDeleteMessage={handleDeleteMessage}
                    onRecallMessage={handleRecallMessage}

                    // New features
                    typingUsers={currentTypingUsers.map(it => ({
                        id: it.userId,
                        name: it.userName,
                        username: it.userName.toLowerCase().replace(/\s+/g, ''),
                        avatar_url: ''
                    } as User))}
                    onReplyMessage={handleReply}
                    onCancelReply={handleCancelReply}
                    replyingMessage={replyingMessage}
                    onForwardMessage={setForwardingMessage}
                    onPinMessage={handlePin}
                    onUnpinMessage={handleUnpin}
                    onReaction={handleReaction}
                    onJumpToMessage={handleJumpToMessage}
                    onVoiceSend={handleVoiceSend}

                    attachment={attachment}
                    onFileSelect={handleFileSelect}
                    onRemoveAttachment={handleRemoveAttachment}
                    onEmojiSelect={handleAddEmoji}
                    onInfoClick={() => setIsGroupSettingsOpen(true)}
                    isSending={isSending}
                />
            </div>

            {forwardingMessage && (
                <ForwardDialog
                    open={!!forwardingMessage}
                    onClose={() => setForwardingMessage(null)}
                    message={forwardingMessage}
                    conversations={conversations}
                    currentUserId={currentUserId!}
                    onForward={handleForward}
                />
            )}

            <UserProfileSidebar
                user={viewingUser}
                currentUserId={currentUserId}
                open={!!viewingUser}
                onClose={() => setViewingUser(null)}
                onUpdateUser={(updatedUser: any) => {
                    // Update global auth context
                    updateUser(updatedUser);
                    // Update local viewing user if it matches
                    setViewingUser(updatedUser);
                }}
            />

            {selectedConversation && (
                <GroupSettingsDialog
                    open={isGroupSettingsOpen}
                    onClose={() => setIsGroupSettingsOpen(false)}
                    conversation={selectedConversation}
                    currentUserId={currentUserId}
                    availableUsers={availableUsers}
                />
            )}
        </>
    );
}
