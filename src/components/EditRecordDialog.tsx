import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { DataRecord } from "../types"

interface EditRecordDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    record: DataRecord | null
    onSave: (record: DataRecord) => void
    existingIds: Set<number>
}

export function EditRecordDialog({ isOpen, onOpenChange, record, onSave, existingIds }: EditRecordDialogProps) {
    const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null)

    useEffect(() => {
        setEditingRecord(record)
    }, [record, isOpen])

    const handleSaveEdit = () => {
        if (!editingRecord) return

        if (!editingRecord.id || !editingRecord.school_name) {
            toast.error("Vui lòng nhập các thông tin bắt buộc!")
            return
        }

        // Check if ID changed and is unique (excluding the current record's original ID if passible, but here relying on current ID check)
        // NOTE: In App.tsx logic: "If editingRecord.id !== originalId && data.some(d => d.id === editingRecord.id)"
        // Since we don't pass 'originalId' explicitly separately, use the record prop.

        if (record && editingRecord.id !== record.id && existingIds.has(editingRecord.id)) {
            toast.error("ID đã tồn tại!", {
                description: `Record với ID #${editingRecord.id} đã có trong danh sách.`
            })
            return
        }

        onSave({
            ...editingRecord,
            attendance_rate: editingRecord.attendance_rate !== undefined ? editingRecord.attendance_rate / 100 : undefined,
            composite_score: ((editingRecord.test_math || 0) + (editingRecord.test_literature || 0)) / 2,
            lastUpdate: new Date().toISOString().split('T')[0]
        })

        onOpenChange(false)
        toast.success("Đã cập nhật record!", {
            description: `Học sinh UID: ${editingRecord.student_uid || editingRecord.id} đã được cập nhật.`
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa Học Sinh</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin cho record #{record?.id} {record?.student_uid && `(${record.student_uid})`}
                    </DialogDescription>
                </DialogHeader>
                {editingRecord && (
                    <div className="grid gap-4 py-4 grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-uid">Mã Học Sinh (UID)</Label>
                            <Input
                                id="edit-uid"
                                value={editingRecord.student_uid || ''}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, student_uid: e.target.value } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-id">ID Hệ Thống (Không nên sửa)</Label>
                            <Input
                                id="edit-id"
                                type="number"
                                value={editingRecord.id}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, id: parseInt(e.target.value) || 0 } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-school">Tên Trường</Label>
                            <Input
                                id="edit-school"
                                value={editingRecord.school_name || ''}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, school_name: e.target.value } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-province">Tỉnh/Thành</Label>
                            <Input
                                id="edit-province"
                                value={editingRecord.province_name || ''}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, province_name: e.target.value } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-level">Cấp Học</Label>
                            <Input
                                id="edit-level"
                                value={editingRecord.level_name || ''}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, level_name: e.target.value } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type">Loại Trường</Label>
                            <Input
                                id="edit-type"
                                value={editingRecord.type_name || ''}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, type_name: e.target.value } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-grade">Khối Lớp</Label>
                            <Input
                                id="edit-grade"
                                value={editingRecord.grade || ''}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, grade: e.target.value } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-year">Năm Học</Label>
                            <Input
                                id="edit-year"
                                type="number"
                                value={editingRecord.year || ''}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, year: parseInt(e.target.value) || 0 } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-attendance">Tỉ Lệ Chuyên Cần (%)</Label>
                            <Input
                                id="edit-attendance"
                                type="number"
                                min="0"
                                max="100"
                                value={editingRecord.attendance_rate !== undefined ? Math.round(editingRecord.attendance_rate * 100) : 100}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, attendance_rate: parseFloat(e.target.value) } : null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-tier">Xếp loại (Tier)</Label>
                            <Select value={editingRecord.academic_tier} onValueChange={(v) => setEditingRecord(prev => prev ? { ...prev, academic_tier: v } : null)}>
                                <SelectTrigger id="edit-tier"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Tier 1">Tier 1</SelectItem>
                                    <SelectItem value="Tier 2">Tier 2</SelectItem>
                                    <SelectItem value="Tier 3">Tier 3</SelectItem>
                                    <SelectItem value="Tier 4">Tier 4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-gpa">GPA</Label>
                            <Input
                                id="edit-gpa"
                                type="number"
                                step="0.1"
                                value={editingRecord.gpa_overall || 0}
                                onChange={(e) => setEditingRecord(prev => prev ? { ...prev, gpa_overall: parseFloat(e.target.value) || 0 } : null)}
                            />
                        </div>
                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-math">Điểm Toán</Label>
                                <Input
                                    id="edit-math"
                                    type="number"
                                    step="0.1"
                                    value={editingRecord.test_math || 0}
                                    onChange={(e) => setEditingRecord(prev => prev ? { ...prev, test_math: parseFloat(e.target.value) || 0 } : null)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-reading">Điểm Văn</Label>
                                <Input
                                    id="edit-reading"
                                    type="number"
                                    step="0.1"
                                    value={editingRecord.test_literature || 0}
                                    onChange={(e) => setEditingRecord(prev => prev ? { ...prev, test_literature: parseFloat(e.target.value) || 0 } : null)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="edit-status">Trạng Thái</Label>
                            <Select
                                value={editingRecord.status}
                                onValueChange={(value: "active" | "inactive" | "pending") =>
                                    setEditingRecord(prev => prev ? { ...prev, status: value } : null)
                                }
                            >
                                <SelectTrigger id="edit-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSaveEdit}>
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
