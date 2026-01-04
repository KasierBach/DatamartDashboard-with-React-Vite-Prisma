import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Trash2,
    Pencil,
} from "lucide-react"
import { DataRecord, SortDirection } from "@/types"

export type SortField = "id" | "student_uid" | "school_name" | "province_name" | "grade" | "level_name" | "type_name" | "year" | "attendance_rate" | "academic_tier" | "gpa_overall" | "test_math" | "test_literature" | "test_average" | "composite_score" | "status" | "lastUpdate"

interface StudentTableProps {
    data: DataRecord[]
    sortField: SortField | null
    sortDirection: SortDirection
    onSort: (field: SortField) => void
    onEdit: (record: DataRecord) => void
    onDelete: (id: number) => void
}

export function StudentTable({
    data,
    sortField,
    sortDirection,
    onSort,
    onEdit,
    onDelete
}: StudentTableProps) {

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />
        }
        if (sortDirection === "asc") {
            return <ArrowUp className="ml-2 h-4 w-4" />
        }
        if (sortDirection === "desc") {
            return <ArrowDown className="ml-2 h-4 w-4" />
        }
        return <ArrowUpDown className="ml-2 h-4 w-4" />
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                        Active
                    </Badge>
                )
            case "inactive":
                return <Badge className="bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 border-zinc-500/20">Inactive</Badge>
            case "pending":
                return (
                    <Badge className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20">Pending</Badge>
                )
            default:
                return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="relative overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16 cursor-pointer hover:bg-muted/50" onClick={() => onSort("id")}>
                            <div className="flex items-center">ID {getSortIcon("id")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("student_uid")}>
                            <div className="flex items-center">Mã HS {getSortIcon("student_uid")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("school_name")}>
                            <div className="flex items-center">Trường {getSortIcon("school_name")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("province_name")}>
                            <div className="flex items-center">Tỉnh {getSortIcon("province_name")}</div>
                        </TableHead>
                        <TableHead className="w-20 cursor-pointer hover:bg-muted/50" onClick={() => onSort("grade")}>
                            <div className="flex items-center">Khối {getSortIcon("grade")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("level_name")}>
                            <div className="flex items-center">Cấp {getSortIcon("level_name")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("type_name")}>
                            <div className="flex items-center">Loại {getSortIcon("type_name")}</div>
                        </TableHead>
                        <TableHead className="w-20 cursor-pointer hover:bg-muted/50" onClick={() => onSort("year")}>
                            <div className="flex items-center">Năm {getSortIcon("year")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("attendance_rate")}>
                            <div className="flex items-center justify-end">C.Cần {getSortIcon("attendance_rate")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("gpa_overall")}>
                            <div className="flex items-center justify-end">GPA {getSortIcon("gpa_overall")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("test_math")}>
                            <div className="flex items-center justify-end">Toán {getSortIcon("test_math")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("test_literature")}>
                            <div className="flex items-center justify-end">Văn {getSortIcon("test_literature")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("composite_score")}>
                            <div className="flex items-center justify-end">TH {getSortIcon("composite_score")}</div>
                        </TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={14} className="h-24 text-center">
                                Không tìm thấy kết quả.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} className="group">
                                <TableCell className="font-mono text-[10px] text-muted-foreground">{item.id}</TableCell>
                                <TableCell className="font-mono text-xs font-semibold">{item.student_uid || 'N/A'}</TableCell>
                                <TableCell className="text-xs">{item.school_name || 'N/A'}</TableCell>
                                <TableCell className="text-xs">{item.province_name || 'N/A'}</TableCell>
                                <TableCell className="text-xs font-bold">{item.grade || 'N/A'}</TableCell>
                                <TableCell className="text-[10px] uppercase">{item.level_name || 'N/A'}</TableCell>
                                <TableCell className="text-[10px] whitespace-nowrap">{item.type_name || 'N/A'}</TableCell>
                                <TableCell className="text-xs">{item.year || 'N/A'}</TableCell>
                                <TableCell className="text-right text-xs font-medium text-amber-600">
                                    {item.attendance_rate ? `${item.attendance_rate.toFixed(1)}%` : '0%'}
                                </TableCell>
                                <TableCell className="text-right font-bold text-blue-600">{(item.gpa_overall || 0).toFixed(1)}</TableCell>
                                <TableCell className="text-right font-medium text-xs">{(item.test_math || 0).toFixed(1)}</TableCell>
                                <TableCell className="text-right font-medium text-xs">{(item.test_literature || 0).toFixed(1)}</TableCell>
                                <TableCell className="text-right font-bold text-emerald-600">{(item.composite_score || 0).toFixed(2)}</TableCell>
                                <TableCell>{getStatusBadge(item.status || 'active')}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bạn có chắc muốn xóa record #{item.id}?
                                                        Hành động này không thể hoàn tác.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => onDelete(item.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Xóa
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
