import { useState, useMemo } from 'react'
import { Target, ChevronLeft, ChevronRight } from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Line,
    PieChart,
    Pie,
    Cell,
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
import { Button } from "@/components/ui/button"
import { DashboardProps } from "./types"
import { THEME_COLORS, SCORE_THRESHOLDS } from "./constants"
import { formatOneDecimal } from "@/utils/dataUtils"

// Helper component for Data Context Overlay
const DataStats = ({ n, range, avg }: { n: number, range?: string, avg?: number | string }) => (
    <div className="mt-2 pt-2 border-t border-dashed flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">N: <strong>{n.toLocaleString()}</strong> HS</span>
        {range && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Phạm vi: <strong>{range}</strong></span>}
        {avg && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600">TB: <strong>{avg}</strong></span>}
    </div>
);

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export function VicePrincipalDashboard(props: DashboardProps) {
    const {
        data,
        avgScores,
        insights,
        educationData,
        levelPerformanceData,
    } = props;

    const ITEMS_PER_PAGE = 5;
    const [atRiskPage, setAtRiskPage] = useState(1);

    // Memoized at-risk list with fallback
    const effectiveAtRiskList = useMemo(() => {
        return (insights?.atRiskList?.length || 0) > 0
            ? insights.atRiskList
            : [...data]
                .sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0))
                .slice(0, 20)
                .map(s => ({
                    ...s,
                    id: s.student_uid,
                    test_average: ((s.test_math || 0) + (s.test_literature || 0)) / 2,
                }));
    }, [data, insights.atRiskList]);

    const totalAtRiskPages = Math.ceil(effectiveAtRiskList.length / ITEMS_PER_PAGE);
    const atRiskStart = (atRiskPage - 1) * ITEMS_PER_PAGE;
    const currentAtRisk = effectiveAtRiskList.slice(atRiskStart, atRiskStart + ITEMS_PER_PAGE);

    // Distribution data
    const { levelData } = useMemo(() => {
        const levels: Record<string, number> = {};
        data.forEach(d => {
            const l = d.level_name || 'N/A';
            levels[l] = (levels[l] || 0) + 1;
        });
        return {
            levelData: Object.entries(levels).map(([name, value]) => ({ name, value }))
        };
    }, [data]);

    // Calculate Student Momentum (GPA Change vs Previous Year)
    const momentumMap = useMemo(() => {
        const studentHistory: Record<string, { year: number, gpa: number }[]> = {};
        data.forEach(d => {
            const id = String(d.student_uid || d.id);
            if (!studentHistory[id]) studentHistory[id] = [];
            studentHistory[id].push({ year: Number(d.year), gpa: Number(d.gpa_overall) || 0 });
        });

        const momentum: Record<string, number> = {};
        Object.entries(studentHistory).forEach(([id, history]) => {
            const sorted = history.sort((a, b) => b.year - a.year);
            if (sorted.length >= 2) {
                momentum[id] = sorted[0].gpa - sorted[1].gpa;
            }
        });
        return momentum;
    }, [data]);

    const renderMomentum = (id: string | number | undefined) => {
        if (!id) return null;
        const diff = momentumMap[String(id)];
        if (diff === undefined) return null;
        if (diff > 0.2) return <span className="text-green-600 ml-1 font-bold" title={`Tăng ${formatOneDecimal(diff)} điểm`}>📈</span>;
        if (diff < -0.2) return <span className="text-red-600 ml-1 font-bold" title={`Giảm ${formatOneDecimal(Math.abs(diff))} điểm`}>📉</span>;
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded shadow-sm flex items-start">
                <Target className="h-6 w-6 text-purple-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-purple-800">Giám sát Hiệu quả Đào tạo</h3>
                    <p className="text-purple-700 mt-1">
                        Tổng số <strong>{data.length.toLocaleString()}</strong> học sinh. Tỷ lệ đạt chuẩn: <strong>{Math.round((data.filter(d => (d.gpa_overall || 0) >= SCORE_THRESHOLDS.PASSING).length / data.length) * 100)}%</strong>.
                        <br />
                        <strong>Điểm trung bình:</strong> Toán {avgScores.math} | Văn {avgScores.reading}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-t-4 border-t-purple-500">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tổng số Học sinh</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.length.toLocaleString()}</div><p className="text-xs text-muted-foreground">Từ {levelData.length} cấp học</p></CardContent>
                </Card>
                <Card className="border-t-4 border-t-indigo-500">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Điểm TB Toàn trường</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatOneDecimal(avgScores.avg)}</div><p className="text-xs text-muted-foreground">Chuyên cần: {avgScores.attendance}%</p></CardContent>
                </Card>
                <Card className="border-t-4 border-t-pink-500">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cần can thiệp</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{effectiveAtRiskList.length}</div><p className="text-xs text-muted-foreground">Học lực dưới trung bình</p></CardContent>
                </Card>
                <Card className="border-t-4 border-t-green-500">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Xuất sắc</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{insights.topPerformers}</div><p className="text-xs text-muted-foreground">GPA &gt;= {SCORE_THRESHOLDS.TOP_PERFORMER}</p></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Hiệu suất theo Phân vị Học thuật</CardTitle>
                        <CardDescription>
                            Đánh giá mức độ đồng đều giữa các nhóm năng lực.
                            <strong> Insight:</strong> Nhóm {educationData[0]?.name} đang đạt hiệu suất ổn định nhất. {educationData.length > 2 ? `Cần chú ý thu hẹp khoảng cách với nhóm ${educationData[educationData.length - 1]?.name}.` : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={educationData}>
                                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                                    <Bar dataKey="Math" name="Toán" fill={THEME_COLORS.math} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Reading" name="Văn" fill={THEME_COLORS.reading} radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="Average" name="TB Chung" stroke="#ff7300" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <DataStats n={data.length} range="Academic Tiers" avg={formatOneDecimal(avgScores.avg)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Cơ cấu theo Cấp học</CardTitle><CardDescription>Phân bổ số lượng học sinh theo các cấp học.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={levelData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {levelData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Phân tích Hiệu suất theo Khối lớp</CardTitle>
                    <CardDescription>
                        So sánh chất lượng đào tạo giữa các khối lớp 10, 11 và 12.
                        <strong> Insight:</strong> {levelPerformanceData.sort((a, b) => b.Average - a.Average)[0]?.name} đang có thành tích học tập dẫn đầu.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={levelPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />
                                <Bar dataKey="Math" name="Toán" fill={THEME_COLORS.math} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Reading" name="Văn" fill={THEME_COLORS.reading} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Average" name="Điểm TB" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <DataStats n={data.length} range="Khối 10 - 12" avg={formatOneDecimal(avgScores.avg)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Cần Theo dõi Sát (At-Risk Students)</CardTitle>
                    <CardDescription>Cảnh báo các học sinh tụt hậu so với mặt bằng chung của khối.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Mã HS</TableHead><TableHead>Khối</TableHead><TableHead>Toán</TableHead><TableHead>Văn</TableHead><TableHead>GPA</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {currentAtRisk.length > 0 ? (
                                currentAtRisk.map((s: any) => (
                                    <TableRow key={s.student_uid}>
                                        <TableCell className="font-medium text-xs font-mono flex items-center">{s.student_uid} {renderMomentum(s.student_uid)}</TableCell>
                                        <TableCell>{s.grade}</TableCell>
                                        <TableCell className={(s.test_math || 0) < 5 ? "text-red-500 font-bold" : ""}>{s.test_math || 0}</TableCell>
                                        <TableCell className={(s.test_literature || 0) < 5 ? "text-red-500 font-bold" : ""}>{s.test_literature || 0}</TableCell>
                                        <TableCell className="font-bold text-red-600">{formatOneDecimal(s.gpa_overall)}</TableCell>
                                        <TableCell><Badge variant="destructive" className="bg-red-600">Nguy cơ</Badge></TableCell>
                                    </TableRow>
                                ))
                            ) : <TableRow><TableCell colSpan={6} className="text-center">Dữ liệu ổn định</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-muted-foreground italic">Trang {atRiskPage} / {totalAtRiskPages}</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setAtRiskPage(p => Math.max(1, p - 1))} disabled={atRiskPage === 1} className="h-8 px-2"><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => setAtRiskPage(p => Math.min(totalAtRiskPages, p + 1))} disabled={atRiskPage === totalAtRiskPages} className="h-8 px-2"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <DataStats n={effectiveAtRiskList.length} avg={`${(effectiveAtRiskList.reduce((acc, s) => acc + (s.gpa_overall || 0), 0) / (effectiveAtRiskList.length || 1)).toFixed(1)} (GPA TB Nhóm)`} />
                </CardContent>
            </Card>
        </div>
    )
}
