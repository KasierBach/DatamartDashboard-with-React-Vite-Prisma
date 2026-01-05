import { useState, useMemo, useEffect } from "react"
import { AddRecordDialog } from "../components/AddRecordDialog"
import { EditRecordDialog } from "../components/EditRecordDialog"
import { StudentTable, StudentToolbar, SortField } from "../components/students"
import { DataRecord, SortDirection } from "../types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface StudentListPageProps {
    data: DataRecord[]
    total: number
    page: number
    limit: number
    search: string
    sortField: string
    sortOrder: string
    status: string
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
    onSearchChange: (search: string) => void
    onSortChange: (field: string, order: string) => void
    onStatusChange: (status: string) => void
    onAdd: (record: DataRecord) => void
    onUpdate: (record: DataRecord) => void
    onDelete: (id: number) => void
    onRefresh: () => void
    onReset: () => void
    isRefreshing: boolean
}

export function StudentListPage({
    data,
    total,
    page,
    limit,
    search,
    sortField,
    sortOrder,
    status,
    onPageChange,
    onLimitChange,
    onSearchChange,
    onSortChange,
    onStatusChange,
    onAdd,
    onUpdate,
    onDelete,
    onRefresh,
    onReset,
    isRefreshing
}: StudentListPageProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null)
    const [jumpValue, setJumpValue] = useState(page.toString())

    // Sync jumpValue when page changes from external (Next/Prev)
    useEffect(() => {
        setJumpValue(page.toString())
    }, [page])

    const existingIdsSet = useMemo(() => new Set(data.map(d => (d.id as number))), [data])

    const handleSort = (field: SortField) => {
        let newOrder: string = 'asc';
        if (sortField === field) {
            newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        }
        onSortChange(field, newOrder);
    }

    const handleOpenEdit = (record: DataRecord) => {
        setEditingRecord(record)
        setIsEditDialogOpen(true)
    }

    const handleSaveEdit = (updatedRecord: DataRecord) => {
        onUpdate(updatedRecord)
        setEditingRecord(null)
    }

    const handleExport = () => {
        toast.info("Tải một file lớn có thể chậm. Chức năng xuất tất cả 58k dòng nên được thực hiện ở Server.")
        const headers = ["ID", "Student UID", "School", "Province", "Grade", "Level", "Type", "GPA", "Math", "Lit", "Composite", "Status", "Last Update"]
        const csvContent = [
            headers.join(","),
            ...data.map(item =>
                [
                    item.id,
                    `"${item.student_uid || ""}"`,
                    `"${item.school_name || ""}"`,
                    `"${item.province_name || ""}"`,
                    `"${item.grade || ""}"`,
                    `"${item.level_name || ""}"`,
                    `"${item.type_name || ""}"`,
                    item.gpa_overall || 0,
                    item.test_math || 0,
                    item.test_literature || 0,
                    item.composite_score || 0,
                    item.status,
                    item.lastUpdate
                ].join(",")
            )
        ].join("\n")

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `student_performance_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("Xuất dữ liệu thành công!", {
            description: `Đã xuất ${data.length} records ra file CSV.`
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
                <p className="text-muted-foreground">
                    Quản lý danh sách, chỉnh sửa và theo dõi điểm số chi tiết.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Performance Table</CardTitle>
                            <CardDescription>Chi tiết điểm số học sinh</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <StudentToolbar
                        searchTerm={search}
                        onSearchChange={(val) => { onSearchChange(val); onPageChange(1); }}
                        statusFilter={status}
                        onFilterChange={(val) => { onStatusChange(val); onPageChange(1); }}
                        onRefresh={onRefresh}
                        onReset={onReset}
                        onExport={handleExport}
                        onAdd={() => setIsAddDialogOpen(true)}
                        isRefreshing={isRefreshing}
                    />

                    <div className="mt-6">
                        <StudentTable
                            data={data}
                            sortField={sortField as SortField}
                            sortDirection={sortOrder as SortDirection}
                            onSort={handleSort}
                            onEdit={handleOpenEdit}
                            onDelete={onDelete}
                        />
                    </div>

                    {/* Pagination Controls */}
                    <div className="mt-6 flex items-center justify-between border-t border-muted pt-4">
                        <div className="text-sm text-muted-foreground">
                            Trang {page} / {Math.ceil(total / limit) || 1} (Hiển thị {data.length} / {total} kết quả)
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 mx-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Tới trang:</span>
                                <Input
                                    type="number"
                                    min={1}
                                    max={Math.ceil(total / limit)}
                                    className="w-16 h-8 text-xs px-2"
                                    value={jumpValue}
                                    onChange={(e) => setJumpValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            let val = parseInt(jumpValue);
                                            const maxPage = Math.ceil(total / limit) || 1;
                                            if (isNaN(val)) {
                                                setJumpValue(page.toString());
                                                return;
                                            }
                                            if (val < 1) val = 1;
                                            if (val > maxPage) val = maxPage;

                                            onPageChange(val);
                                            setJumpValue(val.toString());
                                        }
                                    }}
                                    onBlur={() => {
                                        let val = parseInt(jumpValue);
                                        const maxPage = Math.ceil(total / limit) || 1;
                                        if (isNaN(val)) {
                                            setJumpValue(page.toString());
                                            return;
                                        }
                                        if (val < 1) val = 1;
                                        if (val > maxPage) val = maxPage;

                                        onPageChange(val);
                                        setJumpValue(val.toString());
                                    }}
                                />
                            </div>
                            <select
                                className="text-xs border rounded p-1"
                                value={limit}
                                onChange={(e) => onLimitChange(Number(e.target.value))}
                            >
                                <option value={10}>10 dòng</option>
                                <option value={20}>20 dòng</option>
                                <option value={50}>50 dòng</option>
                                <option value={100}>100 dòng</option>
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(Math.max(1, page - 1))}
                                disabled={page === 1}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(Math.min(Math.ceil(total / limit), page + 1))}
                                disabled={page === Math.ceil(total / limit) || total === 0}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>

                    {/* Pagination Info */}
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Dữ liệu tải từ máy chủ: {total.toLocaleString()} records tổng cộng.
                            {search && ` (tìm: "${search}")`}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AddRecordDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAdd={onAdd}
                existingIds={existingIdsSet}
            />

            <EditRecordDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                record={editingRecord}
                onSave={handleSaveEdit}
                existingIds={existingIdsSet}
            />
        </div>
    )
}

