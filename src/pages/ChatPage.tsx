import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
    useConversations,
    useMessages,
    useChatActions,
    ConversationSidebar,
    ChatWindow,
    UserProfileSidebar,
    GroupSettingsDialog,
} from '@/features/chat';
import type { User } from '@/features/chat/types';

export function ChatPage() {
    const { updateUser } = useAuth();
    const { onlineUsers, currentUserId } = useSocket();

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
        attachment,
        handleFileSelect,
        handleRemoveAttachment,
        handleAddEmoji,
    } = useChatActions({ selectedConversation, restoreMessage });

    // Manual mark as read handler for ChatWindow interaction
    const handleWindowFocus = useCallback(() => {
        if (selectedConversation) {
            markConversationAsRead(selectedConversation.id);
        }
    }, [selectedConversation, markConversationAsRead]);

    // Check if user is online
    const isUserOnline = (checkUserId: number): boolean => {
        return onlineUsers.some(u => u.odockrocket === checkUserId);
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
                    attachment={attachment}
                    onFileSelect={handleFileSelect}
                    onRemoveAttachment={handleRemoveAttachment}
                    onEmojiSelect={handleAddEmoji}
                    onInfoClick={() => setIsGroupSettingsOpen(true)}
                />
            </div>

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
