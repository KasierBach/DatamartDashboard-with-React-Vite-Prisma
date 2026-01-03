import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { API_ENDPOINTS } from "@/config/api"
import { DataRecord, ProvinceSummaryRecord, SchoolSummaryRecord } from "@/types"

export function useStudentData() {
    const [data, setData] = useState<DataRecord[]>([])
    const [provinces, setProvinces] = useState<ProvinceSummaryRecord[]>([])
    const [schools, setSchools] = useState<SchoolSummaryRecord[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { user } = useAuth();

    // Load Data from API
    const loadData = async () => {
        try {
            const [studentsRes, provincesRes, schoolsRes] = await Promise.all([
                fetch(API_ENDPOINTS.STUDENT_DETAILS),
                fetch(API_ENDPOINTS.STUDENT_PROVINCES),
                fetch(API_ENDPOINTS.STUDENT_SCHOOLS)
            ]);

            if (!studentsRes.ok || !provincesRes.ok || !schoolsRes.ok) {
                throw new Error("Failed to fetch some data categories");
            }

            const [studentsData, provincesData, schoolsData] = await Promise.all([
                studentsRes.json(),
                provincesRes.json(),
                schoolsRes.json()
            ]);

            setData(studentsData);
            setProvinces(provincesData);
            setSchools(schoolsData);
            toast.success("Đã tải dữ liệu từ Database!");
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
    }, [user]);

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
