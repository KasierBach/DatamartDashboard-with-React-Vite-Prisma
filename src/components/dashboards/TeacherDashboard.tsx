import { Target } from 'lucide-react'
import { useMemo } from 'react'
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    Cell,
    ReferenceLine,
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
import { THEME_COLORS } from "./constants"
import { sampleData, formatOneDecimal } from "@/utils/dataUtils"

export function TeacherDashboard(props: DashboardProps) {
    const {
        data,
        avgScores,
        insights,
        scoreDistribution,
        educationData,
    } = props;

    // Fallback logic for At Risk List
    const effectiveAtRiskList = useMemo(() => {
        return insights.atRiskList.length > 0
            ? insights.atRiskList
            : data.filter(d => (d.test_math || 0) < 5.0 || (d.test_literature || 0) < 5.0).slice(0, 10);
    }, [data, insights.atRiskList]);

    const scatterData = useMemo(() => {
        return sampleData(data, 400).map(d => ({
            attendance: d.attendance_rate || 0,
            gpa: d.gpa_overall || 0,
            name: `HS ${d.student_uid}`
        }));
    }, [data]);

    // High Effort, Low Results
    const focusList = useMemo(() => {
        return data
            .filter(d => (d.attendance_rate || 0) >= 90 && (d.gpa_overall || 0) < 6.5)
            .sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0))
            .slice(0, 5);
    }, [data]);

    // Quality Matrix: Test Score vs GPA
    const qualityMatrixData = useMemo(() => {
        return sampleData(data, 250).map(d => ({
            test: d.test_average || ((d.test_math || 0) + (d.test_literature || 0)) / 2,
            gpa: d.gpa_overall || 0,
            name: `HS ${d.student_uid}`
        }));
    }, [data]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start">
                    <Target className="h-5 w-5 text-blue-600 mt-1 mr-2" />
                    <div>
                        <h3 className="font-bold text-blue-800">Tương quan Chuyên cần & Điểm số</h3>
                        <p className="text-sm text-blue-700 mt-2">
                            Biểu đồ dưới đây giúp thầy/cô nhận diện học sinh có điểm thấp do nghỉ học nhiều (góc dưới bên trái).
                        </p>
                    </div>
                </div>
            </div>

            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Phân tích Tác động của Chuyên cần đến Kết quả học tập</CardTitle>
                    <CardDescription>Mỗi điểm tròn đại diện cho một học sinh. Trục tung: Điểm TB, Trục hoành: Tỷ lệ Chuyên cần.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="attendance" name="Chuyên cần" unit="%" domain={[0, 100]} label={{ value: 'Tỷ lệ đi học (%)', position: 'insideBottom', offset: -10 }} />
                            <YAxis type="number" dataKey="gpa" name="Điểm TB" unit="" domain={[0, 10]} label={{ value: 'Điểm Trung bình', angle: -90, position: 'insideLeft' }} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white p-2 border rounded shadow-sm text-sm">
                                            <p className="font-bold">{d.name}</p>
                                            <p>GPA: {formatOneDecimal(d.gpa)}</p>
                                            <p>Chuyên cần: {d.attendance}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <Scatter name="Học sinh" data={scatterData} fill="#8884d8">
                                {scatterData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(entry.attendance || 0) < 80 ? '#ef4444' : (entry.gpa || 0) < 5.0 ? '#f59e0b' : '#3b82f6'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ma trận Chất lượng (Test vs GPA)</CardTitle>
                        <CardDescription>So sánh Điểm thi (trục hoành) và GPA (trục tung) để đánh giá độ lệch.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="test" name="Điểm Thi" unit="" domain={[0, 10]} label={{ value: 'Điểm Thi TB', position: 'insideBottom', offset: -10 }} />
                                <YAxis type="number" dataKey="gpa" name="GPA" unit="" domain={[0, 10]} label={{ value: 'Điểm GPA', angle: -90, position: 'insideLeft' }} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Legend />
                                <ReferenceLine x={5} stroke="red" strokeDasharray="3 3" />
                                <ReferenceLine y={5} stroke="red" strokeDasharray="3 3" />
                                <Scatter name="Học sinh" data={qualityMatrixData} fill="#8884d8">
                                    {qualityMatrixData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.gpa > entry.test + 1.5 ? '#f59e0b' : entry.gpa < entry.test - 1.5 ? '#ef4444' : '#22c55e'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cần quan tâm đặc biệt (Nỗ lực cao - KQ thấp)</CardTitle>
                        <CardDescription>HS đi học đầy đủ (&gt;90%) nhưng kết quả còn thấp (&lt;6.5).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Mã HS</TableHead><TableHead>Chuyên cần</TableHead><TableHead>GPA</TableHead><TableHead>Đánh giá</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {focusList.length > 0 ? focusList.map((s) => (
                                    <TableRow key={s.student_uid}>
                                        <TableCell>{s.student_uid}</TableCell>
                                        <TableCell className="text-green-600 font-bold">{s.attendance_rate}%</TableCell>
                                        <TableCell className="text-yellow-600 font-bold">{formatOneDecimal(s.gpa_overall)}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-600">Cần đổi mới PP</Badge></TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="text-center">Không có học sinh trong nhóm này</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tổng số HS</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{data.length.toLocaleString()}</div><p className="text-xs text-muted-foreground">Trong hệ thống</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Điểm TB</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-blue-600">{formatOneDecimal(avgScores.avg)}</div><p className="text-xs text-muted-foreground">Toán: {avgScores.math} | Văn: {avgScores.reading}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Chuyên cần</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-cyan-600">{avgScores.attendance}%</div><p className="text-xs text-muted-foreground">Tỷ lệ đi học TB</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">HS Xuất sắc</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-green-600">{insights.topPerformers}</div><p className="text-xs text-muted-foreground">GPA &gt;= 8.5</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cần hỗ trợ</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-red-600">{effectiveAtRiskList.length}</div><p className="text-xs text-muted-foreground">Điểm dưới chuẩn</p></CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Phân bố điểm lớp</CardTitle>
                        <CardDescription>Biểu đồ cột chồng thể hiện phân khúc điểm số của cả 3 môn.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistribution}>
                                <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                                <Bar dataKey="Math" name="Toán" fill={THEME_COLORS.math} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Reading" name="Văn" fill={THEME_COLORS.reading} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Average" name="Điểm TB" fill={THEME_COLORS.writing} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hiệu suất theo Phân hạng Học thuật</CardTitle>
                        <CardDescription>So sánh điểm giữa các nhóm Academic Tier.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={educationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />
                                <Bar dataKey="Math" name="Toán" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Reading" name="Văn" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Danh sách Học sinh cần lưu ý</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Mã SV</TableHead><TableHead>Phân hạng</TableHead><TableHead>Toán</TableHead><TableHead>Văn</TableHead><TableHead>Điểm TB</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {effectiveAtRiskList.slice(0, 5).map((student: any) => (
                                <TableRow key={student.student_uid || student.id}>
                                    <TableCell className="font-medium">{student.student_uid}</TableCell>
                                    <TableCell>{student.academic_tier}</TableCell>
                                    <TableCell className={(student.test_math || 0) < 5.0 ? "text-red-500 font-bold bg-red-50" : ""}>{student.test_math || 0}</TableCell>
                                    <TableCell className={(student.test_literature || 0) < 5.0 ? "text-red-500 font-bold bg-red-50" : ""}>{student.test_literature || 0}</TableCell>
                                    <TableCell className={(student.test_average || 0) < 5.0 ? "text-red-500 font-bold bg-red-50" : ""}>{formatOneDecimal(student.test_average || ((student.test_math || 0) + (student.test_literature || 0)) / 2)}</TableCell>
                                    <TableCell><span className="text-red-500 font-bold">Rủi ro</span></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
