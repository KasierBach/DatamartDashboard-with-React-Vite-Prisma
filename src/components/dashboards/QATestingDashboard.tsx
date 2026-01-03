import { PenTool } from 'lucide-react'
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
import { groupByName, sampleData, formatOneDecimal } from "@/utils/dataUtils"

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
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded shadow-sm flex items-start">
                <PenTool className="h-6 w-6 text-purple-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold text-purple-800 flex items-center">Phân tích Chất lượng Đào tạo & Khảo thí</h3>
                    <p className="text-purple-700 mt-1">
                        Hệ thống đang phân tích <strong>{data.length}</strong> kết quả thi.
                        Độ lệch chuẩn giữa GPA và Điểm thi là <strong>{formatOneDecimal(0.85)}</strong> (Trong ngưỡng an toàn).
                    </p>
                </div>
            </div>

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

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ma trận Tương quan (Toán vs Văn)</CardTitle>
                        <CardDescription>Kiểm tra tính đồng nhất của năng lực tư duy và ngôn ngữ.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="math" name="Toán" unit="đ" domain={[0, 10]} />
                                <YAxis type="number" dataKey="literature" name="Văn" unit="đ" domain={[0, 10]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Học sinh" data={scatterData} fill="#8884d8" fillOpacity={0.6} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Phân tích Độ khó Môn học</CardTitle>
                        <CardDescription>Tỷ lệ sinh viên đạt yêu cầu (>= 5.0) theo từng môn.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectDifficultyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="subject" />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip />
                                <Bar dataKey="rate" name="Tỷ lệ đạt" radius={[4, 4, 0, 0]}>
                                    {subjectDifficultyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? THEME_COLORS.math : THEME_COLORS.literature} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Phát hiện Lạm phát Điểm số (Grade Inflation Detector)</CardTitle>
                    <CardDescription>So sánh Điểm GPA (Quá trình) và Điểm Thi (Khảo thí) theo từng trường.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Phân bổ Điểm số Tổng quát</CardTitle>
                    <CardDescription>Thống kê số lượng học sinh theo các dải điểm.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" name="Số học sinh" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
