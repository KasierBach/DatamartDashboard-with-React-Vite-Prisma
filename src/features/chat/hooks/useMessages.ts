import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { API_ENDPOINTS } from '@/config/api';
import type { Message, Conversation } from '../types';

interface UseMessagesProps {
    userId: number | null;
    selectedConversation: Conversation | null;
}

interface UseMessagesReturn {
    messages: Message[];
    messagesEndRef: React.RefObject<HTMLDivElement>;
    loadMessages: (conversationId: number) => Promise<void>;
}

export function useMessages({ userId, selectedConversation }: UseMessagesProps): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        joinConversation,
        leaveConversation,
        onNewMessage,
        onMessageStatus,
        onMessageEdited,
        onMessageDeleted,
        onMessageRecalled,
        markAsSeen
    } = useSocket();

    // Load messages for a conversation
    const loadMessages = useCallback(async (conversationId: number) => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.MESSAGES}/conversations/${conversationId}/messages?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);

                // Mark messages as seen
                data.forEach((msg: Message) => {
                    if (msg.sender_id !== userId) {
                        markAsSeen(msg.id);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }, [userId, markAsSeen]);

    // Socket event listeners
    useEffect(() => {
        const unsubNewMessage = onNewMessage((message) => {
            if (selectedConversation && message.conversation_id === selectedConversation.id) {
                setMessages(prev => [...prev, message]);
                if (message.sender_id !== userId) {
                    markAsSeen(message.id);
                }
            }
        });

        const unsubStatus = onMessageStatus((data) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === data.messageId) {
                    return {
                        ...msg,
                        statuses: [
                            ...msg.statuses.filter(s => s.user_id !== data.userId),
                            {
                                id: 0,
                                message_id: data.messageId,
                                user_id: data.userId,
                                delivered_at: data.status === 'delivered' || data.status === 'seen' ? new Date().toISOString() : null,
                                seen_at: data.status === 'seen' ? new Date().toISOString() : null
                            }
                        ]
                    };
                }
                return msg;
            }));
        });

        const unsubEdited = onMessageEdited((updatedMessage) => {
            setMessages(prev => prev.map(msg =>
                msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
            ));
        });

        const unsubDeleted = onMessageDeleted((data) => {
            setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        });

        const unsubRecalled = onMessageRecalled((data) => {
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId ? { ...msg, is_recalled: true, content: '' } : msg
            ));
        });

        return () => {
            unsubNewMessage();
            unsubStatus();
            unsubEdited();
            unsubDeleted();
            unsubRecalled();
        };
    }, [onNewMessage, onMessageStatus, onMessageEdited, onMessageDeleted, onMessageRecalled, selectedConversation, userId, markAsSeen]);

    // Join/leave conversation room
    useEffect(() => {
        if (selectedConversation) {
            joinConversation(selectedConversation.id);
            loadMessages(selectedConversation.id);
            return () => leaveConversation(selectedConversation.id);
        }
    }, [selectedConversation, joinConversation, leaveConversation, loadMessages]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return {
        messages,
        messagesEndRef,
        loadMessages,
    };
}
