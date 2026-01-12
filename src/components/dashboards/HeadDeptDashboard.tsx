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
import { InsightBanner } from "@/components/ui/InsightBanner"
import { THEME_COLORS } from "./constants"
import { formatOneDecimal } from "@/utils/dataUtils"

// Helper component for Data Context Overlay
const DataStats = ({ n, range, avg }: { n: number, range?: string, avg?: number | string }) => (
    <div className="mt-2 pt-2 border-t border-dashed flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">N: <strong>{n.toLocaleString()}</strong> HS/Trường</span>
        {range && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Phạm vi: <strong>{range}</strong></span>}
        {avg && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-teal-600">TB: <strong>{avg}</strong></span>}
    </div>
);

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
            <InsightBanner variant="teal" title="Chất lượng Bộ môn & Giảng dạy">
                <p>
                    Điểm trung bình môn <strong>Toán</strong> {Math.abs(avgScores.math - avgScores.reading) > 0.1 ? (avgScores.math > avgScores.reading ? 'đang cao hơn' : 'đang thấp hơn') : 'đang tương đương'} <strong>Văn</strong> khoảng <strong>{formatOneDecimal(Math.abs(avgScores.math - avgScores.reading))}</strong> điểm.
                    <br />
                    <strong>Đề xuất:</strong> {avgScores.reading < avgScores.math ? 'Tổ chức hội thảo chuyên đề "Đổi mới phương pháp dạy Văn" vào tháng tới.' : 'Tiếp tục duy trì và phát huy các mô hình học tập hiện tại.'}
                </p>
            </InsightBanner>

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
                <CardHeader>
                    <CardTitle>Phổ điểm chi tiết từng môn</CardTitle>
                    <CardDescription>
                        Đánh giá mức độ đồng đều trong kết quả học tập.
                        <strong> Insight:</strong> {avgScores.math > avgScores.reading ? 'Môn Toán đang có kết quả khả quan hơn môn Văn.' : 'Môn Văn đang có kết quả khả quan hơn môn Toán.'} Cần rà soát các phân khúc điểm thấp.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                                <Bar dataKey="Math" name="Toán" fill={THEME_COLORS.math} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Reading" name="Văn" fill={THEME_COLORS.reading} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Average" name="Điểm TB" fill={THEME_COLORS.writing} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <DataStats n={data.length} range="0 - 10" avg={formatOneDecimal(avgScores.average)} />
                </CardContent>
            </Card>

            <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                <CardHeader><CardTitle>Phân tích Tương quan: Tự nhiên vs Xã hội</CardTitle><CardDescription>Biểu đồ phân tán (Scatter Plot) thể hiện mối liên hệ năng lực giữa Toán và Đọc hiểu.</CardDescription></CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid /><XAxis type="number" dataKey="math" name="Điểm Toán" unit="" domain={[0, 10]} /><YAxis type="number" dataKey="reading" name="Điểm Văn" unit="" domain={[0, 10]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Legend />
                                <Scatter name="Học sinh" data={correlationData} fill="#059669" shape="circle" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Hiệu suất theo Khối lớp</CardTitle><CardDescription>So sánh điểm trung bình giữa các khối 10, 11, 12.</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gradePerformance} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} /><XAxis type="number" domain={[0, 10]} /><YAxis dataKey="name" type="category" width={80} /><Tooltip cursor={{ fill: '#f0f9ff' }} />
                                    <Bar dataKey="value" name="Điểm TB" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={32}>
                                        <LabelList dataKey="value" position="right" fill="#0f766e" fontSize={12} formatter={(val: any) => formatOneDecimal(val)} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cần hỗ trợ theo Trường</CardTitle>
                        <CardDescription>
                            Top 5 trường có điểm trung bình thấp nhất.
                            <strong> Ghi nhận:</strong> Cần cử cán bộ chuyên môn kiểm tra tình hình dạy và học tại các đơn vị này.
                        </CardDescription>
                    </CardHeader>
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
                        <DataStats n={schools.length} avg={`${(lowPerformingSchools.reduce((acc, s) => acc + (s.avg_gpa || 0), 0) / (lowPerformingSchools.length || 1)).toFixed(1)} (GPA TB Nhóm)`} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
