import { X, Mail, Phone, Shield, User as UserIcon } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import type { User } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserProfileSidebarProps {
    user: User | null;
    open: boolean;
    onClose: () => void;
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

export function UserProfileSidebar({ user, open, onClose }: UserProfileSidebarProps) {
    return (
        <div
            className={cn(
                "fixed inset-y-0 right-0 z-50 w-80 bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out",
                open ? "translate-x-0" : "translate-x-full"
            )}
        >
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold text-lg">Thông tin</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                {user && (
                    <ScrollArea className="flex-1 p-4">
                        <div className="flex flex-col items-center py-6 gap-4">
                            <UserAvatar user={user} className="h-24 w-24 text-2xl" />

                            <div className="text-center">
                                <h2 className="text-xl font-bold">{user.name || user.username}</h2>
                                <p className="text-muted-foreground">@{user.username}</p>
                            </div>

                            <div className="w-full grid gap-2 mt-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase">Vai trò</p>
                                        <p className="font-medium capitalize">{getRoleName(user.role)}</p>
                                    </div>
                                </div>

                                {user.email && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase">Email</p>
                                            <p className="font-medium break-all">{user.email}</p>
                                        </div>
                                    </div>
                                )}

                                {user.phone && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase">Số điện thoại</p>
                                            <p className="font-medium">{user.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {!user.email && !user.phone && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                        <UserIcon className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase">Thông tin thêm</p>
                                            <p className="font-medium text-sm text-muted-foreground">Chưa cập nhật thông tin liên hệ</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
