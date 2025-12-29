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
import { DataRecord } from "@/types"

export type SortField = "id" | "gender" | "race_ethnicity" | "parental_education" | "math_score" | "reading_score" | "writing_score" | "status" | "lastUpdate"
export type SortDirection = "asc" | "desc" | null

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
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("gender")}>
                            <div className="flex items-center">Gender {getSortIcon("gender")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("race_ethnicity")}>
                            <div className="flex items-center">Race/Ethnicity {getSortIcon("race_ethnicity")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("parental_education")}>
                            <div className="flex items-center">Parental Edu {getSortIcon("parental_education")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("math_score")}>
                            <div className="flex items-center justify-end">Math {getSortIcon("math_score")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("reading_score")}>
                            <div className="flex items-center justify-end">Reading {getSortIcon("reading_score")}</div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort("writing_score")}>
                            <div className="flex items-center justify-end">Writing {getSortIcon("writing_score")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("status")}>
                            <div className="flex items-center">Status {getSortIcon("status")}</div>
                        </TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                                Không tìm thấy kết quả.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} className="group">
                                <TableCell className="font-mono text-muted-foreground">{item.id}</TableCell>
                                <TableCell>{item.gender}</TableCell>
                                <TableCell>{item.race_ethnicity}</TableCell>
                                <TableCell>{item.parental_education}</TableCell>
                                <TableCell className="text-right font-medium">{item.math_score}</TableCell>
                                <TableCell className="text-right font-medium">{item.reading_score}</TableCell>
                                <TableCell className="text-right font-medium">{item.writing_score}</TableCell>
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
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
