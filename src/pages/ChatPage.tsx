import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
    useConversations,
    useMessages,
    useChatActions,
    ConversationSidebar,
    ChatWindow,
    UserProfileSidebar,
} from '@/features/chat';
import type { User } from '@/features/chat/types';

export function ChatPage() {
    useAuth();
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
    } = useConversations({ userId: currentUserId });

    // Messages hook
    const { messages, messagesEndRef } = useMessages({
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
    } = useChatActions({ selectedConversation });

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

    return (
        <>
            <div className="h-[calc(100vh-8rem)] flex bg-card rounded-xl border shadow-sm overflow-hidden">
                <ConversationSidebar
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    currentUserId={currentUserId}
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
                    onSend={handleSendMessage}
                    onCancelEdit={handleCancelEdit}
                    onEditMessage={handleStartEdit}
                    onDeleteMessage={handleDeleteMessage}
                    onRecallMessage={handleRecallMessage}
                    attachment={attachment}
                    onFileSelect={handleFileSelect}
                    onRemoveAttachment={handleRemoveAttachment}
                />
            </div>

            <UserProfileSidebar
                user={viewingUser}
                open={!!viewingUser}
                onClose={() => setViewingUser(null)}
            />
        </>
    );
}
