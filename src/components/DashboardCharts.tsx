import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PrincipalDashboard } from './dashboards/PrincipalDashboard'
import { VicePrincipalDashboard } from './dashboards/VicePrincipalDashboard'
import { HeadDeptDashboard } from './dashboards/HeadDeptDashboard'
import { TeacherDashboard } from './dashboards/TeacherDashboard'
import { AcademicAffairsDashboard } from './dashboards/AcademicAffairsDashboard'
import { QATestingDashboard } from './dashboards/QATestingDashboard'
import { StudentAffairsDashboard } from './dashboards/StudentAffairsDashboard'
import { StudentDashboard } from './dashboards/StudentDashboard'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { DashboardProps } from './dashboards/types'
import { DataRecord, Role, ProvinceSummaryRecord, SchoolSummaryRecord } from "../types"

interface DashboardChartsProps {
    data: DataRecord[]
    provinces: ProvinceSummaryRecord[]
    schools: SchoolSummaryRecord[]
    role: Role
}

export function DashboardCharts({ data, provinces, schools, role }: DashboardChartsProps) {
    const { user } = useAuth();
    const stats = useDashboardStats(data || [], provinces || [], schools || []);

    // Memoize final props passed to children
    const dashboardProps: DashboardProps = useMemo(() => ({
        data: data || [],
        provinces: provinces || [],
        schools: schools || [],
        ...stats,
        facultyStats: [],
        classStats: [],
        teacherStats: [],
        supportNeeds: [],
        enrichedData: []
    }), [data, provinces, schools, stats]);

    const renderContentByRole = () => {
        switch (role) {
            case 'principal':
                return <PrincipalDashboard {...dashboardProps} />
            case 'vice_principal':
                return <VicePrincipalDashboard {...dashboardProps} />
            case 'head_dept':
                return <HeadDeptDashboard {...dashboardProps} />
            case 'teacher':
                return <TeacherDashboard {...dashboardProps} />
            case 'academic_affairs':
                return <AcademicAffairsDashboard {...dashboardProps} />
            case 'qa_testing':
                return <QATestingDashboard {...dashboardProps} />
            case 'student_affairs':
                return <StudentAffairsDashboard {...dashboardProps} />
            case 'student':
                return <StudentDashboard {...dashboardProps} />
            case 'no_role':
            case 'PENDING' as Role:
                return (
                    <div className="text-center p-12 bg-card rounded-xl border shadow-sm flex flex-col items-center gap-4 max-w-2xl mx-auto mt-10">
                        <div className="h-16 w-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                            <Info className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Tài khoản đang chờ phê duyệt</h3>
                            <p className="text-muted-foreground">
                                Chào mừng <strong>{user?.name || 'bạn'}</strong>! Tài khoản của bạn đã được đăng ký thành công.
                                Tuy nhiên, bạn cần đợi quản trị viên phân quyền để có thể xem được Dashboard dữ liệu.
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-sm text-left w-full">
                            <p className="font-medium mb-1">Các bước tiếp theo:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Liên hệ với phòng đào tạo hoặc IT.</li>
                                <li>Cung cấp tên đăng nhập của bạn.</li>
                                <li>Đợi xác nhận phân quyền từ hệ thống.</li>
                            </ul>
                        </div>
                    </div>
                )
            default:
                return (
                    <div className="text-center p-10 text-muted-foreground bg-white rounded-lg border flex flex-col items-center gap-2">
                        <Info className="h-10 w-10 text-gray-300" />
                        <p>Chọn vai trò để xem báo cáo chi tiết.</p>
                    </div>
                )
        }
    }

    if (data.length === 0) return null

    return (
        <div className="space-y-4">
            {renderContentByRole()}
        </div>
    )
}
