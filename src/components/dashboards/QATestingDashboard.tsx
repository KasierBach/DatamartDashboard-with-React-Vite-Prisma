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
    LineChart,
    Line,
    Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardProps } from "./types"
import { InsightBanner } from "@/components/ui/InsightBanner"
import { THEME_COLORS } from "./constants"
import { groupByName, sampleData, formatOneDecimal } from "@/utils/dataUtils"

// Helper component for Data Context Overlay
const DataStats = ({ n, range, avg }: { n: number, range?: string, avg?: number | string }) => (
    <div className="mt-2 pt-2 border-t border-dashed flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="bg-gray-100 px-1.5 py-0.5 rounded">N: <strong>{n.toLocaleString()}</strong> Đơn vị/HS</span>
        {range && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Phạm vi: <strong>{range}</strong></span>}
        {avg && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-600">Độ lệch/TB: <strong>{avg}</strong></span>}
    </div>
);

export function QATestingDashboard(props: DashboardProps) {
    const {
        scoreDistribution,
        data,
        provinces,
        schools
    } = props;

    // Calculate performance categories from provinces (Aggregated to avoid double-counting)
    const { totalExcellent, totalGood, totalAverage, totalBelowAvg } = useMemo(() => {
        const provinceMap = groupByName(provinces, 'province', ['excellent_count', 'good_count', 'average_count', 'below_average_count']);

        return provinceMap.reduce((acc, p) => {
            acc.totalExcellent += (p.excellent_count || 0);
            acc.totalGood += (p.good_count || 0);
            acc.totalAverage += (p.average_count || 0);
            acc.totalBelowAvg += (p.below_average_count || 0);
            return acc;
        }, { totalExcellent: 0, totalGood: 0, totalAverage: 0, totalBelowAvg: 0 });
    }, [provinces]);

    // Prepare data for Scatter Math vs Literature using sampled students to avoid clutter
    const scatterData = useMemo(() => {
        return sampleData(data, 300).map(d => ({
            math: d.test_math || 0,
            literature: d.test_literature || 0,
            name: d.student_uid
        }));
    }, [data]);

    // Grade Inflation Detector (School GPA vs Test Scores) - Aggregated
    const inflationData = useMemo(() => {
        const schoolMap = schools.reduce((acc, s) => {
            const name = s.school_name || 'Khác';
            if (!acc[name]) {
                acc[name] = s;
            }
            return acc;
        }, {} as Record<string, typeof schools[0]>);

        return Object.values(schoolMap)
            .filter(s => (s.avg_gpa || 0) > 0 && (s.avg_test_math || 0) > 0)
            .map(s => ({
                name: s.school_name,
                gpa: s.avg_gpa || 0,
                test: ((s.avg_test_math || 0) + (s.avg_test_literature || 0)) / 2,
                type: s.type
            }));
    }, [schools]);

    const avgGap = useMemo(() => {
        if (inflationData.length === 0) return 0;
        return inflationData.reduce((acc, d) => acc + (d.gpa - d.test), 0) / inflationData.length;
    }, [inflationData]);

    // Subject Difficulty Analysis (Pass rates comparison) - Optimized to single pass
    const subjectDifficultyData = useMemo(() => {
        let mathPass = 0;
        let litPass = 0;
        data.forEach(d => {
            if ((d.test_math || 0) >= 5) mathPass++;
            if ((d.test_literature || 0) >= 5) litPass++;
        });
        const total = data.length || 1;

        return [
            { subject: 'Toán', rate: Math.round((mathPass / total) * 100) },
            { subject: 'Văn', rate: Math.round((litPass / total) * 100) }
        ];
    }, [data]);

    return (
        <div className="space-y-6">
            <InsightBanner variant="purple" title="Phân tích Chất lượng Đào tạo & Khảo thí">
                <p>
                    Hệ thống đang phân tích <strong>{data.length}</strong> kết quả thi.
                    Độ lệch trung bình giữa GPA và Điểm thi là <strong>{formatOneDecimal(avgGap)}</strong> ({avgGap < 1.0 ? 'Trong ngưỡng an toàn' : 'Cần lưu ý về lạm phát điểm số'}).
                </p>
            </InsightBanner>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-green-50">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-green-800 uppercase">Xuất sắc</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{totalExcellent}</div></CardContent>
                </Card>
                <Card className="bg-blue-50">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-blue-800 uppercase">Khá</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{totalGood}</div></CardContent>
                </Card>
                <Card className="bg-yellow-50">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-yellow-800 uppercase">Trung bình</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-yellow-600">{totalAverage}</div></CardContent>
                </Card>
                <Card className="bg-red-50">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-red-800 uppercase">Yếu/Kém</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{totalBelowAvg}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Phân bổ Điểm số Tổng quát</CardTitle>
                    <CardDescription>
                        Đánh giá độ hội tụ và phân tán của điểm số.
                        <strong> Insight:</strong> {scoreDistribution.length > 0 ? (scoreDistribution[0]?.Math > scoreDistribution[scoreDistribution.length - 1]?.Math ? 'Điểm số đang hội tụ ở dải điểm thấp, cần kiểm tra lại độ khó của đề thi.' : 'Điểm số phân bổ đều, cho thấy đề thi có tính phân loại tốt.') : 'Đang tải dữ liệu phổ điểm...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Math" name="Môn Toán" fill={THEME_COLORS.math} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Reading" name="Môn Văn" fill={THEME_COLORS.reading} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Average" name="Trung bình" fill={THEME_COLORS.writing} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <DataStats n={data.length} range="Dải điểm 0 - 10" avg={formatOneDecimal(data.reduce((acc, d) => acc + (d.test_average || 0), 0) / (data.length || 1))} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Phát hiện Lạm phát Điểm số (Grade Inflation Detector)</CardTitle>
                    <CardDescription>
                        Phát hiện dấu hiệu điểm quá trình cao bất thường so với điểm thi.
                        <strong> Insight:</strong> {inflationData.some(d => d.gpa - d.test > 1.5) ? 'Phát hiện một số trường có độ lệch GPA/Test cao (>1.5), cần tiến hành thanh tra quy trình chấm bài.' : 'Độ lệch giữa GPA và Điểm thi nằm trong ngưỡng cho phép đối với hầu hết các trường.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={inflationData.slice(0, 15)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={10} interval={0} angle={-45} textAnchor="end" height={80} />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="gpa" stroke="#3b82f6" name="GPA Trung bình" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="test" stroke="#ef4444" name="Điểm Thi Trung bình" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <DataStats n={inflationData.length} range="GPA vs Test" avg={formatOneDecimal(inflationData.reduce((acc, d) => acc + (d.gpa - d.test), 0) / (inflationData.length || 1))} />
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ma trận Tương quan (Toán vs Văn)</CardTitle>
                        <CardDescription>Kiểm tra tính đồng nhất của năng lực tư duy và ngôn ngữ.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid />
                                    <XAxis type="number" dataKey="math" name="Toán" unit="đ" domain={[0, 10]} />
                                    <YAxis type="number" dataKey="literature" name="Văn" unit="đ" domain={[0, 10]} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Học sinh" data={scatterData} fill="#8884d8" fillOpacity={0.6} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Phân tích Độ khó Môn học</CardTitle>
                        <CardDescription>Tỷ lệ sinh viên đạt yêu cầu (&gt;= 5.0) theo từng môn.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectDifficultyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="subject" />
                                    <YAxis domain={[0, 100]} unit="%" />
                                    <Tooltip />
                                    <Bar dataKey="rate" name="Tỷ lệ đạt" radius={[4, 4, 0, 0]}>
                                        {subjectDifficultyData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? THEME_COLORS.math : THEME_COLORS.reading} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
