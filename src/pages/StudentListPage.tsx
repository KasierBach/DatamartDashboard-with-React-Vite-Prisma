import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { AddRecordDialog } from "../components/AddRecordDialog"
import { EditRecordDialog } from "../components/EditRecordDialog"
import { StudentTable, StudentToolbar, SortField } from "../components/students"
import { DataRecord, SortDirection } from "../types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface StudentListPageProps {
    data: DataRecord[]
    onAdd: (record: DataRecord) => void
    onUpdate: (record: DataRecord) => void
    onDelete: (id: number) => void
    onRefresh: () => void
    onReset: () => void
    isRefreshing: boolean
}

export function StudentListPage({
    data,
    onAdd,
    onUpdate,
    onDelete,
    onRefresh,
    onReset,
    isRefreshing
}: StudentListPageProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearchTerm = useDebounce(searchTerm, 300)
    const [sortField, setSortField] = useState<SortField | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(null)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null)

    const existingIdsSet = useMemo(() => new Set(data.map(d => d.id)), [data])

    // Lọc và sắp xếp dữ liệu
    const filteredAndSortedData = useMemo(() => {
        const lowerTerm = debouncedSearchTerm.toLowerCase()
        let result = data.filter(
            (item) =>
                (item.id.toString().includes(lowerTerm) ||
                    item.student_uid?.toLowerCase().includes(lowerTerm) ||
                    item.school_name?.toLowerCase().includes(lowerTerm) ||
                    item.province_name?.toLowerCase().includes(lowerTerm) ||
                    item.grade?.toLowerCase().includes(lowerTerm) ||
                    item.level_name?.toLowerCase().includes(lowerTerm) ||
                    item.type_name?.toLowerCase().includes(lowerTerm) ||
                    item.year?.toString().includes(lowerTerm) ||
                    item.gpa_overall?.toString().includes(lowerTerm) ||
                    item.attendance_rate?.toString().includes(lowerTerm) ||
                    item.test_math?.toString().includes(lowerTerm) ||
                    item.test_literature?.toString().includes(lowerTerm) ||
                    item.test_average?.toString().includes(lowerTerm) ||
                    item.composite_score?.toString().includes(lowerTerm) ||
                    item.status?.toLowerCase().includes(lowerTerm) ||
                    item.lastUpdate?.toLowerCase().includes(lowerTerm)) &&
                (statusFilter === "all" || item.status === statusFilter)
        )

        if (sortField && sortDirection) {
            result = [...result].sort((a, b) => {
                // @ts-ignore - Dynamic key access with potential undefined values
                let aValue: string | number = a[sortField] || ""
                // @ts-ignore
                let bValue: string | number = b[sortField] || ""

                if (typeof aValue === "string" && typeof bValue === "string") {
                    aValue = aValue.toLowerCase()
                    bValue = bValue.toLowerCase()
                }

                if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
                if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
                return 0
            })
        }

        return result
    }, [data, debouncedSearchTerm, statusFilter, sortField, sortDirection])

    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredAndSortedData.slice(start, start + itemsPerPage)
    }, [filteredAndSortedData, currentPage])

    const handleSort = (field: SortField) => {
        setCurrentPage(1) // Reset to first page on sort
        if (sortField === field) {
            if (sortDirection === "asc") {
                setSortDirection("desc")
            } else if (sortDirection === "desc") {
                setSortDirection(null)
                setSortField(null)
            } else {
                setSortDirection("asc")
            }
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const handleOpenEdit = (record: DataRecord) => {
        setEditingRecord(record)
        setIsEditDialogOpen(true)
    }

    const handleSaveEdit = (updatedRecord: DataRecord) => {
        onUpdate(updatedRecord)
        setEditingRecord(null)
    }

    // Xuất dữ liệu ra file CSV
    const handleExport = () => {
        const headers = ["ID", "Student UID", "School", "Province", "Grade", "Level", "Type", "GPA", "Math", "Lit", "Composite", "Status", "Last Update"]
        const csvContent = [
            headers.join(","),
            ...filteredAndSortedData.map(item =>
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
        link.style.visibility = "hidden"

        toast.success("Xuất dữ liệu thành công!", {
            description: `Đã xuất ${filteredAndSortedData.length} records ra file CSV.`
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
                        searchTerm={searchTerm}
                        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                        statusFilter={statusFilter}
                        onFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onRefresh={onRefresh}
                        onReset={onReset}
                        onExport={handleExport}
                        onAdd={() => setIsAddDialogOpen(true)}
                        isRefreshing={isRefreshing}
                    />

                    <div className="mt-6">
                        <StudentTable
                            data={paginatedData}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            onEdit={handleOpenEdit}
                            onDelete={onDelete}
                        />
                    </div>

                    {/* Pagination Controls */}
                    <div className="mt-6 flex items-center justify-between border-t border-muted pt-4">
                        <div className="text-sm text-muted-foreground">
                            Trang {currentPage} / {totalPages || 1} (Hiển thị {paginatedData.length} / {filteredAndSortedData.length} kết quả)
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>

                    {/* Pagination Info */}
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Hiển thị {filteredAndSortedData.length} / {data.length} records
                            {searchTerm && ` (tìm: "${searchTerm}")`}
                            {statusFilter !== "all" && ` (lọc: ${statusFilter})`}
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

