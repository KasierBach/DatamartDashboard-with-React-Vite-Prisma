import { useState, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { ProvinceSummaryRecord, SortDirection } from "../types"
import { ProvinceTable, ProvinceSortField } from "../components/students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ProvinceListPageProps {
    data: ProvinceSummaryRecord[]
}

export function ProvinceListPage({ data }: ProvinceListPageProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearchTerm = useDebounce(searchTerm, 300)
    const [sortField, setSortField] = useState<ProvinceSortField | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(null)

    const filteredAndSortedData = useMemo(() => {
        const lowerTerm = debouncedSearchTerm.toLowerCase()
        let result = data.filter(
            (item) =>
                item.province?.toLowerCase().includes(lowerTerm) ||
                item.level?.toLowerCase().includes(lowerTerm)
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

    const handleSort = (field: ProvinceSortField) => {
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
                <h1 className="text-3xl font-bold tracking-tight">Province Analytics</h1>
                <p className="text-muted-foreground">
                    Thống kê chi tiết hiệu suất giáo dục theo từng Tỉnh thành.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Bảng Tổng hợp Vùng miền</CardTitle>
                            <CardDescription>Dữ liệu từ DEC29_province_summary.csv</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm tỉnh..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProvinceTable
                        data={filteredAndSortedData}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                    />
                    <div className="mt-4 text-sm text-muted-foreground">
                        Hiển thị {filteredAndSortedData.length} kết quả
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
