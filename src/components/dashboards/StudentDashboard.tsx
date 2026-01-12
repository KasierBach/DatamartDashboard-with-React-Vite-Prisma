import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DashboardProps } from "./types"
import { SCORE_THRESHOLDS } from "./constants"
import { InsightBanner } from "@/components/ui/InsightBanner"
import { formatOneDecimal } from "@/utils/dataUtils"

// Helper component for Data Context Overlay
const DataStats = ({ n, range, avg }: { n: number, range?: string, avg?: number | string }) => (
    <div className="mt-2 pt-2 border-t border-dashed flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">N: <strong>{n.toLocaleString()}</strong> H/Sinh lớp</span>
        {range && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Vị thế: <strong>{range}</strong></span>}
        {avg && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-sky-600">TB Lớp: <strong>{avg}</strong></span>}
    </div>
);

export function StudentDashboard(props: DashboardProps) {
    const {
        avgScores,
        data
    } = props;

    // Mock user context: taking the first student as the "current user"
    const student = data[0] || {};
    const attendanceRate = student.attendance_rate || 0;

    // Calculate ranking based on GPA
    const sortedStudents = [...(data || [])].sort((a, b) => (b.gpa_overall || 0) - (a.gpa_overall || 0));
    const rank = student?.student_uid ? sortedStudents.findIndex(s => s.student_uid === student.student_uid) + 1 : 0;

    return (
        <div className="space-y-6">
            <InsightBanner variant="sky" title="Góc học tập của bạn">
                <p>
                    Chào em, năng lực học tập của em đang được theo dõi sát sao.
                    Hãy cố gắng duy trì phong độ và dành thời gian ôn tập cho các môn còn yếu.
                </p>
            </InsightBanner>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-100">Điểm TB Tích lũy</CardTitle></CardHeader>
                    <CardContent><div className="text-4xl font-bold">{formatOneDecimal(avgScores.avg)}</div><p className="text-xs text-blue-100 mt-1">Hệ 10</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Xếp hạng lớp</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-gray-700">{rank}/{data.length}</div><p className="text-xs text-muted-foreground">Top {Math.round(rank / data.length * 100)}%</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Điểm Tổng hợp</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-green-600">{formatOneDecimal(student.composite_score || 0)}</div><p className="text-xs text-muted-foreground">Composite Score</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Chuyên cần</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-purple-600">{attendanceRate}%</div><p className="text-xs text-muted-foreground">Tỷ lệ tham gia</p></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Biểu đồ năng lực cá nhân</CardTitle>
                        <CardDescription>
                            Góc nhìn đa chiều về các kỹ năng của em.
                            <strong> Insight:</strong> {(student.gpa_overall || 0) >= avgScores.avg ? 'Năng lực tổng thể của em đang tốt hơn trung bình lớp. Hãy duy trì thế mạnh.' : 'Em cần nỗ lực hơn để bám đuổi kịp mặt bằng chung của lớp.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                    { subject: 'Toán', A: student.test_math || 0, B: avgScores.math, fullMark: 10 },
                                    { subject: 'Văn', A: student.test_literature || 0, B: avgScores.reading, fullMark: 10 },
                                    { subject: 'TB', A: ((student.test_math || 0) + (student.test_literature || 0)) / 2, B: avgScores.average, fullMark: 10 },
                                    { subject: 'GPA', A: student.gpa_overall || 0, B: avgScores.avg, fullMark: 10 },
                                    { subject: 'Cần cù', A: (student.attendance_rate || 0) / 10, B: avgScores.attendance / 10, fullMark: 10 },
                                ]}>
                                    <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis angle={30} domain={[0, 10]} />
                                    <Radar name="Bạn" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                    <Radar name="TB Lớp" dataKey="B" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.3} />
                                    <Legend /><Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <DataStats n={data.length} range={`Top ${Math.round(rank / data.length * 100)}%`} avg={formatOneDecimal(avgScores.avg)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Lộ trình điểm số</CardTitle><CardDescription>So sánh cá nhân với lớp.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Toán', Bạn: student.test_math || 0, Lớp: avgScores.math },
                                    { name: 'Văn', Bạn: student.test_literature || 0, Lớp: avgScores.reading },
                                    { name: 'GPA', Bạn: student.gpa_overall || 0, Lớp: avgScores.avg },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />
                                    <Bar dataKey="Bạn" fill="#3b82f6" radius={[4, 4, 0, 0]} /><Bar dataKey="Lớp" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Chi tiết Điểm số từng môn</CardTitle>
                    <CardDescription>Bảng điểm chi tiết và đánh giá định hướng học tập.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Môn học</TableHead><TableHead>Điểm của bạn</TableHead><TableHead>TB Lớp</TableHead><TableHead>Chênh lệch</TableHead><TableHead>Đánh giá</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Toán</TableCell>
                                <TableCell className="font-bold">{student.test_math}</TableCell>
                                <TableCell>{formatOneDecimal(avgScores.math)}</TableCell>
                                <TableCell className={(student.test_math || 0) >= avgScores.math ? "text-green-600" : "text-red-600"}>
                                    {((student.test_math || 0) - avgScores.math).toFixed(1)}
                                </TableCell>
                                <TableCell>{(student.test_math || 0) >= SCORE_THRESHOLDS.PASSING ? 'Đạt' : 'Cần cố gắng'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Ngữ Văn</TableCell>
                                <TableCell className="font-bold">{student.test_literature}</TableCell>
                                <TableCell>{formatOneDecimal(avgScores.reading)}</TableCell>
                                <TableCell className={(student.test_literature || 0) >= avgScores.reading ? "text-green-600" : "text-red-600"}>
                                    {((student.test_literature || 0) - avgScores.reading).toFixed(1)}
                                </TableCell>
                                <TableCell>{(student.test_literature || 0) >= SCORE_THRESHOLDS.PASSING ? 'Đạt' : 'Cần cố gắng'}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <DataStats n={data.length} range={`Xếp hạng: ${rank}/${data.length}`} avg={formatOneDecimal(avgScores.avg)} />
                </CardContent>
            </Card>
        </div>
    )
}
