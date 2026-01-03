import { BookOpen } from 'lucide-react'
import { useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
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
import { THEME_COLORS } from "./constants"
import { formatOneDecimal } from "@/utils/dataUtils"

export function HeadDeptDashboard(props: DashboardProps) {
    const {
        avgScores,
        scoreDistribution,
        correlationData,
        schools,
        data
    } = props;

    // Calculate Grade (Block) Performance
    const gradePerformance = useMemo(() => [10, 11, 12].map(grade => {
        const studentsInGrade = data.filter(s => String(s.grade) === String(grade));
        const avg = studentsInGrade.length
            ? studentsInGrade.reduce((sum, s) => sum + (((s.test_math || 0) + (s.test_literature || 0)) / 2), 0) / studentsInGrade.length
            : 0;
        return { name: `Khối ${grade}`, value: parseFloat(formatOneDecimal(avg)) };
    }), [data]);

    const lowPerformingSchools = useMemo(() => [...schools]
        .sort((a, b) => (a.avg_gpa || 0) - (b.avg_gpa || 0))
        .slice(0, 5), [schools]);

    return (
        <div className="space-y-6">
            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded shadow-sm flex items-start">
                <BookOpen className="h-6 w-6 text-teal-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-teal-800">Chất lượng Bộ môn & Giảng dạy</h3>
                    <p className="text-teal-700 mt-1">
                        Điểm trung bình môn <strong>Toán</strong> đang cao hơn <strong>Văn</strong> khoảng 0.5 điểm.
                        <br />
                        <strong>Đề xuất:</strong> Tổ chức hội thảo chuyên đề "Đổi mới phương pháp dạy Văn" vào tháng tới.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">TB Môn Toán</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-blue-600">{formatOneDecimal(avgScores.math)}</div><p className="text-xs text-muted-foreground">Trên 10.0</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">TB Môn Văn</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-purple-600">{formatOneDecimal(avgScores.reading)}</div><p className="text-xs text-muted-foreground">Trên 10.0</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Điểm TB Chung</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-yellow-600">{formatOneDecimal(avgScores.average)}</div><p className="text-xs text-muted-foreground">Toán + Văn</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Chuyên cần</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-cyan-600">{avgScores.attendance}%</div><p className="text-xs text-muted-foreground">Tỷ lệ đi học</p></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Phổ điểm chi tiết từng môn</CardTitle><CardDescription>So sánh phân phối điểm số để phát hiện sự lệch chuẩn.</CardDescription></CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                            <Bar dataKey="Math" name="Toán" fill={THEME_COLORS.math} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Reading" name="Văn" fill={THEME_COLORS.reading} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Average" name="Điểm TB" fill={THEME_COLORS.writing} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Hiệu suất theo Khối lớp</CardTitle><CardDescription>So sánh điểm trung bình giữa các khối 10, 11, 12.</CardDescription></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gradePerformance} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} /><XAxis type="number" domain={[0, 10]} /><YAxis dataKey="name" type="category" width={80} /><Tooltip cursor={{ fill: '#f0f9ff' }} />
                                <Bar dataKey="value" name="Điểm TB" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={32}>
                                    <LabelList dataKey="value" position="right" fill="#0f766e" fontSize={12} formatter={(val: any) => formatOneDecimal(val)} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Cần hỗ trợ theo Trường</CardTitle><CardDescription>Top 5 trường có điểm trung bình thấp cần lưu ý.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Tên Trường</TableHead><TableHead>TB</TableHead><TableHead>Đánh giá</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {lowPerformingSchools.map((s: any) => (
                                    <TableRow key={s.school_id}>
                                        <TableCell className="font-bold text-xs truncate max-w-[120px]">{s.school_name}</TableCell>
                                        <TableCell className="font-bold text-red-600">{formatOneDecimal(s.avg_gpa)}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px] border-red-500 text-red-600">Cần hỗ trợ</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                <CardHeader><CardTitle>Phân tích Tương quan: Tự nhiên vs Xã hội</CardTitle><CardDescription>Biểu đồ phân tán (Scatter Plot) thể hiện mối liên hệ năng lực giữa Toán và Đọc hiểu.</CardDescription></CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid /><XAxis type="number" dataKey="math" name="Điểm Toán" unit="" domain={[0, 10]} /><YAxis type="number" dataKey="reading" name="Điểm Văn" unit="" domain={[0, 10]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Legend />
                            <Scatter name="Học sinh" data={correlationData} fill="#059669" shape="circle" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
