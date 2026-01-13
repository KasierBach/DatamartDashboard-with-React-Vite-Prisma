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
            case 'PENDING' as Role:
                return (
                    <div className="text-center p-12 bg-card rounded-2xl border shadow-xl flex flex-col items-center gap-6 max-w-2xl mx-auto mt-10 animate-in fade-in zoom-in duration-500">
                        <div className="h-20 w-20 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center shadow-inner">
                            <Info className="h-12 w-12" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold tracking-tight">Tài khoản đang chờ phê duyệt</h3>
                            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                                Chào mừng <strong>{user?.name || 'bạn'}</strong>! Tài khoản của bạn đã được đăng ký thành công.
                                Hệ thống cần quản trị viên duyệt vai trò trước khi bạn có thể truy cập dữ liệu.
                            </p>
                        </div>
                        <div className="p-5 bg-muted/50 rounded-xl text-sm text-left w-full border">
                            <p className="font-semibold mb-2 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                Các bước tiếp theo:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                                <li>Liên hệ với phòng đào tạo hoặc bộ phận IT.</li>
                                <li>Cung cấp chính xác username: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary">{user?.username}</code></li>
                                <li>Sau khi được duyệt, vui lòng <strong>Tải lại trang</strong>.</li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-sm"
                            >
                                Tải lại trang
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('user');
                                    window.location.href = '/login';
                                }}
                                className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 border border-input bg-background hover:bg-muted font-medium transition-all"
                            >
                                Đăng xuất
                            </button>
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

    const content = renderContentByRole();

    if (data.length === 0 && role !== 'PENDING' && role !== 'no_role') return null

    return (
        <div className="space-y-4">
            {content}
        </div>
    )
}
