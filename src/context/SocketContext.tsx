import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../config/api';

interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    statuses: MessageStatus[];
}

interface MessageStatus {
    id: number;
    message_id: number;
    user_id: number;
    delivered_at: string | null;
    seen_at: string | null;
}

interface TypingUser {
    userId: number;
    userName: string;
}

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: { odockrocket: number; name: string }[];
    typingUsers: Map<number, TypingUser[]>;
    sendMessage: (conversationId: number, content: string, attachmentUrl?: string, attachmentType?: string) => void;
    editMessage: (messageId: number, content: string, conversationId: number) => void;
    deleteMessage: (messageId: number, conversationId: number) => void;
    undeleteMessage: (messageId: number, conversationId: number) => void;
    recallMessage: (messageId: number, conversationId: number) => void;
    markAsDelivered: (messageId: number) => void;
    markAsSeen: (messageId: number) => void;
    startTyping: (conversationId: number) => void;
    stopTyping: (conversationId: number) => void;
    joinConversation: (conversationId: number) => void;
    leaveConversation: (conversationId: number) => void;
    onNewMessage: (callback: (message: Message) => void) => () => void;
    onMessageStatus: (callback: (data: { messageId: number; status: string; userId: number }) => void) => () => void;
    onMessageEdited: (callback: (message: Message) => void) => () => void;
    onMessageDeleted: (callback: (data: { messageId: number; userId: number }) => void) => () => void;
    onMessageUndeleted: (callback: (data: { message: Message; userId: number; conversationId: number }) => void) => () => void;
    onMessageRecalled: (callback: (data: { messageId: number; conversationId: number }) => void) => () => void;
    onNotification: (callback: (data: { conversationId: number; message: Message }) => void) => () => void;
    onConversationUpdated: (callback: (data: any) => void) => () => void;
    onConversationNew: (callback: (data: any) => void) => () => void;
    onConversationRemoved: (callback: (data: { id: number }) => void) => () => void;
    unreadCounts: Map<number, number>;
    totalUnread: number;
    currentUserId: number;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<{ odockrocket: number; name: string }[]>([]);
    const [typingUsers] = useState<Map<number, TypingUser[]>>(new Map());
    const [unreadCounts] = useState<Map<number, number>>(new Map());
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get current user ID
    const currentUserId = user?.id || 0;

    // Calculate total unread
    const totalUnread = Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0);

    // Connect socket when user logs in
    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(API_BASE_URL, {
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            // Join with user info
            newSocket.emit('user:join', { userId: user.id, name: user.name });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('users:online', (users) => {
            setOnlineUsers(users);
        });

        newSocket.on('typing:update', (_data: { userId: number; userName?: string; isTyping: boolean; conversationId?: number }) => {
            // This will be handled by conversation-specific listeners
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    // Send message
    const sendMessage = useCallback((conversationId: number, content: string, attachmentUrl?: string, attachmentType?: string) => {
        if (!socket || !user) return;
        socket.emit('message:send', {
            conversationId,
            senderId: user.id,
            content,
            attachmentUrl,
            attachmentType
        });
    }, [socket, user]);

    // Mark as delivered
    const markAsDelivered = useCallback((messageId: number) => {
        if (!socket || !user) return;
        socket.emit('message:delivered', { messageId, userId: user.id });
    }, [socket, user]);

    // Mark as seen
    const markAsSeen = useCallback((messageId: number) => {
        if (!socket || !user) return;
        socket.emit('message:seen', { messageId, userId: user.id });
    }, [socket, user]);

    // Typing indicators
    const startTyping = useCallback((conversationId: number) => {
        if (!socket || !user) return;
        socket.emit('typing:start', { conversationId, userId: user.id, userName: user.name });

        // Auto-stop after 3 seconds
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(conversationId);
        }, 3000);
    }, [socket, user]);

    const stopTyping = useCallback((conversationId: number) => {
        if (!socket || !user) return;
        socket.emit('typing:stop', { conversationId, userId: user.id });
    }, [socket, user]);

    // Join/Leave conversation
    const joinConversation = useCallback((conversationId: number) => {
        if (!socket) return;
        socket.emit('conversation:join', conversationId);
    }, [socket]);

    const leaveConversation = useCallback((conversationId: number) => {
        if (!socket) return;
        socket.emit('conversation:leave', conversationId);
    }, [socket]);

    // Event listeners
    const onNewMessage = useCallback((callback: (message: Message) => void) => {
        if (!socket) return () => { };
        socket.on('message:new', callback);
        return () => socket.off('message:new', callback);
    }, [socket]);

    const onMessageStatus = useCallback((callback: (data: { messageId: number; status: string; userId: number }) => void) => {
        if (!socket) return () => { };
        socket.on('message:status', callback);
        return () => socket.off('message:status', callback);
    }, [socket]);

    const onNotification = useCallback((callback: (data: { conversationId: number; message: Message }) => void) => {
        if (!socket) return () => { };
        socket.on('message:notification', callback);
        return () => socket.off('message:notification', callback);
    }, [socket]);

    // Edit message
    const editMessage = useCallback((messageId: number, content: string, conversationId: number) => {
        if (!socket || !user) return;
        socket.emit('message:edit', { messageId, userId: user.id, content, conversationId });
    }, [socket, user]);

    // Delete message (for self only)
    const deleteMessage = useCallback((messageId: number, conversationId: number) => {
        if (!socket || !user) return;
        socket.emit('message:delete', { messageId, userId: user.id, conversationId });
    }, [socket, user]);

    // Undo delete message (restore for self)
    const undeleteMessage = useCallback((messageId: number, conversationId: number) => {
        if (!socket || !user) return;
        socket.emit('message:undelete', { messageId, userId: user.id, conversationId });
    }, [socket, user]);

    // Recall message (for everyone)
    const recallMessage = useCallback((messageId: number, conversationId: number) => {
        if (!socket || !user) return;
        socket.emit('message:recall', { messageId, userId: user.id, conversationId });
    }, [socket, user]);

    // Message action event listeners
    const onMessageEdited = useCallback((callback: (message: Message) => void) => {
        if (!socket) return () => { };
        socket.on('message:edited', callback);
        return () => socket.off('message:edited', callback);
    }, [socket]);

    const onMessageDeleted = useCallback((callback: (data: { messageId: number; userId: number }) => void) => {
        if (!socket) return () => { };
        socket.on('message:deleted', callback);
        return () => socket.off('message:deleted', callback);
    }, [socket]);

    const onMessageUndeleted = useCallback((callback: (data: { message: Message; userId: number; conversationId: number }) => void) => {
        if (!socket) return () => { };
        socket.on('message:undeleted', callback);
        return () => socket.off('message:undeleted', callback);
    }, [socket]);

    const onMessageRecalled = useCallback((callback: (data: { messageId: number; conversationId: number }) => void) => {
        if (!socket) return () => { };
        socket.on('message:recalled', callback);
        return () => socket.off('message:recalled', callback);
    }, [socket]);

    const onConversationUpdated = useCallback((callback: (data: any) => void) => {
        if (!socket) return () => { };
        socket.on('conversation:updated', callback);
        return () => socket.off('conversation:updated', callback);
    }, [socket]);

    const onConversationNew = useCallback((callback: (data: any) => void) => {
        if (!socket) return () => { };
        socket.on('conversation:new', callback);
        return () => socket.off('conversation:new', callback);
    }, [socket]);

    const onConversationRemoved = useCallback((callback: (data: { id: number }) => void) => {
        if (!socket) return () => { };
        socket.on('conversation:removed', callback);
        return () => socket.off('conversation:removed', callback);
    }, [socket]);

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            onlineUsers,
            typingUsers,
            sendMessage,
            editMessage,
            deleteMessage,
            undeleteMessage,
            recallMessage,
            markAsDelivered,
            markAsSeen,
            startTyping,
            stopTyping,
            joinConversation,
            leaveConversation,
            onNewMessage,
            onMessageStatus,
            onMessageEdited,
            onMessageDeleted,
            onMessageUndeleted,
            onMessageRecalled,
            onNotification,
            onConversationUpdated,
            onConversationNew,
            onConversationRemoved,
            unreadCounts,
            totalUnread,
            currentUserId
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
