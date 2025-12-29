import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    Download,
    RefreshCw,
    Plus,
    Filter,
    RotateCcw
} from "lucide-react"

interface StudentToolbarProps {
    searchTerm: string
    onSearchChange: (term: string) => void
    statusFilter: string
    onFilterChange: (status: string) => void
    onRefresh: () => void
    onReset: () => void
    onExport: () => void
    onAdd: () => void
    isRefreshing: boolean
}

export function StudentToolbar({
    searchTerm,
    onSearchChange,
    statusFilter,
    onFilterChange,
    onRefresh,
    onReset,
    onExport,
    onAdd,
    isRefreshing
}: StudentToolbarProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    {/* Title and Description might be better passed as children or handled in parent, 
                        but usually toolbar actions are separate. We'll leave title in parent for semantic HTML. */}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="default" size="sm" onClick={onAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm mới
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Đang tải...' : 'Refresh'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={onReset} className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset CSV
                    </Button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo giới tính, sắc tộc, học vấn..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={onFilterChange}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Lọc trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
