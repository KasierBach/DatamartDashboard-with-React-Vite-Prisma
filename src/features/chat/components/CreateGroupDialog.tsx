import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./UserAvatar";
import { Search, Users, Loader2 } from "lucide-react";
import type { User } from '../types';

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
    currentUserId: number | null;
    availableUsers: User[];
    onCreateGroup: (name: string, memberIds: number[]) => Promise<void>;
}

export function CreateGroupDialog({
    open,
    onClose,
    currentUserId,
    availableUsers,
    onCreateGroup
}: CreateGroupDialogProps) {
    const [name, setName] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const filteredUsers = availableUsers.filter(u =>
        u.id !== currentUserId &&
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleMember = (userId: number) => {
        setSelectedMemberIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!name.trim() || selectedMemberIds.length === 0) return;

        setIsLoading(true);
        try {
            await onCreateGroup(name, selectedMemberIds);
            handleClose();
        } catch (error) {
            console.error('Failed to create group:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setSelectedMemberIds([]);
        setSearchQuery('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Tạo nhóm chat mới
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col px-6 py-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Tên nhóm</Label>
                        <Input
                            id="group-name"
                            placeholder="Nhập tên nhóm..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                        <Label>Thành viên ({selectedMemberIds.length})</Label>

                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm thành viên..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="flex-1 border rounded-md p-2 mt-2">
                            <div className="space-y-2">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                                        onClick={() => toggleMember(user.id)}
                                    >
                                        <div className="flex items-center justify-center w-5 h-5">
                                            <input
                                                type="checkbox"
                                                id={`user-${user.id}`}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={selectedMemberIds.includes(user.id)}
                                                onChange={() => toggleMember(user.id)}
                                            />
                                        </div>
                                        <UserAvatar user={user} className="h-8 w-8" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate">{user.name || user.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        Không tìm thấy thành viên
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim() || selectedMemberIds.length === 0}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Tạo nhóm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
