import { Users } from 'lucide-react'
import { useMemo } from 'react'
import {
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    Label,
    LabelList,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DashboardProps } from "./types"
import { groupByName, formatOneDecimal } from "@/utils/dataUtils"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function StudentAffairsDashboard(props: DashboardProps) {
    const {
        insights,
        typeData,
        atRiskDemographics,
        data,
        provinces,
        schools
    } = props;

    // Grade distribution data
    const gradeData = useMemo(() => {
        const gradeCounts = data.reduce((acc, curr) => {
            const grade = curr.grade || 'Unknown';
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(gradeCounts).map(key => ({
            name: `Khối ${key}`,
            value: gradeCounts[key]
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    // Fallback Risk List
    const localRiskList = useMemo(() => {
        let list = insights.atRiskList || [];
        if (list.length === 0 && data.length > 0) {
            list = [...data].sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0)).slice(0, 20).map(s => ({
                ...s,
                id: s.student_uid,
                test_average: ((s.test_math || 0) + (s.test_literature || 0)) / 2
            }));
        }
        return list;
    }, [insights.atRiskList, data]);

    // Risk by Level
    const localRiskByLevel = useMemo(() => {
        const localRiskByLevelCounts = localRiskList.reduce((acc, s) => {
            const lvl = s.level_name || 'Khác';
            acc[lvl] = (acc[lvl] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(localRiskByLevelCounts).map(([name, value]) => ({ name, value }));
    }, [localRiskList]);

    // Aggregated data for Pie component - School Types
    const realTypeData = useMemo(() => {
        const counts = schools.reduce((acc, s) => {
            acc[s.type || 'Other'] = (acc[s.type || 'Other'] || 0) + (s.total_students || 0);
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [schools]);

    // Vulnerable Groups: Breakdown of At-Risk by School Type
    const vulnerableGroups = useMemo(() => {
        const typeMap = localRiskList.reduce((acc, s) => {
            const type = s.type_name || 'Khác';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const result = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
        return result.length > 0 ? result : [{ name: 'Ổn định', value: 1 }];
    }, [localRiskList]);

    // Aggregated Province Data to avoid duplicates and ensure accuracy
    const provinceAggregation = useMemo(() => {
        return groupByName(provinces, 'province', ['below_average_count', 'total_students']);
    }, [provinces]);

    // Regional Support Priorities: Top provinces with highest % of "Below Average" students
    const regionalNeed = useMemo(() => {
        return provinceAggregation
            .map(p => ({
                province: p.name,
                belowAvgRate: parseFloat(formatOneDecimal((p.below_average_count / (p.total_students || 1)) * 100))
            }))
            .sort((a, b) => b.belowAvgRate - a.belowAvgRate)
            .slice(0, 5);
    }, [provinceAggregation]);

    // Regional Distribution for Pie Chart
    const aggregatedProvinces = useMemo(() => {
        return provinceAggregation
            .map(p => ({ name: p.name, value: p.total_students }))
            .sort((a, b) => b.value - a.value);
    }, [provinceAggregation]);

    // Optimized Attendance Categories for Small Chart
    const attendanceStats = useMemo(() => {
        let low = 0, mid = 0, high = 0;
        data.forEach(s => {
            const att = s.attendance_rate || 0;
            if (att < 80) low++;
            else if (att < 90) mid++;
            else high++;
        });
        return [
            { name: '<80%', value: low, fill: '#ef4444' },
            { name: '80-90%', value: mid, fill: '#f59e0b' },
            { name: '>90%', value: high, fill: '#22c55e' },
        ];
    }, [data]);

    const lowAttendanceCount = attendanceStats[0].value;

    return (
        <div className="space-y-6">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded shadow-sm flex items-start">
                <Users className="h-6 w-6 text-orange-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-orange-800">Hỗ trợ Sinh viên & Phong trào</h3>
                    <p className="text-orange-700 mt-1">
                        Theo dõi sát <strong>{lowAttendanceCount}</strong> sinh viên có tỷ lệ chuyên cần dưới 80% (Nguy cơ rớt môn cao).
                        <br />
                        <strong>Lưu ý:</strong> Cần gặp gỡ và tư vấn cho nhóm sinh viên này để tìm hiểu nguyên nhân (Bệnh lý, Gia đình, hay Chán học).
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tổng số Đơn vị Trường</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{new Set(schools.map(s => s.school_name)).size}</div><p className="text-xs text-muted-foreground">Đang hoạt động</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tổng số Tỉnh/TP</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{provinceAggregation.length}</div><p className="text-xs text-muted-foreground">Tham gia hệ thống</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cảnh báo Vắng học</CardTitle></CardHeader>
                    <CardContent className="h-[100px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceStats} layout="vertical" barSize={20}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={50} style={{ fontSize: '10px' }} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    <LabelList dataKey="value" position="right" fontSize={10} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Phân tích Nhóm Yếu thế</CardTitle><CardDescription>Phân bổ học sinh rủi ro cao theo loại hình trường.</CardDescription></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={vulnerableGroups}
                                    cx="50%" cy="50%" labelLine={false}
                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80} fill="#8884d8" dataKey="value"
                                >
                                    {vulnerableGroups.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Ưu tiên Hỗ trợ Vùng miền</CardTitle><CardDescription>Top 5 tỉnh/thành có tỷ lệ học sinh dưới trung bình cao nhất.</CardDescription></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={regionalNeed} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" unit="%" />
                                <YAxis dataKey="province" type="category" interval={0} fontSize={12} width={100} />
                                <Tooltip formatter={(val) => [`${val}%`, 'Tỷ lệ dưới TB']} />
                                <Bar dataKey="belowAvgRate" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Phân bổ theo Tỉnh/Thành phố</CardTitle><CardDescription>Top 5 Tỉnh có số lượng học sinh cao nhất</CardDescription></CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={aggregatedProvinces.slice(0, 5)}
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {aggregatedProvinces.slice(0, 5).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <Label width={30} position="center">KV</Label>
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Phân bổ Học sinh theo Khối lớp</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gradeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#f97316" name="Số học sinh" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6">
                <Card className="border-t-4 border-t-orange-500">
                    <CardHeader><CardTitle>Danh sách Sinh viên Cần Hỗ trợ & Theo dõi</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Mã SV</TableHead><TableHead>Họ tên</TableHead><TableHead>Vấn đề</TableHead><TableHead>Đề xuất hỗ trợ</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {localRiskList.slice(0, 5).map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>{s.id}</TableCell>
                                        <TableCell>Sinh viên {s.id}</TableCell>
                                        <TableCell className="text-red-500">Học lực yếu (GPA: {formatOneDecimal(s.gpa_overall)})</TableCell>
                                        <TableCell>Tư vấn tâm lý & Học vụ</TableCell>
                                        <TableCell><Badge variant="outline" className="text-red-500 border-red-500">Chưa xử lý</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Cơ cấu theo Loại hình Trường</CardTitle><CardDescription>Phân bổ học sinh theo Công lập/Tư thục.</CardDescription></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={realTypeData.length ? realTypeData : typeData}
                                    innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {(realTypeData.length ? realTypeData : typeData).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Phân bổ Rủi ro theo Cấp học</CardTitle><CardDescription>Các cấp học có tỷ lệ học sinh cần hỗ trợ cao.</CardDescription></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={localRiskByLevel.length ? localRiskByLevel : atRiskDemographics.level} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                                <Tooltip />
                                <Bar dataKey="value" name="Số HS" fill="#f87171" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
