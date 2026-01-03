import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DashboardProps } from "./types"
import { THEME_COLORS } from "./constants"
import { formatOneDecimal } from "@/utils/dataUtils"

export function AcademicAffairsDashboard(props: DashboardProps) {
    const {
        data,
        provinces,
        schools,
    } = props;

    // Optimized single-pass calculation for Academic Affairs metrics
    const { localPassRateStats, failMath, failLit, avgCompositeScore } = useMemo(() => {
        let fM = 0;
        let fL = 0;
        let fA = 0;
        let totalComposite = 0;

        data.forEach(d => {
            const m = Number(d.test_math || 0);
            const l = Number(d.test_literature || 0);
            const avg = Number(d.test_average || (m + l) / 2 || 0);

            if (m < 5.0) fM++;
            if (l < 5.0) fL++;
            if (avg < 5.0) fA++;
            totalComposite += (d.composite_score || 0);
        });

        const count = data.length || 1;

        return {
            localPassRateStats: [
                { subject: 'Toán', fail: fM, total: data.length },
                { subject: 'Văn', fail: fL, total: data.length },
                { subject: 'TB Chung', fail: fA, total: data.length },
            ],
            failMath: fM,
            failLit: fL,
            avgCompositeScore: formatOneDecimal(totalComposite / count)
        };
    }, [data]);

    // Retention Warning System: Attendance < 70% AND GPA < 5.0 (Critical Dropout Risk)
    const retentionRiskList = useMemo(() => {
        return data
            .filter(d => (d.attendance_rate || 0) < 70 && (d.gpa_overall || 0) < 5.0)
            .sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0))
            .slice(0, 10);
    }, [data]);

    // Enrollment Analysis: Students by Type and Level (Aggregated to avoid duplicates)
    const enrollmentData = useMemo(() => {
        const schoolMap = schools.reduce((acc, s) => {
            const name = s.school_name || 'Khác';
            if (!acc[name]) {
                acc[name] = s;
            }
            return acc;
        }, {} as Record<string, typeof schools[0]>);

        const uniqueSchools = Object.values(schoolMap);

        const typeCounts = uniqueSchools.reduce((acc, s) => {
            acc[s.type || 'Công lập'] = (acc[s.type || 'Công lập'] || 0) + (s.total_students || 0);
            return acc;
        }, {} as Record<string, number>);

        const levelCounts = uniqueSchools.reduce((acc, s) => {
            acc[s.level || 'THPT'] = (acc[s.level || 'THPT'] || 0) + (s.total_students || 0);
            return acc;
        }, {} as Record<string, number>);

        return {
            type: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
            level: Object.entries(levelCounts).map(([name, value]) => ({ name, value }))
        };
    }, [schools]);

    // Fallback logic for critical students
    const criticalStudents = useMemo(() => {
        let list = data.filter(d => Number(d.test_average || ((d.test_math || 0) + (d.test_literature || 0)) / 2 || 0) < 3.5);
        if (list.length === 0) {
            list = [...data].sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0)).slice(0, 20);
        }
        return list.slice(0, 50);
    }, [data]);

    // Aggregate Province Data to avoid double-counting categories
    const provinceAggregationMap = useMemo(() => {
        return provinces.reduce((acc, p) => {
            const name = p.province || 'Unknown';
            if (!acc[name]) {
                acc[name] = { excellent: 0, good: 0, average: 0, below: 0 };
            }
            acc[name].excellent += (p.excellent_count || 0);
            acc[name].good += (p.good_count || 0);
            acc[name].average += (p.average_count || 0);
            acc[name].below += (p.below_average_count || 0);
            return acc;
        }, {} as Record<string, { excellent: number, good: number, average: number, below: number }>);
    }, [provinces]);

    const totals = useMemo(() => {
        return Object.values(provinceAggregationMap).reduce((acc, curr) => {
            acc.excellent += curr.excellent;
            acc.good += curr.good;
            acc.average += curr.average;
            acc.below += curr.below;
            return acc;
        }, { excellent: 0, good: 0, average: 0, below: 0 });
    }, [provinceAggregationMap]);

    // Calculate total unique provinces and schools
    const totalProvinces = Object.keys(provinceAggregationMap).length;
    const totalSchools = new Set(schools.map(s => s.school_name)).size;

    return (
        <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-red-800 flex items-center">Cảnh báo Học vụ & Quy chế</h3>
                    <p className="text-red-700 mt-1">
                        Phát hiện <strong>{criticalStudents.length}</strong> trường hợp có điểm trung bình dưới 3.5 (Cảnh báo mức 2).
                        <br />
                        <strong>Hành động:</strong> Gửi thông báo nhắc nhở đến GVCN và Phụ huynh trước ngày 25.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cảnh báo học vụ (3 mức)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{criticalStudents.length}</div>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <div className="flex justify-between"><span>Toán &lt; 5.0:</span> <strong>{failMath}</strong></div>
                            <div className="flex justify-between"><span>Văn &lt; 5.0:</span> <strong>{failLit}</strong></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Điểm Composite TB</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-blue-600">{avgCompositeScore}</div><p className="text-xs text-muted-foreground">Trên thang 10</p></CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tổng Trường/Tỉnh</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-green-600">{totalSchools}/{totalProvinces}</div><p className="text-xs text-muted-foreground">Trong hệ thống</p></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Cơ cấu Trường học (Loại hình & Cấp học)</CardTitle></CardHeader>
                    <CardContent className="h-[300px] flex">
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie data={enrollmentData.type} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} label>
                                    <Cell fill="#3b82f6" /><Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip /><Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie data={enrollmentData.level} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} label>
                                    <Cell fill="#10b981" /><Cell fill="#8b5cf6" /><Cell fill="#ec4899" />
                                </Pie>
                                <Tooltip /><Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Cảnh báo Bỏ học (Retention Risk)</CardTitle><CardDescription>Chuyên cần &lt; 70% và GPA &lt; 5.0.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Mã SV</TableHead><TableHead>Chuyên cần</TableHead><TableHead>GPA</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {retentionRiskList.length > 0 ? retentionRiskList.map(s => (
                                    <TableRow key={s.student_uid}>
                                        <TableCell className="font-medium text-xs font-mono">{s.student_uid}</TableCell>
                                        <TableCell className="text-red-600 font-bold">{s.attendance_rate}%</TableCell>
                                        <TableCell className="text-red-600 font-bold">{formatOneDecimal(s.gpa_overall)}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="text-center">Không có rủi ro cao</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Tỷ lệ rớt theo môn học</CardTitle><CardDescription>Thống kê số lượng sinh viên không đạt yêu cầu.</CardDescription></CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={localPassRateStats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" /><YAxis dataKey="subject" type="category" width={100} />
                                <Tooltip /><Bar dataKey="fail" fill={THEME_COLORS.math} name="Số HS yếu" barSize={30} label={{ position: 'right' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Phân bổ Xếp loại Học lực</CardTitle><CardDescription>Theo dữ liệu từ các Tỉnh/TP.</CardDescription></CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Xuất sắc', count: totals.excellent, fill: '#22c55e' },
                                { name: 'Khá', count: totals.good, fill: '#3b82f6' },
                                { name: 'Trung bình', count: totals.average, fill: '#f59e0b' },
                                { name: 'Dưới TB', count: totals.below, fill: '#ef4444' },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                                <Bar dataKey="count" name="Số HS" radius={[4, 4, 0, 0]}>
                                    {[
                                        { fill: '#22c55e' }, { fill: '#3b82f6' }, { fill: '#f59e0b' }, { fill: '#ef4444' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 mt-6">
                <Card className="col-span-2 shadow-sm border-t-4 border-t-red-600">
                    <CardHeader><CardTitle>Danh sách Cảnh báo Học vụ (Dự kiến Buộc thôi học)</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-red-100">
                                <TableRow>
                                    <TableHead>Mã SV</TableHead><TableHead>Cấp học</TableHead><TableHead>Toán</TableHead><TableHead>Văn</TableHead><TableHead>Điểm TB</TableHead><TableHead>Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {criticalStudents.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium text-xs">{s.student_uid}</TableCell>
                                        <TableCell className="text-xs">{s.level_name || 'THPT'}</TableCell>
                                        <TableCell className={`text-xs ${Number(s.test_math || 0) < 5 ? 'text-red-500 font-bold' : ''}`}>{s.test_math || 0}</TableCell>
                                        <TableCell className={`text-xs ${Number(s.test_literature || 0) < 5 ? 'text-red-500 font-bold' : ''}`}>{s.test_literature || 0}</TableCell>
                                        <TableCell className="text-xs font-bold text-red-600">{formatOneDecimal(s.test_average || ((s.test_math || 0) + (s.test_literature || 0)) / 2)}</TableCell>
                                        <TableCell><Button size="sm" variant="outline" className="h-7 text-xs">Gửi TB</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
