import { X, Mail, Phone, Shield, User as UserIcon, Bell, Search, Image as ImageIcon, FileText, Ban, AlertTriangle } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import type { User } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';

interface UserProfileSidebarProps {
    user: User | null;
    currentUserId: number | null;
    open: boolean;
    onClose: () => void;
    onUpdateUser?: (user: User) => void;
}

const getRoleName = (role: string | undefined) => {
    const roles: Record<string, string> = {
        principal: 'Hiệu trưởng',
        vice_principal: 'Phó hiệu trưởng',
        head_dept: 'Trưởng bộ môn',
        teacher: 'Giáo viên',
        academic_affairs: 'Giáo vụ',
        qa_testing: 'Khảo thí',
        student_affairs: 'Công tác sinh viên',
        student: 'Sinh viên',
        no_role: 'Chưa phân quyền'
    };
    return roles[role || ''] || role || 'Chưa cập nhật';
};

export function UserProfileSidebar({ user, currentUserId, open, onClose, onUpdateUser }: UserProfileSidebarProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isCurrentUser = user && currentUserId && user.id === currentUserId;

    const handleAvatarClick = () => {
        if (isCurrentUser) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            // 1. Upload file
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(API_ENDPOINTS.UPLOAD, {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url } = await uploadRes.json();

            // 2. Update user profile
            const updateRes = await fetch(`${API_ENDPOINTS.USERS}/${user.username}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: url })
            });

            if (!updateRes.ok) throw new Error('Update profile failed');

            const { user: updatedUser } = await updateRes.json();

            // 3. Update local state without reload
            if (onUpdateUser && updatedUser) {
                onUpdateUser(updatedUser);
            }


        } catch (error) {
            console.error('Failed to change avatar:', error);
            alert('Có lỗi xảy ra khi đổi ảnh đại diện');
        } finally {
            setIsUploading(false);
        }
    };

    const ActionButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
        <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={onClick}>
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );

    return (
        <div
            className={cn(
                "fixed inset-y-0 right-0 z-50 w-80 bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
                open ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-lg text-center flex-1 ml-8">Thông tin</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Content */}
            {user && (
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center py-8 pb-6">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <UserAvatar user={user} className="h-32 w-32 text-4xl mb-4 shadow-sm" />

                            {isCurrentUser && (
                                <>
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center mb-4">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center mb-4">
                                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold mt-2">{user.name || user.username}</h2>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>

                        {/* Status (Mock) */}
                        <div className="flex items-center gap-2 mt-2">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs text-muted-foreground">Đang hoạt động</span>
                        </div>

                        {/* Quick Actions Row */}
                        <div className="flex items-center gap-8 mt-6">
                            <ActionButton icon={UserIcon} label="Trang cá nhân" />
                            <ActionButton icon={Bell} label="Tắt thông báo" />
                            <ActionButton icon={Search} label="Tìm kiếm" />
                        </div>
                    </div>

                    <div className="px-2 pb-6">
                        <Accordion type="multiple" defaultValue={['info', 'customize']} className="w-full">

                            <AccordionItem value="customize">
                                <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                                    Tùy chỉnh đoạn chat
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <div className="h-4 w-4 rounded-full border border-primary"></div>
                                        <div className="flex-1">
                                            <p className="font-medium">Đổi chủ đề</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <ImageIcon className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-medium">Thay đổi biểu tượng cảm xúc</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-medium">Chỉnh sửa biệt danh</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="info">
                                <AccordionTrigger className="px-2 text-sm font-semibold hover:no-underline">
                                    Thông tin cá nhân
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3 px-1">
                                        <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                            <Shield className="h-5 w-5 text-gray-500" />
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase">Vai trò</p>
                                                <p className="font-medium text-sm capitalize">{getRoleName(user.role)}</p>
                                            </div>
                                        </div>

                                        {user.email && (
                                            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                                <Mail className="h-5 w-5 text-gray-500" />
                                                <div className="overflow-hidden">
                                                    <p className="text-xs text-muted-foreground uppercase">Email</p>
                                                    <p className="font-medium text-sm truncate" title={user.email}>{user.email}</p>
                                                </div>
                                            </div>
                                        )}

                                        {user.phone && (
                                            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                                <Phone className="h-5 w-5 text-gray-500" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase">Số điện thoại</p>
                                                    <p className="font-medium text-sm">{user.phone}</p>
                                                </div>
                                            </div>
                                        )}
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
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                        <Ban className="h-5 w-5 text-gray-500" />
                                        <div className="flex-1">
                                            <p className="font-medium">Chặn</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        <div className="flex-1">
                                            <p className="font-medium">Báo cáo</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            )}
        </div>
    );
}
