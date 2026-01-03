import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { SchoolSummaryRecord, SortDirection } from "@/types"

export type SchoolSortField = "id" | "school_name" | "province" | "level" | "type" | "total_students" | "avg_gpa" | "avg_composite_score"

interface SchoolTableProps {
    data: SchoolSummaryRecord[]
    sortField: SchoolSortField | null
    sortDirection: SortDirection
    onSort: (field: SchoolSortField) => void
}

export function SchoolTable({
    data,
    sortField,
    sortDirection,
    onSort
}: SchoolTableProps) {

    const getSortIcon = (field: SchoolSortField) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
        if (sortDirection === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
        if (sortDirection === "desc") return <ArrowDown className="ml-2 h-4 w-4" />
        return <ArrowUpDown className="ml-2 h-4 w-4" />
    }

    return (
        <div className="relative overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 cursor-pointer hover:bg-muted/50" onClick={() => onSort("id")}>
                            <div className="flex items-center">ID {getSortIcon("id")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("school_name")}>
                            <div className="flex items-center">Tên Trường {getSortIcon("school_name")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("province")}>
                            <div className="flex items-center">Tỉnh thành {getSortIcon("province")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("level")}>
                            <div className="flex items-center">Cấp học {getSortIcon("level")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("type")}>
                            <div className="flex items-center">Loại hình {getSortIcon("type")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("total_students")}>
                            <div className="flex items-center justify-end">Học sinh {getSortIcon("total_students")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("avg_gpa")}>
                            <div className="flex items-center justify-end">GPA TB {getSortIcon("avg_gpa")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("avg_composite_score")}>
                            <div className="flex items-center justify-end">Tổng hợp TB {getSortIcon("avg_composite_score")}</div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                Không tìm thấy kết quả.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} className="group">
                                <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                                <TableCell className="font-bold text-xs max-w-[200px] truncate">{item.school_name || 'N/A'}</TableCell>
                                <TableCell className="text-xs">{item.province || 'N/A'}</TableCell>
                                <TableCell className="text-xs">
                                    <Badge variant="secondary" className="text-[10px]">{item.level || 'N/A'}</Badge>
                                </TableCell>
                                <TableCell className="text-xs">{item.type || 'N/A'}</TableCell>
                                <TableCell className="text-right text-xs">{item.total_students?.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-bold text-blue-600 text-xs">{(item.avg_gpa || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold text-emerald-600 text-xs">{(item.avg_composite_score || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
