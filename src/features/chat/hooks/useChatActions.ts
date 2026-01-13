import { useState, useRef, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';
import type { Message, Conversation } from '../types';

interface UseChatActionsProps {
    selectedConversation: Conversation | null;
    restoreMessage?: (message: Message) => void;
}

interface UseChatActionsReturn {
    newMessage: string;
    editingMessage: Message | null;
    replyingMessage: Message | null;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    setNewMessage: (message: string) => void;
    handleSendMessage: () => void;
    handleStartEdit: (msg: Message) => void;
    handleCancelEdit: () => void;
    handleReply: (msg: Message) => void;
    handleCancelReply: () => void;
    handleDeleteMessage: (msg: Message) => void;
    handleRecallMessage: (msg: Message) => void;
    handleTyping: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement> | string) => void;
    handleVoiceSend: (voiceUrl: string, duration: number) => void;
    attachment: File | null;
    handleFileSelect: (file: File) => void;
    handleRemoveAttachment: () => void;
    handleAddEmoji: (emoji: string) => void;
    isSending: boolean;
}

export function useChatActions({ selectedConversation, restoreMessage }: UseChatActionsProps): UseChatActionsReturn {
    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { sendMessage, editMessage, deleteMessage, undeleteMessage, recallMessage, startTyping, stopTyping } = useSocket();

    // Handle emoji select
    const handleAddEmoji = useCallback((emoji: string) => {
        setNewMessage(prev => prev + emoji);
        // Delay focus slightly to ensure state is committed
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, []);

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
        if (isSending) return;
        if ((!newMessage.trim() && !attachment) || !selectedConversation) return;

        setIsSending(true);
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
                    attachmentType,
                    replyingMessage?.id
                );
            }
            setNewMessage('');
            setAttachment(null);
            setReplyingMessage(null);
            stopTyping(selectedConversation.id);
            inputRef.current?.focus();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    }, [newMessage, attachment, selectedConversation, editingMessage, replyingMessage, sendMessage, editMessage, stopTyping, isSending]);

    // Start editing a message
    const handleStartEdit = useCallback((msg: Message) => {
        setEditingMessage(msg);
        setReplyingMessage(null);
        setNewMessage(msg.content);
        inputRef.current?.focus();
    }, []);

    // Cancel editing
    const handleCancelEdit = useCallback(() => {
        setEditingMessage(null);
        setNewMessage('');
    }, []);

    // Handle reply
    const handleReply = useCallback((msg: Message) => {
        setReplyingMessage(msg);
        setEditingMessage(null);
        inputRef.current?.focus();
    }, []);

    // Cancel reply
    const handleCancelReply = useCallback(() => {
        setReplyingMessage(null);
    }, []);

    // Delete message (for self) with undo option
    const handleDeleteMessage = useCallback((msg: Message) => {
        if (!selectedConversation) return;
        deleteMessage(msg.id, selectedConversation.id);

        // Show toast with undo button
        toast('Đã xóa tin nhắn', {
            description: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
            duration: 10000,
            action: {
                label: 'Hoàn tác',
                onClick: () => {
                    if (selectedConversation) {
                        undeleteMessage(msg.id, selectedConversation.id);
                        // Immediately restore message in UI (optimistic update)
                        if (restoreMessage) {
                            restoreMessage(msg);
                        }
                    }
                }
            }
        });
    }, [selectedConversation, deleteMessage, undeleteMessage, restoreMessage]);

    // Recall message (for everyone)
    const handleRecallMessage = useCallback((msg: Message) => {
        if (!selectedConversation) return;
        recallMessage(msg.id, selectedConversation.id);
    }, [selectedConversation, recallMessage]);

    // Handle typing
    const handleTyping = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement> | string) => {
        const val = typeof e === 'string' ? e : e.target.value;
        setNewMessage(val);
        if (selectedConversation) {
            if (val.trim()) {
                startTyping(selectedConversation.id);
            } else {
                stopTyping(selectedConversation.id);
            }
        }
    }, [selectedConversation, startTyping, stopTyping]);

    // Handle voice message send
    const handleVoiceSend = useCallback((voiceUrl: string, duration: number) => {
        if (!selectedConversation) return;
        sendMessage(
            selectedConversation.id,
            '',
            undefined,
            undefined,
            replyingMessage?.id,
            voiceUrl,
            duration
        );
        setReplyingMessage(null);
    }, [selectedConversation, sendMessage, replyingMessage]);

    return {
        newMessage,
        editingMessage,
        replyingMessage,
        inputRef,
        setNewMessage,
        handleSendMessage,
        handleStartEdit,
        handleCancelEdit,
        handleReply,
        handleCancelReply,
        handleDeleteMessage,
        handleRecallMessage,
        handleTyping,
        handleVoiceSend,
        attachment,
        handleFileSelect,
        handleRemoveAttachment,
        handleAddEmoji,
        isSending,
    };
}
