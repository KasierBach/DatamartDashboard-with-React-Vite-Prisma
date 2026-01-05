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
    statuses: MessageStatus[];
    sender?: {
        id: number;
        username: string;
        name: string;
        avatar?: string;
    };
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
}
