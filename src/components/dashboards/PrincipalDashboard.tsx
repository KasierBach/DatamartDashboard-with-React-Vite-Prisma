import { useState, useMemo, memo } from 'react'
import { Info, Activity, CheckCircle, Trophy, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Label,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ScatterChart,
    Scatter,
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
import { THEME_COLORS } from "./constants"
import { sampleData, formatOneDecimal } from "@/utils/dataUtils"

function PrincipalDashboardComponent(props: DashboardProps) {
    const {
        data,
        avgScores,
        insights,
        passRateStats,
        schools,
    } = props;

    // Pagination Calculations
    const ITEMS_PER_PAGE = 5;
    const [atRiskPage, setAtRiskPage] = useState(1);
    const [topPage, setTopPage] = useState(1);

    // Memoize at-risk list and filters
    const { effectiveAtRiskList, passRate } = useMemo(() => {
        const atRisk = insights.atRiskList.length > 0
            ? insights.atRiskList
            : [...data]
                .sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0))
                .slice(0, 20)
                .map(s => ({
                    ...s,
                    id: s.student_uid,
                    test_average: ((s.test_math || 0) + (s.test_literature || 0)) / 2,
                }));

        const passingCount = data.filter(d => (d.gpa_overall || 0) >= 5.0).length;
        const rate = data.length > 0 ? Math.round((passingCount / data.length) * 100) : 0;

        return { effectiveAtRiskList: atRisk, passRate: rate };
    }, [data, insights.atRiskList]);

    const totalAtRiskPages = Math.ceil(effectiveAtRiskList.length / ITEMS_PER_PAGE);
    const atRiskStart = (atRiskPage - 1) * ITEMS_PER_PAGE;
    const currentAtRisk = effectiveAtRiskList.slice(atRiskStart, atRiskStart + ITEMS_PER_PAGE);

    // Pagination calculations for Top Performers
    const totalTopPages = Math.ceil(insights.topList.length / ITEMS_PER_PAGE);
    const topStart = (topPage - 1) * ITEMS_PER_PAGE;
    const currentTop = insights.topList.slice(topStart, topStart + ITEMS_PER_PAGE);

    // Calculate School Age vs Performance for Scatter Chart
    const schoolAgeData = useMemo(() => {
        return sampleData(schools, 500).map(s => ({
            age: 2024 - (s.founding_year || 2000),
            gpa: s.avg_gpa || 0,
            name: s.school_name,
            students: s.total_students || 0
        })).filter(s => s.gpa > 0);
    }, [schools]);

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm flex items-start">
                <Info className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-blue-800">Tổng quan Chiến lược & KPIs</h3>
                    <p className="text-blue-700 mt-1">
                        Hiệu suất toàn trường đạt <strong>{formatOneDecimal(avgScores.avg)}/10.0</strong>, tăng nhẹ so với kỳ trước.
                        <br />
                        <strong>Điểm nhấn:</strong> Môn Toán có sự cải thiện rõ rệt (+3%).
                        <strong> Cần lưu ý:</strong> Tỷ lệ học sinh trong nhóm "Cần hỗ trợ" (At-Risk) môn Văn đang tăng nhẹ.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="shadow-sm border-t-4 border-t-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Điểm TB Toàn trường</CardTitle><Activity className="h-4 w-4 text-blue-500" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatOneDecimal(avgScores.avg)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Toán: {avgScores.math} | Văn: {avgScores.reading}</p>
                        <div className="h-1 w-full bg-gray-100 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${avgScores.avg * 10}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-t-4 border-t-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tỷ lệ Đạt chuẩn</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{passRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">GPA &gt;= 5.0</p>
                        <div className="h-1 w-full bg-gray-100 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${passRate}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-t-4 border-t-cyan-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tỷ lệ Chuyên cần</CardTitle><Activity className="h-4 w-4 text-cyan-500" /></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-cyan-600">{avgScores.attendance}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Trung bình đi học</p>
                        <div className="h-1 w-full bg-gray-100 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500" style={{ width: `${avgScores.attendance}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-t-4 border-t-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Học sinh Xuất sắc</CardTitle><Trophy className="h-4 w-4 text-yellow-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-yellow-600">{insights.topPerformers}</div><p className="text-xs text-muted-foreground mt-1">GPA &gt;= 8.5</p></CardContent>
                </Card>
                <Card className="shadow-sm border-t-4 border-t-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cảnh báo rủi ro</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{effectiveAtRiskList.length}</div><p className="text-xs text-muted-foreground mt-1">Học sinh dưới chuẩn</p></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader><CardTitle>Hiệu suất theo Tỉnh thành (Top 10)</CardTitle><CardDescription>So sánh điểm trung bình GPA giữa các tỉnh thành.</CardDescription></CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={props.provincePerformance} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} /><XAxis type="number" domain={[0, 10]} /><YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} /><Tooltip />
                                <Bar dataKey="avg" name="Điểm TB" fill={THEME_COLORS.math} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader><CardTitle>Top 5 Trường dẫn đầu</CardTitle><CardDescription>Xếp hạng theo điểm GPA trung bình.</CardDescription></CardHeader>
                    <CardContent className="h-[350px]">
                        <div className="space-y-4">
                            {props.topSchools.map((school, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{i + 1}</div>
                                        <div><p className="font-semibold text-sm truncate w-40">{school.name}</p><p className="text-xs text-muted-foreground">{school.students} học sinh</p></div>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 border-green-200">{formatOneDecimal(school.avg)}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Phân bổ Chất lượng</CardTitle><CardDescription>Tỷ lệ Giỏi - Khá - TB - Yếu</CardDescription></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Khá/Giỏi', value: data.length - effectiveAtRiskList.length, fill: '#22c55e' },
                                        { name: 'Yếu/Kém', value: effectiveAtRiskList.length, fill: '#ef4444' }
                                    ]}
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                ><Label width={30} position="center">Tổng quát</Label></Pie>
                                <Tooltip /><Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardHeader><CardTitle>Cảnh báo sụt giảm theo Môn</CardTitle><CardDescription>Tỷ lệ Đạt chuẩn (%) của từng bộ môn trọng tâm.</CardDescription></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={passRateStats} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="subject" /><YAxis domain={[0, 100]} /><Tooltip /><Legend />
                                <Bar dataKey="rate" fill="#3b82f6" name="Tỷ lệ Đạt (%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <Card className="col-span-2 shadow-sm border-t-4 border-t-blue-500">
                    <CardHeader><CardTitle>Chi tiết: Danh sách Cảnh báo Rủi ro & Tiềm năng</CardTitle><CardDescription>Danh sách chi tiết các học sinh cần lưu ý.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-red-600 mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Cảnh báo Rủi ro ({effectiveAtRiskList.length})</h4>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-red-50"><TableRow><TableHead>ID</TableHead><TableHead>Họ tên</TableHead><TableHead>Điểm TB</TableHead><TableHead>Vấn đề chính</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {currentAtRisk.length > 0 ? (
                                            currentAtRisk.map((s: any) => (
                                                <TableRow key={s.id}><TableCell className="font-medium">{s.id}</TableCell><TableCell>Học sinh {s.id}</TableCell><TableCell className="font-bold text-red-600">{formatOneDecimal(s.gpa_overall)}</TableCell><TableCell className="text-red-500">{(s.test_math || 0) < 5.0 ? 'Toán yếu ' : ''}{(s.test_literature || 0) < 5.0 ? 'Văn yếu ' : ''}</TableCell><TableCell><Badge variant="destructive" className="bg-red-600">Cần can thiệp</Badge></TableCell></TableRow>
                                            ))
                                        ) : <TableRow><TableCell colSpan={5} className="text-center py-4">Không có học sinh rủi ro</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-muted-foreground italic">Trang {atRiskPage} / {totalAtRiskPages || 1}</span>
                                <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setAtRiskPage(p => Math.max(1, p - 1))} disabled={atRiskPage === 1} className="h-8 px-2"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setAtRiskPage(p => Math.min(totalAtRiskPages, p + 1))} disabled={atRiskPage === totalAtRiskPages || totalAtRiskPages === 0} className="h-8 px-2"><ChevronRight className="h-4 w-4" /></Button></div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-yellow-600 mb-2 flex items-center"><Trophy className="w-4 h-4 mr-2" /> Học sinh Tiềm năng ({insights.topList.length})</h4>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-yellow-50"><TableRow><TableHead>ID</TableHead><TableHead>Họ tên</TableHead><TableHead>Điểm TB</TableHead><TableHead>Môn Nổi bật</TableHead><TableHead>Xếp loại</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {currentTop.length > 0 ? (
                                            currentTop.map((s: any) => (
                                                <TableRow key={s.id}><TableCell className="font-medium">{s.id}</TableCell><TableCell>Học sinh {s.id}</TableCell><TableCell className="font-bold text-green-600">{formatOneDecimal(s.gpa_overall)}</TableCell><TableCell>{Math.max(s.test_math || 0, s.test_literature || 0) === (s.test_math || 0) ? 'Toán' : 'Văn'}</TableCell><TableCell><Badge className="bg-yellow-500 hover:bg-yellow-600">Xuất sắc</Badge></TableCell></TableRow>
                                            ))
                                        ) : <TableRow><TableCell colSpan={5} className="text-center py-4">Chưa có dữ liệu</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-muted-foreground italic">Trang {topPage} / {totalTopPages || 1}</span>
                                <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setTopPage(p => Math.max(1, p - 1))} disabled={topPage === 1} className="h-8 px-2"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setTopPage(p => Math.min(totalTopPages, p + 1))} disabled={topPage === totalTopPages || totalTopPages === 0} className="h-8 px-2"><ChevronRight className="h-4 w-4" /></Button></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-t-4 border-t-purple-500 shadow-sm">
                <CardHeader><CardTitle>Phân tích Thâm niên Trường & Chất lượng</CardTitle></CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid /><XAxis type="number" dataKey="age" name="Tuổi đời" unit=" năm" /><YAxis type="number" dataKey="gpa" name="GPA TB" domain={[0, 10]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Trường học" data={schoolAgeData} fill="#8884d8">
                                {schoolAgeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.gpa >= 8.0 ? '#22c55e' : entry.gpa >= 6.5 ? '#3b82f6' : '#f59e0b'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

export const PrincipalDashboard = memo(PrincipalDashboardComponent);
