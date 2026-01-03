import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { SchoolSummaryRecord, SortDirection } from "../types"
import { SchoolTable, SchoolSortField } from "../components/students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SchoolListPageProps {
    data: SchoolSummaryRecord[]
}

export function SchoolListPage({ data }: SchoolListPageProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearchTerm = useDebounce(searchTerm, 300)
    const [sortField, setSortField] = useState<SchoolSortField | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    const filteredAndSortedData = useMemo(() => {
        const lowerTerm = debouncedSearchTerm.toLowerCase()
        let result = data.filter(
            (item) =>
                item.school_name?.toLowerCase().includes(lowerTerm) ||
                item.province?.toLowerCase().includes(lowerTerm) ||
                item.level?.toLowerCase().includes(lowerTerm) ||
                item.type?.toLowerCase().includes(lowerTerm)
        )

        if (sortField && sortDirection) {
            result = [...result].sort((a, b) => {
                // @ts-ignore
                let aValue = a[sortField] || ""
                // @ts-ignore
                let bValue = b[sortField] || ""

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
    }, [data, debouncedSearchTerm, sortField, sortDirection])

    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredAndSortedData.slice(start, start + itemsPerPage)
    }, [filteredAndSortedData, currentPage])

    const handleSort = (field: SchoolSortField) => {
        setCurrentPage(1)
        if (sortField === field) {
            if (sortDirection === "asc") setSortDirection("desc")
            else if (sortDirection === "desc") {
                setSortDirection(null)
                setSortField(null)
            } else setSortDirection("asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">School Analytics</h1>
                <p className="text-muted-foreground">
                    Chi tiết hiệu suất và thông tin của hơn 20,000 trường học.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Danh sách Trường học Toàn quốc</CardTitle>
                            <CardDescription>Dữ liệu từ DEC29_school_summary.csv</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm trường, tỉnh..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <SchoolTable
                        data={paginatedData}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                    />

                    {/* Pagination */}
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
                </CardContent>
            </Card>
        </div>
    )
}
