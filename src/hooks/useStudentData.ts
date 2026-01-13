import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { API_ENDPOINTS } from "@/config/api"
import { DataRecord, ProvinceSummaryRecord, SchoolSummaryRecord } from "@/types"

export function useStudentData() {
    const [data, setData] = useState<DataRecord[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(50)
    const [search, setSearch] = useState('')
    const [sortField, setSortField] = useState('id')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [status, setStatus] = useState('all')

    const [provinces, setProvinces] = useState<ProvinceSummaryRecord[]>([])
    const [schools, setSchools] = useState<SchoolSummaryRecord[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { user } = useAuth();

    // Load Data from API
    const loadData = async () => {
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                sortField,
                sortOrder,
                status
            });

            const [studentsRes, provincesRes, schoolsRes] = await Promise.all([
                fetch(`${API_ENDPOINTS.STUDENT_DETAILS}?${queryParams.toString()}`),
                fetch(API_ENDPOINTS.STUDENT_PROVINCES),
                fetch(API_ENDPOINTS.STUDENT_SCHOOLS)
            ]);

            if (!studentsRes.ok || !provincesRes.ok || !schoolsRes.ok) {
                throw new Error("Failed to fetch some data categories");
            }

            const [studentsResult, provincesData, schoolsData] = await Promise.all([
                studentsRes.json(),
                provincesRes.json(),
                schoolsRes.json()
            ]);

            // Handle the new response format: { data, total, page, ... }
            if (studentsResult.data) {
                setData(studentsResult.data);
                setTotal(studentsResult.total);
            } else {
                // Fallback for old API if any
                setData(studentsResult);
                setTotal(studentsResult.length);
            }

            setProvinces(provincesData);
            setSchools(schoolsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Không thể kết nối Server! Vui lòng kiểm tra.");
            setData([]);
        }
    }

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, page, limit, search, sortField, sortOrder, status]);

    // Actions
    const handleRefresh = async () => {
        setIsRefreshing(true)
        await loadData();
        setIsRefreshing(false)
    }

    // Mock handlers
    const handleReset = async () => { handleRefresh(); }

    const handleDelete = (id: number) => {
        setData(prev => prev.filter(item => item.id !== id));
        toast.info("Chức năng xóa trên DB chưa được kích hoạt ở frontend này.");
    }

    const handleAddRecord = (record: DataRecord) => {
        setData(prev => [...prev, record]);
    }

    const handleUpdateRecord = (updatedRecord: DataRecord) => {
        setData(prev => prev.map(item => item.id === updatedRecord.id ? updatedRecord : item));
    }

    return {
        data,
        total,
        page,
        limit,
        search,
        sortField,
        sortOrder,  
        status,
        setPage,
        setLimit,
        setSearch,
        setSortField,
        setSortOrder,
        setStatus,
        provinces,
        schools,
        isRefreshing,
        handleRefresh,
        handleReset,
        handleDelete,
        handleAddRecord,
        handleUpdateRecord
    }
}
