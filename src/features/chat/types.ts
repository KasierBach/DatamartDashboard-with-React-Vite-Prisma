export interface User {
    id: number;
    username: string;
    name: string;
    role?: string;
    email?: string;
    phone?: string;
}

export interface MessageStatus {
    id: number;
    message_id: number;
    user_id: number;
    delivered_at: string | null;
    seen_at: string | null;
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
    attachment_type?: 'image' | 'video';
    statuses: MessageStatus[];
}

export interface Conversation {
    id: number;
    created_at: string;
    updated_at: string;
    users: User[];
    messages: Message[];
    unreadCount: number;
}
