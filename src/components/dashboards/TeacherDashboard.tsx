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
import { THEME_COLORS, SCORE_THRESHOLDS } from "./constants"
import { InsightBanner } from "@/components/ui/InsightBanner"
import { sampleData, formatOneDecimal } from "@/utils/dataUtils"

// Helper component for Data Context Overlay
const DataStats = ({ n, range, avg }: { n: number, range?: string, avg?: number | string }) => (
    <div className="mt-2 pt-2 border-t border-dashed flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">N: <strong>{n.toLocaleString()}</strong> HS</span>
        {range && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Phạm vi: <strong>{range}</strong></span>}
        {avg && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">TB: <strong>{avg}</strong></span>}
    </div>
);

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
        return (insights?.atRiskList?.length || 0) > 0
            ? insights.atRiskList
            : (data || []).filter(d => (d.test_math || 0) < SCORE_THRESHOLDS.AT_RISK || (d.test_literature || 0) < SCORE_THRESHOLDS.AT_RISK).slice(0, 10);
    }, [data, insights?.atRiskList]);

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

    const renderMomentum = (id: string | number) => {
        const diff = momentumMap[String(id)];
        if (diff === undefined) return null;
        if (diff > 0.2) return <span className="text-green-600 ml-1 font-bold" title={`Tăng ${formatOneDecimal(diff)} điểm`}>📈</span>;
        if (diff < -0.2) return <span className="text-red-600 ml-1 font-bold" title={`Giảm ${formatOneDecimal(Math.abs(diff))} điểm`}>📉</span>;
        return null;
    };

    return (
        <div className="space-y-6">
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

            <div className="flex flex-col md:flex-row gap-4">
                <InsightBanner variant="info" title="Tương quan Chuyên cần & Điểm số" className="flex-1">
                    <p>
                        Dựa trên dữ liệu chuyên cần, thầy/cô có thể nhận diện học sinh có điểm thấp do nghỉ học nhiều (góc dưới bên trái).
                    </p>
                </InsightBanner>
            </div>

            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Phân tích Tác động của Chuyên cần đến Kết quả học tập</CardTitle>
                    <CardDescription>
                        Trực quan hóa mối liên hệ giữa việc đi học và điểm số.
                        <strong> Insight:</strong> {scatterData.length > 0 ? (scatterData.filter(d => d.attendance < 80 && d.gpa < 5).length > 0 ? `Có ${scatterData.filter(d => d.attendance < 80 && d.gpa < 5).length} học sinh đang ở vùng nguy hiểm (Nghỉ học nhiều & Điểm thấp).` : 'Đa số học sinh duy trì chuyên cần tốt, điểm số ổn định.') : 'Đang xử lý dữ liệu chuyên cần...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
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
                    </div>
                    <DataStats n={data.length} range="0 - 100%" avg={`${avgScores.attendance}% (Chuyên cần)`} />
                    <div className="mt-2 text-xs text-blue-600 font-medium italic">
                        💡 <strong>Mẹo:</strong> Tập trung kéo học sinh từ vùng <strong>Màu đỏ</strong> sang vùng <strong>Màu xanh</strong> bằng cách cải thiện tỷ lệ chuyên cần.
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Phân bổ điểm lớp</CardTitle>
                        <CardDescription>
                            Biểu đồ thể hiện phân khúc năng lực của học sinh.
                            <strong> Insight:</strong> {avgScores.math > 0 || avgScores.reading > 0 ? `Môn ${avgScores.math > avgScores.reading ? 'Toán (TB: ' + avgScores.math + ')' : 'Văn (TB: ' + avgScores.reading + ')'} đang dẫn đầu về mặt điểm số.` : 'Đang phân tích phổ điểm...'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreDistribution}>
                                    <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                                    <Bar dataKey="Math" name="Toán" fill={THEME_COLORS.math} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Reading" name="Văn" fill={THEME_COLORS.reading} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Average" name="Điểm TB" fill={THEME_COLORS.writing} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <DataStats n={data.length} range="Yếu - Giỏi" avg={formatOneDecimal(avgScores.avg)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hiệu suất theo Phân hạng Học thuật</CardTitle>
                        <CardDescription>So sánh điểm giữa các nhóm Academic Tier.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={educationData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />
                                    <Bar dataKey="Math" name="Toán" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Reading" name="Văn" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ma trận Chất lượng (Test vs GPA)</CardTitle>
                        <CardDescription>
                            Đánh giá sự đồng quán giữa điểm thi và điểm quá trình.
                            <strong> Insight:</strong> {qualityMatrixData.filter(d => Math.abs(d.gpa - d.test) > 1.5).length > 0 ? `Phát hiện ${qualityMatrixData.filter(d => Math.abs(d.gpa - d.test) > 1.5).length} trường hợp có độ lệch điểm cao (>1.5), cần kiểm tra tính khách quan.` : 'Điểm thi và GPA có sự tương quan tốt, phản ánh đúng năng lực thực tế.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
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
                        </div>
                        <DataStats n={data.length} range="0 - 10" avg={formatOneDecimal(avgScores.avg)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cần quan tâm đặc biệt (Nỗ lực cao - KQ thấp)</CardTitle>
                        <CardDescription>HS đi học đầy đủ (&gt;90%) nhưng GPA &lt; 6.5. Nhóm này cần đổi mới phương pháp tiếp cận.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Mã HS</TableHead><TableHead>Chuyên cần</TableHead><TableHead>GPA</TableHead><TableHead>Đánh giá</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {focusList.length > 0 ? focusList.map((s) => (
                                    <TableRow key={s.student_uid}>
                                        <TableCell className="flex items-center">{s.student_uid} {renderMomentum(s.student_uid || '')}</TableCell>
                                        <TableCell className="text-green-600 font-bold">{s.attendance_rate}%</TableCell>
                                        <TableCell className="text-yellow-600 font-bold">{formatOneDecimal(s.gpa_overall)}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-600">Cần đổi mới PP</Badge></TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="text-center">Không có học sinh trong nhóm này</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                        <DataStats n={focusList.length} avg={`${(focusList.reduce((acc, s) => acc + (s.gpa_overall || 0), 0) / (focusList.length || 1)).toFixed(1)} (GPA TB Nhóm)`} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Học sinh cần lưu ý</CardTitle>
                    <CardDescription>Nhóm học sinh có điểm dưới chuẩn rủi ro học thuật.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Mã SV</TableHead><TableHead>Phân hạng</TableHead><TableHead>Toán</TableHead><TableHead>Văn</TableHead><TableHead>Điểm TB</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {(effectiveAtRiskList || []).slice(0, 5).map((student: any) => (
                                <TableRow key={student.student_uid || student.id}>
                                    <TableCell className="font-medium flex items-center">{student.student_uid} {renderMomentum(student.student_uid || student.id || '')}</TableCell>
                                    <TableCell>{student.academic_tier}</TableCell>
                                    <TableCell className={(student.test_math || 0) < 5.0 ? "text-red-500 font-bold bg-red-50" : ""}>{student.test_math || 0}</TableCell>
                                    <TableCell className={(student.test_literature || 0) < 5.0 ? "text-red-500 font-bold bg-red-50" : ""}>{student.test_literature || 0}</TableCell>
                                    <TableCell className={(student.test_average || 0) < 5.0 ? "text-red-500 font-bold bg-red-50" : ""}>{formatOneDecimal(student.test_average || ((student.test_math || 0) + (student.test_literature || 0)) / 2)}</TableCell>
                                    <TableCell><span className="text-red-500 font-bold">Rủi ro</span></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <DataStats n={effectiveAtRiskList.length} avg={`${(effectiveAtRiskList.reduce((acc, s) => acc + (s.test_average || 0), 0) / (effectiveAtRiskList.length || 1)).toFixed(1)} (GPA TB rủi ro)`} />
                </CardContent>
            </Card>
        </div>
    );
}
