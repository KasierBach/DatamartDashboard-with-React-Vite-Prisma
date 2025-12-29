import { useState, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { API_ENDPOINTS } from '@/config/api';
import type { Message, Conversation } from '../types';

interface UseChatActionsProps {
    selectedConversation: Conversation | null;
}

interface UseChatActionsReturn {
    newMessage: string;
    editingMessage: Message | null;
    inputRef: React.RefObject<HTMLInputElement>;
    setNewMessage: (message: string) => void;
    handleSendMessage: () => void;
    handleStartEdit: (msg: Message) => void;
    handleCancelEdit: () => void;
    handleDeleteMessage: (msg: Message) => void;
    handleRecallMessage: (msg: Message) => void;
    handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    attachment: File | null;
    handleFileSelect: (file: File) => void;
    handleRemoveAttachment: () => void;
}

export function useChatActions({ selectedConversation }: UseChatActionsProps): UseChatActionsReturn {
    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { sendMessage, editMessage, deleteMessage, recallMessage, startTyping, stopTyping } = useSocket();

    // Handle file select
    const handleFileSelect = useCallback((file: File) => {
        setAttachment(file);
    }, []);

    // Remove attachment
    const handleRemoveAttachment = useCallback(() => {
        setAttachment(null);
    }, []);

    // Send message
    const handleSendMessage = useCallback(async () => {
        if ((!newMessage.trim() && !attachment) || !selectedConversation) return;

        let attachmentUrl;
        let attachmentType;

        try {
            if (attachment) {
                const formData = new FormData();
                formData.append('file', attachment);

                const res = await fetch(`${API_ENDPOINTS.MESSAGES.replace('/messages', '')}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    attachmentUrl = data.url;
                    attachmentType = data.type;
                }
            }

            if (editingMessage) {
                editMessage(editingMessage.id, newMessage.trim(), selectedConversation.id);
                setEditingMessage(null);
            } else {
                sendMessage(
                    selectedConversation.id,
                    newMessage.trim(),
                    attachmentUrl,
                    attachmentType
                );
            }
            setNewMessage('');
            setAttachment(null);
            stopTyping(selectedConversation.id);
            inputRef.current?.focus();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }, [newMessage, attachment, selectedConversation, editingMessage, sendMessage, editMessage, stopTyping]);

    // Start editing a message
    const handleStartEdit = useCallback((msg: Message) => {
        setEditingMessage(msg);
        setNewMessage(msg.content);
        inputRef.current?.focus();
    }, []);

    // Cancel editing
    const handleCancelEdit = useCallback(() => {
        setEditingMessage(null);
        setNewMessage('');
    }, []);

    // Delete message (for self)
    const handleDeleteMessage = useCallback((msg: Message) => {
        if (!selectedConversation) return;
        deleteMessage(msg.id, selectedConversation.id);
    }, [selectedConversation, deleteMessage]);

    // Recall message (for everyone)
    const handleRecallMessage = useCallback((msg: Message) => {
        if (!selectedConversation) return;
        recallMessage(msg.id, selectedConversation.id);
    }, [selectedConversation, recallMessage]);

    // Handle typing
    const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (selectedConversation && e.target.value) {
            startTyping(selectedConversation.id);
        }
    }, [selectedConversation, startTyping]);

    return {
        newMessage,
        editingMessage,
        inputRef,
        setNewMessage,
        handleSendMessage,
        handleStartEdit,
        handleCancelEdit,
        handleDeleteMessage,
        handleRecallMessage,
        handleTyping,
        attachment,
        handleFileSelect,
        handleRemoveAttachment,
    };
}
