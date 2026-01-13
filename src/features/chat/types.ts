export interface User {
    id: number;
    username: string;
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    avatar?: string;
}

export interface MessageStatus {
    id: number;
    message_id: number;
    user_id: number;
    delivered_at: string | null;
    seen_at: string | null;
}

export interface MessageReaction {
    id: number;
    message_id: number;
    user_id: number;
    emoji: string;
    created_at: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    is_edited?: boolean;
    is_recalled?: boolean;
    attachment_url?: string;
    attachment_type?: 'image' | 'video' | 'file';
    // New fields for enhanced features
    reply_to_id?: number;
    reply_to?: {
        id: number;
        content: string;
        sender?: { id: number; name: string };
    };
    forwarded_from?: number;
    voice_url?: string;
    voice_duration?: number;
    reactions?: MessageReaction[];
    statuses: MessageStatus[];
    pinnedMessages?: PinnedMessage[];
    sender?: {
        id: number;
        username: string;
        name: string;
        avatar?: string;
    };
}

export interface PinnedMessage {
    id: number;
    conversation_id: number;
    message_id: number;
    pinned_by: number;
    pinned_at: string;
    message: Message;
}

export interface Conversation {
    id: number;
    type: 'direct' | 'group';
    name?: string;
    group_avatar?: string;
    created_at: string;
    updated_at: string;
    users: User[];
    members?: { user_id: number; role: string; }[];
    messages: Message[];
    unreadCount: number;
    pinnedMessages?: PinnedMessage[];
}
