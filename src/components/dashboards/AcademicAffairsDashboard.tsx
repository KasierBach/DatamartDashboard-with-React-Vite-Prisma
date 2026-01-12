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
import { THEME_COLORS, SCORE_THRESHOLDS } from "./constants"
import { InsightBanner } from "@/components/ui/InsightBanner"
import { formatOneDecimal } from "@/utils/dataUtils"

// Helper component for Data Context Overlay
const DataStats = ({ n, range, avg }: { n: number, range?: string, avg?: number | string }) => (
    <div className="mt-2 pt-2 border-t border-dashed flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">N: <strong>{n.toLocaleString()}</strong> HS</span>
        {range && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Phạm vi: <strong>{range}</strong></span>}
        {avg && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600">TB/Tỷ lệ: <strong>{avg}</strong></span>}
    </div>
);

export function AcademicAffairsDashboard(props: DashboardProps) {
    const {
        data,
        provinces,
        schools,
    } = props;

    // Optimized single-pass calculation for Academic Affairs metrics
    const { localPassRateStats, failMath, failLit, warnMath, warnLit, avgCompositeScore } = useMemo(() => {
        let fM = 0; let fL = 0; let fA = 0;
        let wM = 0; let wL = 0;
        let totalComposite = 0;

        data.forEach(d => {
            const m = Number(d.test_math || 0);
            const l = Number(d.test_literature || 0);
            const avg = Number(d.test_average || (m + l) / 2 || 0);

            if (m < SCORE_THRESHOLDS.AT_RISK) fM++;
            else if (m < 6.0) wM++;

            if (l < SCORE_THRESHOLDS.AT_RISK) fL++;
            else if (l < 6.0) wL++;

            if (avg < SCORE_THRESHOLDS.AT_RISK) fA++;
            totalComposite += (d.composite_score || 0);
        });

        const count = data.length || 1;

        return {
            localPassRateStats: [
                { subject: 'Toán', fail: fM, warn: wM, total: data.length },
                { subject: 'Văn', fail: fL, warn: wL, total: data.length },
                { subject: 'TB Chung', fail: fA, total: data.length },
            ],
            failMath: fM,
            failLit: fL,
            warnMath: wM,
            warnLit: wL,
            avgCompositeScore: formatOneDecimal(totalComposite / count)
        };
    }, [data]);

    // Retention Warning System: Attendance < 70% AND GPA < 5.0 (Strict Check)
    // Fallback: If no strict risk, show bottom GPA performers
    const { retentionRiskList, isFallbackRisk } = useMemo(() => {
        let list = data.filter(d => (d.attendance_rate || 0) < 70 && (d.gpa_overall || 0) < 5.0);
        let fallback = false;

        if (list.length === 0) {
            list = [...data].sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0)).slice(0, 10);
            fallback = true;
        }

        return {
            retentionRiskList: list.sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0)).slice(0, 10),
            isFallbackRisk: fallback
        };
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
    const { criticalStudents, isFallbackCritical } = useMemo(() => {
        let list = data.filter(d => Number(d.test_average || ((d.test_math || 0) + (d.test_literature || 0)) / 2 || 0) < 3.5);
        let fallback = false;

        if (list.length === 0) {
            list = [...data].sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0)).slice(0, 20);
            fallback = true;
        }
        return {
            criticalStudents: list.slice(0, 50),
            isFallbackCritical: fallback
        };
    }, [data]);

    // Risk Heatmap Aggregation (Grade vs Subject)
    const heatmapData = useMemo(() => {
        const grades = ['10', '11', '12'];

        return grades.map(grade => {
            const studentsInGrade = data.filter(d => String(d.grade) === grade);
            const total = studentsInGrade.length || 1;

            const row: any = { grade: `Khối ${grade}` };

            // Math Risk (< 5.5)
            row.math = (studentsInGrade.filter(d => (d.test_math || 0) < SCORE_THRESHOLDS.AT_RISK).length / total) * 100;
            // Literature Risk (< 5.5)
            row.literature = (studentsInGrade.filter(d => (d.test_literature || 0) < SCORE_THRESHOLDS.AT_RISK).length / total) * 100;
            // GPA Risk (< 5.0)
            row.gpa = (studentsInGrade.filter(d => (d.gpa_overall || 0) < 5.0).length / total) * 100;
            // Attendance Risk (< 80%)
            row.attendance = (studentsInGrade.filter(d => (d.attendance_rate || 0) < 80).length / total) * 100;

            return row;
        });
    }, [data]);

    const getHeatmapColor = (value: number) => {
        if (value > 40) return 'bg-red-600 text-white';
        if (value > 25) return 'bg-red-400 text-white';
        if (value > 15) return 'bg-orange-300 text-orange-900';
        if (value > 5) return 'bg-yellow-200 text-yellow-900';
        return 'bg-green-100 text-green-800';
    };

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
            <InsightBanner
                variant={isFallbackCritical ? "warning" : "warning"}
                title={isFallbackCritical ? 'Giám sát Nhóm học lực thấp (Dự phòng)' : 'Cảnh báo Học vụ & Quy chế'}
            >
                <p>
                    {isFallbackCritical
                        ? <span>Không có học sinh rớt. Đang hiển thị <strong>{criticalStudents.length}</strong> học sinh có điểm thấp nhất để theo dõi.</span>
                        : <span>Phát hiện <strong>{criticalStudents.length}</strong> trường hợp có điểm trung bình dưới 3.5 (Cảnh báo mức 2).</span>
                    }
                    <br />
                    <strong>Hành động:</strong> {isFallbackCritical ? 'Tiếp tục theo dõi sát nhóm này.' : 'Gửi thông báo nhắc nhở đến GVCN và Phụ huynh trước ngày 25.'}
                </p>
            </InsightBanner>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cảnh báo học vụ (3 mức)</CardTitle></CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${isFallbackCritical ? 'text-amber-600' : 'text-red-600'}`}>{failMath + failLit}</div>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <div className="flex justify-between font-bold text-red-600"><span>Rớt (Toán/Văn):</span> <span>{failMath} / {failLit}</span></div>
                            <div className="flex justify-between text-amber-600"><span>Cảnh báo (Toán/Văn):</span> <span>{warnMath} / {warnLit}</span></div>
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

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Ma trận Rủi ro học vụ (Risk Heatmap)</CardTitle>
                    <CardDescription>
                        Phát hiện các "điểm nóng" rủi ro theo khối lớp.
                        <strong> Insight:</strong> {heatmapData.some(r => r.math > 30) ? 'Môn Toán đang có tỷ lệ rủi ro cao ở một số khối, cần rà soát lại phương pháp giảng dạy.' : 'Mức độ rủi ro phân bổ đồng đều, không có dấu hiệu bất thường nghiêm trọng.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 text-left bg-gray-50 border font-medium text-sm">Khối / Môn</th>
                                    <th className="p-3 text-center bg-gray-50 border font-medium text-sm">Toán (%)</th>
                                    <th className="p-3 text-center bg-gray-50 border font-medium text-sm">Văn (%)</th>
                                    <th className="p-3 text-center bg-gray-50 border font-medium text-sm">GPA (%)</th>
                                    <th className="p-3 text-center bg-gray-50 border font-medium text-sm">Chuyên cần (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {heatmapData.map((row) => (
                                    <tr key={row.grade}>
                                        <td className="p-3 border font-bold text-sm bg-gray-50">{row.grade}</td>
                                        <td className={`p-4 border text-center font-bold ${getHeatmapColor(row.math)}`}>{formatOneDecimal(row.math)}%</td>
                                        <td className={`p-4 border text-center font-bold ${getHeatmapColor(row.literature)}`}>{formatOneDecimal(row.literature)}%</td>
                                        <td className={`p-4 border text-center font-bold ${getHeatmapColor(row.gpa)}`}>{formatOneDecimal(row.gpa)}%</td>
                                        <td className={`p-4 border text-center font-bold ${getHeatmapColor(row.attendance)}`}>{formatOneDecimal(row.attendance)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-3 text-[10px] uppercase font-bold text-muted-foreground">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border"></div> An toàn</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-200 border"></div> Thấp</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-300 border"></div> Trung bình</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 border"></div> Cao</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 border"></div> Rất cao</div>
                    </div>
                    <DataStats n={data.length} range="Khối 10 - 12" avg={`${formatOneDecimal(heatmapData.reduce((acc, r) => acc + r.gpa, 0) / heatmapData.length)}% (Trung bình rủi ro GPA)`} />
                    <div className="mt-2 text-xs text-red-600 font-medium italic">
                        💡 <strong>Mẹo:</strong> Tập trung nguồn lực phụ đạo vào những ô có màu <strong>Đỏ (Cao/Rất cao)</strong> để giảm tỷ lệ lưu ban.
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tỷ lệ rớt theo môn học</CardTitle>
                        <CardDescription>
                            Đánh giá độ khó môn học.
                            <strong> Insight:</strong> {failMath > failLit ? 'Môn Toán' : 'Môn Văn'} đang là rào cản lớn nhất đối với học sinh.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={localPassRateStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" /><YAxis dataKey="subject" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="fail" fill={THEME_COLORS.math} name="Số HS yếu (<5.0)" barSize={25} label={{ position: 'right' }} />
                                    <Bar dataKey="warn" fill={THEME_COLORS.yellow} name="Cảnh báo (5.0-6.0)" barSize={15} label={{ position: 'right' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <DataStats n={data.length} avg={`${formatOneDecimal(((failMath + failLit) / (data.length * 2)) * 100)}% (Tỷ lệ cảnh báo)`} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Phân bổ Xếp loại Học lực</CardTitle>
                        <CardDescription>
                            Tình hình học thuật toàn hệ thống.
                            <strong> Insight:</strong> {totals.excellent + totals.good > totals.average + totals.below ? 'Đa số học sinh có học lực từ Khá trở lên.' : 'Tỷ lệ học sinh Trung bình/Yếu chiếm ưu thế, cần chú trọng nâng cao chất lượng đại trà.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
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
                        </div>
                        <DataStats n={data.length} range="0 - 1000+" avg={formatOneDecimal(avgCompositeScore)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cơ cấu Trường học (Loại hình & Cấp học)</CardTitle>
                        <CardDescription>Sự phân bổ quy mô đào tạo trong hệ thống.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex">
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
                        </div>
                    </CardContent>
                    <div className="px-6 pb-4">
                        <DataStats n={totalSchools} avg={`${totalProvinces} Tỉnh`} />
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cảnh báo Bỏ học (Retention Risk)</CardTitle>
                        <CardDescription>
                            {isFallbackRisk
                                ? "Dữ liệu dự phòng: Danh sách HS có GPA thấp nhất."
                                : "Người học có Chuyên cần < 70% và GPA < 5.0. Đây là nhóm có nguy cơ rời bỏ hệ thống cao nhất."}
                        </CardDescription>
                    </CardHeader>
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
                        <DataStats n={retentionRiskList.length} avg={`${(retentionRiskList.reduce((acc, s) => acc + (s.attendance_rate || 0), 0) / (retentionRiskList.length || 1)).toFixed(1)}% (Dự báo Chuyên cần)`} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 mt-6">
                <Card className="col-span-2 shadow-sm border-t-4 border-t-red-600">
                    <CardHeader>
                        <CardTitle>Danh sách Cảnh báo Học vụ (Dự kiến Buộc thôi học)</CardTitle>
                        <CardDescription>
                            Học sinh có điểm trung bình cực thấp (&lt; 3.5).
                            <strong> Ghi chú:</strong> {isFallbackCritical ? 'Hiển thị dữ liệu dự phòng do không có học sinh trượt.' : 'Cần can thiệp hành chính gấp.'}
                        </CardDescription>
                    </CardHeader>
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
                        <DataStats n={criticalStudents.length} avg={`${(criticalStudents.reduce((acc, s) => acc + (s.test_average || 0), 0) / (criticalStudents.length || 1)).toFixed(1)} (GPA TB Nhóm)`} />
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
