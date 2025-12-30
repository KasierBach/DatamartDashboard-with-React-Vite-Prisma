import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { API_ENDPOINTS } from "@/config/api"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Camera } from "lucide-react"
import { UserAvatar } from "@/features/chat/components/UserAvatar"
import { useRef } from "react"

interface ProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
    const { user, updateUser } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(user?.name || "")
    const [email, setEmail] = useState(user?.email || "")
    const [phone, setPhone] = useState(user?.phone || "")
    const [avatar, setAvatar] = useState(user?.avatar || "")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync form with user data when dialog opens
    useEffect(() => {
        if (open && user) {
            setName(user.name || "")
            setEmail(user.email || "")
            setPhone(user.phone || "")
            setAvatar(user.avatar || "")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        }
    }, [open, user])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(API_ENDPOINTS.UPLOAD, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Upload failed')
            const data = await response.json()
            setAvatar(data.url)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Tải ảnh thất bại')
        } finally {
            setIsUploading(false)
        }
    }

    if (!user) return null

    const handleSave = async () => {
        setIsLoading(true)

        // Validate basic fields
        if (!name.trim()) {
            toast.error("Họ tên không được để trống")
            setIsLoading(false)
            return
        }

        // Validate password change
        if (newPassword || currentPassword) {
            if (!currentPassword) {
                toast.error("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu")
                setIsLoading(false)
                return
            }
            if (newPassword !== confirmPassword) {
                toast.error("Mật khẩu mới không khớp")
                setIsLoading(false)
                return
            }
        }

        try {
            const body: any = {
                name,
                email,
                phone,
                avatar,
            }

            if (newPassword) {
                body.currentPassword = currentPassword
                body.newPassword = newPassword
            }

            const response = await fetch(`${API_ENDPOINTS.USERS}/${user.username}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to update profile")
            }

            // Update local context
            updateUser(data.user)

            toast.success(data.message)

            // Clear passwords
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")

            onOpenChange(false)
        } catch (error: any) {
            console.error("Update profile error:", error)
            toast.error(error.message || "Cập nhật thất bại")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cập nhật thông tin</DialogTitle>
                    <DialogDescription>
                        Chỉnh sửa thông tin cá nhân của bạn tại đây.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-row items-center justify-center gap-6 mb-4">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UserAvatar
                                user={{ ...user, avatar: avatar } as any}
                                className="h-24 w-24 text-3xl ring-2 ring-border shadow-sm"
                                size="lg"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                                <Camera className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-10">
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full ring-2 ring-background shadow-sm hover:scale-110 transition-transform">
                                <Camera className="h-3.5 w-3.5" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-lg">{name || user.username}</span>
                            <p className="text-xs text-muted-foreground mt-1 cursor-pointer hover:text-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                                Nhấn vào ảnh để thay đổi
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Username
                        </Label>
                        <Input
                            id="username"
                            value={user.username}
                            disabled
                            className="col-span-3 bg-muted"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Họ tên
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            SĐT
                        </Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-medium mb-3 text-muted-foreground">Đổi mật khẩu (Tuỳ chọn)</p>
                        <div className="grid gap-3">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="current-pass" className="text-right text-xs">
                                    Mật khẩu cũ
                                </Label>
                                <Input
                                    id="current-pass"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="col-span-3 h-8 text-sm"
                                    placeholder="Chỉ nhập nếu muốn đổi pass"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-pass" className="text-right text-xs">
                                    Mật khẩu mới
                                </Label>
                                <Input
                                    id="new-pass"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="col-span-3 h-8 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="confirm-pass" className="text-right text-xs">
                                    Xác nhận
                                </Label>
                                <Input
                                    id="confirm-pass"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="col-span-3 h-8 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
