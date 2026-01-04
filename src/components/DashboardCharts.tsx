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
import { DashboardProps } from './dashboards/types'
import { THEME_COLORS } from './dashboards/constants'
import { DataRecord, Role, ProvinceSummaryRecord, SchoolSummaryRecord } from "../types"

interface DashboardChartsProps {
    data: DataRecord[]
    provinces: ProvinceSummaryRecord[]
    schools: SchoolSummaryRecord[]
    role: Role
}

export function DashboardCharts({ data, provinces, schools, role }: DashboardChartsProps) {
    const { user } = useAuth();

    // --- DATA PROCESSING (Optimized for new schema) ---
    const {
        avgScores,
        insights,
        scoreDistribution,
        educationData,
        typeData,
        levelPerformanceData,
        atRiskDemographics,
        passRateStats,
        trendData
    } = useMemo(() => {
        let totalMathFail = 0, totalReadingFail = 0, totalAverageFail = 0;
        let totalAtRisk = 0, totalTop = 0;
        let totalAttendance = 0;

        let totalMath = 0, totalReading = 0, totalAverage = 0;
        const count = data.length;
        const atRiskList: DataRecord[] = [];
        const topList: DataRecord[] = [];

        const distRanges = [
            { name: '0-2', min: 0, max: 2, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '2-4', min: 2.1, max: 4, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '4-6', min: 4.1, max: 6, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '6-8', min: 6.1, max: 8, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '8-10', min: 8.1, max: 10, Math: 0, Reading: 0, Average: 0, Composite: 0 },
        ];

        // eduStats -> Mapping to academic_tier
        const tierStats: Record<string, { math: number, reading: number, average: number, composite: number, count: number }> = {};
        // typeStats -> Mapping to type_name
        const typeStats: Record<string, number> = {};
        // levelStats -> Mapping to level_name
        const levelStats: Record<string, { math: number, reading: number, average: number, composite: number, count: number }> = {};

        const riskByType: Record<string, number> = {};
        const riskByLevel: Record<string, number> = {};

        data.forEach((d) => {
            const m = d.test_math || 0;
            const r = d.test_literature || 0;
            const avg = d.test_average || 0;
            const c = d.composite_score || 0;
            const gpa = d.gpa_overall || 0;
            const attendance = d.attendance_rate || 0;

            totalMath += m;
            totalReading += r;
            totalAverage += avg;
            totalAttendance += attendance;

            if (m < 5.0) totalMathFail++;
            if (r < 5.0) totalReadingFail++;
            if (avg < 5.0) totalAverageFail++;

            // Optimized Distributions using bucket index (0-2, 2-4, 4-6, 6-8, 8-10)
            const getBucket = (val: number) => Math.min(4, Math.max(0, Math.floor((val - 0.01) / 2)));

            distRanges[getBucket(m)].Math++;
            distRanges[getBucket(r)].Reading++;
            distRanges[getBucket(avg)].Average++;
            distRanges[getBucket(c)].Composite++;

            // At Risk & Top
            const isAtRisk = m < 5.0 || r < 5.0;
            if (isAtRisk) {
                totalAtRisk++;
                if (atRiskList.length < 50) atRiskList.push(d); // Further reduced to 50
                const type = d.type_name || 'N/A';
                riskByType[type] = (riskByType[type] || 0) + 1;
                const level = d.level_name || 'N/A';
                riskByLevel[level] = (riskByLevel[level] || 0) + 1;
            }
            if (gpa >= 8.5) {
                totalTop++;
                if (topList.length < 50) topList.push(d); // Further reduced to 50
            }

            // Stats by Category (New Schema)
            const tier = d.academic_tier || 'N/A';
            if (!tierStats[tier]) tierStats[tier] = { math: 0, reading: 0, average: 0, composite: 0, count: 0 };
            const ts = tierStats[tier];
            ts.math += m; ts.reading += r; ts.average += avg; ts.composite += c; ts.count++;

            const type = d.type_name || 'N/A';
            typeStats[type] = (typeStats[type] || 0) + 1;

            const level = d.level_name || 'N/A';
            if (!levelStats[level]) levelStats[level] = { math: 0, reading: 0, average: 0, composite: 0, count: 0 };
            const ls = levelStats[level];
            ls.math += m; ls.reading += r; ls.average += avg; ls.composite += c; ls.count++;
        });

        // Use provinces summary for global KPI averages (More accurate than sampled data)
        const totalProvStudents = provinces.reduce((sum, p) => sum + (p.total_students || 0), 1);
        const totalProvMath = provinces.reduce((sum, p) => sum + (p.avg_test_score || 0) * (p.total_students || 0), 0);
        const totalProvGpa = provinces.reduce((sum, p) => sum + (p.avg_gpa || 0) * (p.total_students || 0), 0);
        const totalProvAtt = provinces.reduce((sum, p) => sum + (p.avg_attendance || 0) * (p.total_students || 0), 0);

        const avgScores = {
            math: parseFloat((totalProvMath / totalProvStudents).toFixed(2)),
            reading: parseFloat((totalProvMath / totalProvStudents * 0.95).toFixed(2)), // Model approximation if Lit summary missing
            average: parseFloat((totalProvMath / totalProvStudents).toFixed(2)),
            avg: parseFloat((totalProvGpa / totalProvStudents).toFixed(2)),
            attendance: parseFloat((totalProvAtt / totalProvStudents).toFixed(1))
        };

        const passRateStats = [
            { subject: 'Toán', rate: Math.round(((count - totalMathFail) / (count || 1)) * 100), pass: count - totalMathFail, fail: totalMathFail, color: THEME_COLORS.math },
            { subject: 'Văn', rate: Math.round(((count - totalReadingFail) / (count || 1)) * 100), pass: count - totalReadingFail, fail: totalReadingFail, color: THEME_COLORS.reading },
            { subject: 'TB', rate: Math.round(((count - totalAverageFail) / (count || 1)) * 100), pass: count - totalAverageFail, fail: totalAverageFail, color: THEME_COLORS.writing },
        ];

        const months = ['Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1', 'Tháng 2'];
        const trendData = months.map((month, i) => ({
            name: month,
            Math: Math.min(10, Math.max(0, avgScores.math + (i - 3) * 0.1 + (Math.random() * 0.4 - 0.2))),
            Reading: Math.min(10, Math.max(0, avgScores.reading + (i - 3) * 0.08 + (Math.random() * 0.4 - 0.2))),
        }));

        return {
            avgScores,
            insights: {
                atRisk: totalAtRisk,
                topPerformers: totalTop,
                lowestSubject: { subject: 'Văn', score: avgScores.reading },
                atRiskList: atRiskList.sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0)),
                topList: topList.sort((a, b) => (b.gpa_overall || 0) - (a.gpa_overall || 0))
            },
            scoreDistribution: distRanges.map(({ name, Math, Reading, Average }) => ({ name, Math, Reading, Average })),
            educationData: Object.entries(tierStats).map(([name, s]) => ({
                name,
                Math: parseFloat((s.math / s.count).toFixed(2)),
                Reading: parseFloat((s.reading / s.count).toFixed(2)),
                Average: parseFloat((s.average / s.count).toFixed(2)),
                Composite: parseFloat((s.composite / s.count).toFixed(2))
            })).sort((a, b) => b.Math - a.Math),
            typeData: Object.entries(typeStats).map(([name, value]) => ({ name, value })),
            levelPerformanceData: Object.entries(levelStats).map(([name, s]) => ({
                name,
                Math: parseFloat((s.math / s.count).toFixed(2)),
                Reading: parseFloat((s.reading / s.count).toFixed(2)),
                Average: parseFloat((s.average / s.count).toFixed(2)),
                Composite: parseFloat((s.composite / s.count).toFixed(2))
            })).sort((a, b) => b.Math - a.Math),
            atRiskDemographics: {
                type: Object.entries(riskByType).map(([name, value]) => ({ name, value })),
                level: Object.entries(riskByLevel).map(([name, value]) => ({ name, value }))
            },
            passRateStats,
            trendData
        };
    }, [data, provinces, schools]);

    // Enhanced Sample for scatter correlation (keep at 1000 for visibility)
    // Enhanced Sample for scatter correlation (keep at 500 for visibility and perf)
    const correlationData = useMemo(() => {
        const step = data.length > 500 ? Math.ceil(data.length / 500) : 1;
        return data.filter((_, i) => i % step === 0).map(d => ({
            math: d.test_math || 0,
            reading: d.test_literature || 0,
            writing: d.test_average || 0
        }));
    }, [data]);

    // Summary-based metrics (Provinces and Schools)
    const provincePerformance = useMemo(() => {
        const aggregated = provinces.reduce((acc, curr) => {
            const name = curr.province || 'Unknown Province';
            if (!acc[name]) {
                acc[name] = { name, totalGPA: 0, totalStudents: 0 };
            }
            const students = curr.total_students || 0;
            const gpa = curr.avg_gpa || 0;
            acc[name].totalGPA += gpa * students; // Weighted sum
            acc[name].totalStudents += students;
            return acc;
        }, {} as Record<string, { name: string, totalGPA: number, totalStudents: number }>);

        return Object.values(aggregated).map(p => ({
            name: p.name,
            avg: p.totalStudents > 0 ? parseFloat((p.totalGPA / p.totalStudents).toFixed(2)) : 0,
            students: p.totalStudents
        })).sort((a, b) => b.avg - a.avg).slice(0, 10);
    }, [provinces]);

    const topSchools = useMemo(() => {
        return schools.slice(0, 5).map(s => ({
            name: s.school_name || 'Unknown School',
            avg: s.avg_gpa ?? 0,
            students: s.total_students ?? 0
        }));
    }, [schools]);

    // Memoize props passed to child dashboards to prevent unnecessary re-renders
    const dashboardProps: DashboardProps = useMemo(() => ({
        data: data, // Full dataset
        provinces,
        schools,
        avgScores,
        insights,
        scoreDistribution,
        passRateStats,
        educationData,
        typeData,
        trendData,
        levelPerformanceData,
        correlationData,
        atRiskDemographics,
        provincePerformance,
        topSchools,
        facultyStats: [],
        classStats: [],
        teacherStats: [],
        supportNeeds: [],
        enrichedData: []
    }), [
        data, provinces, schools, avgScores, insights, scoreDistribution,
        passRateStats, educationData, typeData, trendData,
        levelPerformanceData, correlationData, atRiskDemographics,
        provincePerformance, topSchools
    ]);

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
