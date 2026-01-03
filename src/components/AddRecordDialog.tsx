import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { DataRecord } from "../types"

interface AddRecordDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (record: DataRecord) => void
    existingIds: Set<number>
}

export function AddRecordDialog({ isOpen, onOpenChange, onAdd, existingIds }: AddRecordDialogProps) {
    const initialNewRecordState = {
        id: "",
        student_uid: "",
        school_name: "",
        province_name: "",
        level_name: "",
        type_name: "",
        grade: "",
        year: new Date().getFullYear().toString(),
        academic_tier: "Tier 1",
        gpa_overall: "",
        test_math: "",
        test_literature: "",
        attendance_rate: "100",
        status: "active" as "active" | "inactive" | "pending"
    }
    const [newRecord, setNewRecord] = useState(initialNewRecordState)

    const handleAddRecord = () => {
        if (!newRecord.school_name || !newRecord.test_math || !newRecord.test_literature) {
            toast.error("Vui lòng điền các thông tin bắt buộc!")
            return
        }

        const defaultId = existingIds.size > 0 ? Array.from(existingIds).reduce((max, id) => Math.max(max, id), 0) + 1 : 1
        const parsedId = newRecord.id ? parseInt(newRecord.id) : NaN
        const newId = !isNaN(parsedId) && parsedId > 0 ? parsedId : defaultId

        if (existingIds.has(newId)) {
            toast.error("ID đã tồn tại!", {
                description: `Record với ID #${newId} đã có trong danh sách.`
            })
            return
        }

        const record: DataRecord = {
            id: newId,
            student_uid: newRecord.student_uid,
            school_name: newRecord.school_name,
            province_name: newRecord.province_name,
            level_name: newRecord.level_name,
            type_name: newRecord.type_name,
            grade: newRecord.grade,
            year: parseInt(newRecord.year) || 0,
            attendance_rate: (parseFloat(newRecord.attendance_rate) || 0) / 100,
            academic_tier: newRecord.academic_tier,
            gpa_overall: parseFloat(newRecord.gpa_overall) || 0,
            test_math: parseFloat(newRecord.test_math) || 0,
            test_literature: parseFloat(newRecord.test_literature) || 0,
            test_average: (parseFloat(newRecord.test_math) + parseFloat(newRecord.test_literature)) / 2,
            composite_score: (parseFloat(newRecord.test_math) + parseFloat(newRecord.test_literature)) / 2,
            status: newRecord.status,
            lastUpdate: new Date().toISOString().split('T')[0]
        }

        onAdd(record)
        setNewRecord(initialNewRecordState)
        onOpenChange(false)
        toast.success("Đã thêm record mới!", {
            description: `Student ID: ${record.id} đã được thêm vào danh sách.`
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Thêm Học Sinh Mới</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin học sinh và điểm số.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="uid">Mã Học Sinh (UID)</Label>
                        <Input
                            id="uid"
                            value={newRecord.student_uid}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, student_uid: e.target.value }))}
                            placeholder="e.g. STU12345"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="id">ID Hệ Thống (Auto-generate)</Label>
                        <Input
                            id="id"
                            type="number"
                            value={newRecord.id}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, id: e.target.value }))}
                            placeholder="Tự động"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="school">Tên Trường</Label>
                        <Input
                            id="school"
                            value={newRecord.school_name}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, school_name: e.target.value }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="province">Tỉnh/Thành</Label>
                        <Input
                            id="province"
                            value={newRecord.province_name}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, province_name: e.target.value }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="level">Cấp Học</Label>
                        <Input
                            id="level"
                            value={newRecord.level_name}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, level_name: e.target.value }))}
                            placeholder="THPT, THCS..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Loại Trường</Label>
                        <Input
                            id="type"
                            value={newRecord.type_name}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, type_name: e.target.value }))}
                            placeholder="Công lập, Dân lập..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="grade">Khối Lớp</Label>
                        <Input
                            id="grade"
                            value={newRecord.grade}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, grade: e.target.value }))}
                            placeholder="10, 11, 12..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="year">Năm Học</Label>
                        <Input
                            id="year"
                            type="number"
                            value={newRecord.year}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, year: e.target.value }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="attendance">Tỉ Lệ Chuyên Cần (%)</Label>
                        <Input
                            id="attendance"
                            type="number"
                            min="0"
                            max="100"
                            value={newRecord.attendance_rate}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, attendance_rate: e.target.value }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tier">Xếp loại (Tier)</Label>
                        <Select value={newRecord.academic_tier} onValueChange={(v) => setNewRecord(prev => ({ ...prev, academic_tier: v }))}>
                            <SelectTrigger id="tier"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tier 1">Tier 1 (Giỏi)</SelectItem>
                                <SelectItem value="Tier 2">Tier 2 (Khá)</SelectItem>
                                <SelectItem value="Tier 3">Tier 3 (TB)</SelectItem>
                                <SelectItem value="Tier 4">Tier 4 (Yếu)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="gpa">Điểm GPA Tổng</Label>
                        <Input
                            id="gpa"
                            type="number"
                            step="0.1"
                            value={newRecord.gpa_overall}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, gpa_overall: e.target.value }))}
                        />
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="math">Điểm Toán</Label>
                            <Input
                                id="math"
                                type="number"
                                step="0.1"
                                value={newRecord.test_math}
                                onChange={(e) => setNewRecord(prev => ({ ...prev, test_math: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reading">Điểm Văn</Label>
                            <Input
                                id="reading"
                                type="number"
                                step="0.1"
                                value={newRecord.test_literature}
                                onChange={(e) => setNewRecord(prev => ({ ...prev, test_literature: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2 col-span-2">
                        <Label htmlFor="status">Trạng Thái</Label>
                        <Select
                            value={newRecord.status}
                            onValueChange={(value: "active" | "inactive" | "pending") =>
                                setNewRecord(prev => ({ ...prev, status: value }))
                            }
                        >
                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={handleAddRecord}>Thêm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
