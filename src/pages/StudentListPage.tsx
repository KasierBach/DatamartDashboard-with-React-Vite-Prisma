import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { DataRecord } from "../types"
import { AddRecordDialog } from "../components/AddRecordDialog"
import { EditRecordDialog } from "../components/EditRecordDialog"
import { StudentTable, StudentToolbar, SortField, SortDirection } from "../components/students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<DataRecord | null>(null)

    const existingIds = useMemo(() => data.map(d => d.id), [data])

    // Lọc và sắp xếp dữ liệu
    const filteredAndSortedData = useMemo(() => {
        const lowerTerm = debouncedSearchTerm.toLowerCase()
        let result = data.filter(
            (item) =>
                (item.id.toString().includes(lowerTerm) ||
                    item.gender?.toLowerCase().includes(lowerTerm) ||
                    item.race_ethnicity?.toLowerCase().includes(lowerTerm) ||
                    item.parental_education?.toLowerCase().includes(lowerTerm) ||
                    item.math?.toLowerCase().includes(lowerTerm) ||
                    item.math_score?.toString().includes(lowerTerm) ||
                    item.reading?.toLowerCase().includes(lowerTerm) ||
                    item.reading_score?.toString().includes(lowerTerm) ||
                    item.writing?.toLowerCase().includes(lowerTerm) ||
                    item.writing_score?.toString().includes(lowerTerm) ||
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

    const handleSort = (field: SortField) => {
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
        const headers = ["ID", "Gender", "Race/Ethnicity", "Parental Education", "Math Label", "Math Score", "Reading Label", "Reading Score", "Writing Label", "Writing Score", "Status", "Last Update"]
        const csvContent = [
            headers.join(","),
            ...filteredAndSortedData.map(item =>
                [
                    item.id,
                    item.gender || "",
                    `"${item.race_ethnicity || ""}"`,
                    `"${item.parental_education || ""}"`,
                    item.math || "",
                    item.math_score || 0,
                    item.reading || "",
                    item.reading_score || 0,
                    item.writing || "",
                    item.writing_score || 0,
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
                        onSearchChange={setSearchTerm}
                        statusFilter={statusFilter}
                        onFilterChange={setStatusFilter}
                        onRefresh={onRefresh}
                        onReset={onReset}
                        onExport={handleExport}
                        onAdd={() => setIsAddDialogOpen(true)}
                        isRefreshing={isRefreshing}
                    />

                    <div className="mt-6">
                        <StudentTable
                            data={filteredAndSortedData}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            onEdit={handleOpenEdit}
                            onDelete={onDelete}
                        />
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
                existingIds={existingIds}
            />

            <EditRecordDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                record={editingRecord}
                onSave={handleSaveEdit}
                existingIds={existingIds}
            />
        </div>
    )
}

