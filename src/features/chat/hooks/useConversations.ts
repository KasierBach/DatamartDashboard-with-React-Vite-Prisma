import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { API_ENDPOINTS } from '@/config/api';
import type { Conversation, User } from '../types';

interface UseConversationsProps {
    userId: number | null;
}

interface UseConversationsReturn {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    availableUsers: User[];
    showNewChat: boolean;
    searchQuery: string;
    isMobileListView: boolean;
    filteredUsers: User[];
    setSelectedConversation: (conv: Conversation | null) => void;
    setShowNewChat: (show: boolean) => void;
    setSearchQuery: (query: string) => void;
    setIsMobileListView: (show: boolean) => void;
    loadConversations: () => Promise<void>;
    startNewConversation: (targetUser: User) => Promise<void>;
    getOtherUser: (conv: Conversation) => User | undefined;
    deleteConversation: (conversationId: number) => Promise<void>;
    markConversationAsRead: (conversationId: number) => Promise<void>;
    markConversationAsUnread: (conversationId: number) => Promise<void>;
    createGroup: (name: string, members: number[]) => Promise<void>;
    hideConversation: (conversationId: number) => Promise<void>;
}

export function useConversations({ userId }: UseConversationsProps): UseConversationsReturn {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileListView, setIsMobileListView] = useState(true);
    const { onConversationUpdated, onConversationNew, onConversationRemoved } = useSocket();

    // Use ref to keep track of selected conversation inside persistent socket listeners
    const selectedConversationIdRef = useRef(selectedConversation?.id);
    useEffect(() => {
        selectedConversationIdRef.current = selectedConversation?.id;
    }, [selectedConversation?.id]);

    // Listen for conversation updates
    useEffect(() => {
        const removeUpdateListener = onConversationUpdated((updatedConv) => {
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.id === updatedConv.id);
                if (existingIndex > -1) {
                    const existing = prev[existingIndex];
                    const updated = {
                        ...existing,
                        ...updatedConv,
                        unreadCount: updatedConv.unreadCount !== undefined ? updatedConv.unreadCount : existing.unreadCount
                    };
                    // Move to top: removal + unshift
                    const remaining = prev.filter(c => c.id !== updatedConv.id);
                    return [updated, ...remaining];
                }
                return prev;
            });

            // Also update selected conversation if it matches
            if (selectedConversationIdRef.current === updatedConv.id) {
                setSelectedConversation(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        ...updatedConv,
                        unreadCount: updatedConv.unreadCount !== undefined ? updatedConv.unreadCount : prev.unreadCount
                    };
                });
            }
        });

        const removeNewListener = onConversationNew((newConv) => {
            setConversations(prev => {
                if (prev.some(c => c.id === newConv.id)) return prev;
                return [newConv, ...prev];
            });
        });

        const removeRemoveListener = onConversationRemoved(({ id }) => {
            setConversations(prev => prev.filter(c => c.id !== id));
            if (selectedConversationIdRef.current === id) {
                setSelectedConversation(null);
            }
        });

        return () => {
            removeUpdateListener();
            removeNewListener();
            removeRemoveListener();
        };
    }, [onConversationUpdated, onConversationNew, onConversationRemoved]);

    // Load conversations
    const loadConversations = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/conversations?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }, [userId]);

    // Load available users for new chat
    const loadAvailableUsers = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/users/available?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableUsers(data);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }, [userId]);

    // Initial load
    useEffect(() => {
        if (userId) {
            loadConversations();
            loadAvailableUsers();
        }
    }, [userId, loadConversations, loadAvailableUsers]);

    // Start new conversation
    const startNewConversation = useCallback(async (targetUser: User) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, targetUserId: targetUser.id })
            });
            if (res.ok) {
                const conv = await res.json();
                setSelectedConversation(conv);
                setShowNewChat(false);
                setIsMobileListView(false);
                loadConversations();
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    }, [userId, loadConversations]);

    // Get other user in conversation
    const getOtherUser = useCallback((conv: Conversation): User | undefined => {
        return conv.users?.find(u => u.id !== userId);
    }, [userId]);

    // Filter users for search
    const filteredUsers = availableUsers.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Delete conversation
    const deleteConversation = useCallback(async (conversationId: number) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}?userId=${userId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== conversationId));
                if (selectedConversation?.id === conversationId) {
                    setSelectedConversation(null);
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    }, [userId, selectedConversation]);

    // Mark conversation as read
    const markConversationAsRead = useCallback(async (conversationId: number) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/read?userId=${userId}`, {
                method: 'PUT'
            });
            if (res.ok) {
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 0 } : c
                ));
            }
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    }, [userId]);

    // Mark conversation as unread
    const markConversationAsUnread = useCallback(async (conversationId: number) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/unread?userId=${userId}`, {
                method: 'PUT'
            });
            if (res.ok) {
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, unreadCount: 1 } : c
                ));
            }
        } catch (error) {
            console.error('Error marking conversation as unread:', error);
        }
    }, [userId]);

    const createGroup = useCallback(async (name: string, memberIds: number[]) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, name, memberIds })
            });
            if (res.ok) {
                const conv = await res.json();
                setSelectedConversation(conv);
                setShowNewChat(false);
                setIsMobileListView(false);
                loadConversations();
            }
        } catch (error) {
            console.error('Error creating group:', error);
        }
    }, [userId, loadConversations]);

    // Hide conversation (Soft Delete)
    const hideConversation = useCallback(async (conversationId: number) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/hide?userId=${userId}`, {
                method: 'PUT'
            });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== conversationId));
                if (selectedConversation?.id === conversationId) {
                    setSelectedConversation(null);
                }
            }
        } catch (error) {
            console.error('Error hiding conversation:', error);
        }
    }, [userId, selectedConversation]);

    return {
        conversations,
        selectedConversation,
        availableUsers,
        showNewChat,
        searchQuery,
        isMobileListView,
        filteredUsers,
        setSelectedConversation,
        setShowNewChat,
        setSearchQuery,
        setIsMobileListView,
        loadConversations,
        startNewConversation,
        getOtherUser,
        deleteConversation,
        markConversationAsRead,
        markConversationAsUnread,
        createGroup,
        hideConversation,
    };
}
