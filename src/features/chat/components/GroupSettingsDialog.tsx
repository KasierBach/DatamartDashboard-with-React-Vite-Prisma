import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./UserAvatar";
import {
    Search,
    Bell,
    Edit2,
    LogOut,
    Trash2,
    UserPlus,
    Image as ImageIcon,
    Shield,
    FileText
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { API_ENDPOINTS } from '@/config/api';
import type { Conversation, User } from '../types';

interface GroupSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    conversation: Conversation;
    currentUserId: number | null;
    availableUsers: User[];
}

export function GroupSettingsDialog({
    open,
    onClose,
    conversation,
    currentUserId,
    availableUsers
}: GroupSettingsDialogProps) {
    const [name, setName] = useState(conversation.name || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setName(conversation.name || '');
            setIsEditingName(false);
            setIsAddingMember(false);
            setSearchQuery('');
        }
    }, [open, conversation]);

    const handleRename = async () => {
        if (!currentUserId || !name.trim() || name === conversation.name) return;

        try {
            await fetch(`${API_ENDPOINTS.MESSAGES}/groups/${conversation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, name })
            });
            setIsEditingName(false);
        } catch (error) {
            console.error('Failed to rename group:', error);
        }
    };

    const handleAddMembers = async (memberIds: number[]) => {
        if (!currentUserId || memberIds.length === 0) return;

        try {
            await fetch(`${API_ENDPOINTS.MESSAGES}/groups/${conversation.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, memberIds })
            });
            setIsAddingMember(false);
        } catch (error) {
            console.error('Failed to add members:', error);
        }
    };

    const handleRemoveMember = async (targetUserId: number) => {
        if (!currentUserId) return;
        if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;

        try {
            await fetch(`${API_ENDPOINTS.MESSAGES}/groups/${conversation.id}/members/${targetUserId}?userId=${currentUserId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    };

    const handleLeaveGroup = async () => {
        if (!currentUserId) return;
        if (!confirm('Bạn có chắc chắn muốn rời khỏi nhóm này?')) return;

        try {
            await fetch(`${API_ENDPOINTS.MESSAGES}/groups/${conversation.id}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId })
            });
            onClose();
        } catch (error) {
            console.error('Failed to leave group:', error);
        }
    };

    // Filter potential new members
    const existingMemberIds = conversation.members?.map(m => m.user_id) || [];
    const potentialMembers = availableUsers.filter(u =>
        !existingMemberIds.includes(u.id) &&
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isAdmin = conversation.members?.find(m => m.user_id === currentUserId)?.role === 'admin';

    const ActionButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
        <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={onClick}>
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] h-auto max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                    <DialogTitle className="text-base font-bold text-center w-full">Thông tin</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* Header Profile Section */}
                    <div className="flex flex-col items-center pt-8 pb-6">
                        <div className="h-32 w-32 rounded-full bg-secondary/30 flex items-center justify-center text-5xl font-bold text-primary mb-4 shadow-sm">
                            {conversation.name?.charAt(0).toUpperCase()}
                        </div>

                        {isEditingName ? (
                            <div className="flex items-center gap-2 px-8 w-full">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-center h-8"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                />
                                <Button size="sm" onClick={handleRename}>Lưu</Button>
                            </div>
                        ) : (
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {conversation.name}
                            </h2>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">Chat nhóm</p>

                        {/* Quick Actions Row */}
                        <div className="flex items-center gap-8 mt-6">
                            <ActionButton icon={Bell} label="Tắt thông báo" />
                            <ActionButton icon={Search} label="Tìm kiếm" />
                            <ActionButton icon={UserPlus} label="Thêm người" onClick={() => setIsAddingMember(true)} />
                        </div>
                    </div>

                    {/* Adding Member View */}
                    {isAddingMember && (
                        <div className="p-4 border-t border-b bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Thêm thành viên</span>
                                <Button variant="ghost" size="sm" className="h-6" onClick={() => setIsAddingMember(false)}>Hủy</Button>
                            </div>
                            <div className="relative mb-2">
                                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm tên..."
                                    className="pl-7 h-8 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="max-h-[150px] overflow-y-auto space-y-1">
                                {potentialMembers.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-2 hover:bg-background rounded-md cursor-pointer"
                                        onClick={() => handleAddMembers([u.id])}>
                                        <div className="flex items-center gap-2">
                                            <UserAvatar user={u} size="sm" />
                                            <span className="text-sm">{u.name}</span>
                                        </div>
                                        <UserPlus className="h-3 w-3 text-primary" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Settings Accordion */}
                    <div className="px-2 pb-6">
                        <Accordion type="multiple" defaultValue={['info', 'customize', 'privacy']} className="w-full">

                            <AccordionItem value="customize">
                                <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                                    Tùy chỉnh đoạn chat
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                        onClick={() => setIsEditingName(!isEditingName)}
                                    >
                                        <Edit2 className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-medium">Đổi tên đoạn chat</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <ImageIcon className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-medium">Thay đổi ảnh</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="info">
                                <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                                    Thành viên trong đoạn chat
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1">
                                        {conversation.users?.map(u => {
                                            const role = conversation.members?.find(m => m.user_id === u.id)?.role;
                                            const isMe = u.id === currentUserId;
                                            return (
                                                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg group">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar user={u} size="sm" />
                                                        <div>
                                                            <p className="text-sm font-medium">{u.name}</p>
                                                            {role === 'admin' && <p className="text-[10px] text-muted-foreground">Quản trị viên</p>}
                                                        </div>
                                                    </div>
                                                    {isAdmin && !isMe && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveMember(u.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"
                                            onClick={() => setIsAddingMember(true)}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                <UserPlus className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium">Thêm người</span>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="media">
                                <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                                    File phương tiện & file
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <ImageIcon className="h-5 w-5 text-gray-500" />
                                        <div className="flex-1">
                                            <p className="font-medium">File phương tiện</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <FileText className="h-5 w-5 text-gray-500" />
                                        <div className="flex-1">
                                            <p className="font-medium">File</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="privacy" className="border-none">
                                <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                                    Quyền riêng tư & hỗ trợ
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors text-destructive"
                                        onClick={handleLeaveGroup}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <div className="flex-1">
                                            <p className="font-medium">Rời khỏi nhóm</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors text-muted-foreground">
                                        <Shield className="h-5 w-5" />
                                        <div className="flex-1">
                                            <p className="font-medium">Báo cáo</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
