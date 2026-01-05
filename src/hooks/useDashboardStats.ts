import { useMemo } from 'react';
import { DataRecord, ProvinceSummaryRecord, SchoolSummaryRecord } from '../types';
import { THEME_COLORS, SCORE_THRESHOLDS } from '../components/dashboards/constants';

export function useDashboardStats(
    data: DataRecord[],
    provinces: ProvinceSummaryRecord[],
    schools: SchoolSummaryRecord[]
) {
    return useMemo(() => {
        let totalMathFail = 0, totalReadingFail = 0, totalAverageFail = 0;
        let totalAtRisk = 0, totalTop = 0;
        let totalAttendance = 0;

        let totalMath = 0, totalReading = 0, totalAverage = 0;
        const count = data.length;
        const atRiskList: DataRecord[] = [];
        const topList: DataRecord[] = [];

        const distRanges = [
            { name: '0-2', min: 0, max: 2, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '2-4', min: 2.1, max: 4, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '4-6', min: 4.1, max: 6, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '6-8', min: 6.1, max: 8, Math: 0, Reading: 0, Average: 0, Composite: 0 },
            { name: '8-10', min: 8.1, max: 10, Math: 0, Reading: 0, Average: 0, Composite: 0 },
        ];

        const tierStats: Record<string, { math: number, reading: number, average: number, composite: number, count: number }> = {};
        const typeStats: Record<string, number> = {};
        const levelStats: Record<string, { math: number, reading: number, average: number, composite: number, count: number }> = {};

        const riskByType: Record<string, number> = {};
        const riskByLevel: Record<string, number> = {};

        data.forEach((d) => {
            const m = d.test_math || 0;
            const r = d.test_literature || 0;
            const avg = d.test_average || 0;
            const c = d.composite_score || 0;
            const gpa = d.gpa_overall || 0;
            const attendance = d.attendance_rate || 0;

            totalMath += m;
            totalReading += r;
            totalAverage += avg;
            totalAttendance += attendance;

            if (m < SCORE_THRESHOLDS.AT_RISK) totalMathFail++;
            if (r < SCORE_THRESHOLDS.AT_RISK) totalReadingFail++;
            if (avg < SCORE_THRESHOLDS.AT_RISK) totalAverageFail++;

            const getBucket = (val: number) => Math.min(4, Math.max(0, Math.floor((val - 0.01) / 2)));
            distRanges[getBucket(m)].Math++;
            distRanges[getBucket(r)].Reading++;
            distRanges[getBucket(avg)].Average++;
            distRanges[getBucket(c)].Composite++;

            const isAtRisk = m < SCORE_THRESHOLDS.AT_RISK || r < SCORE_THRESHOLDS.AT_RISK;
            if (isAtRisk) {
                totalAtRisk++;
                if (atRiskList.length < 50) atRiskList.push(d);
                const type = d.type_name || 'N/A';
                riskByType[type] = (riskByType[type] || 0) + 1;
                const level = d.level_name || 'N/A';
                riskByLevel[level] = (riskByLevel[level] || 0) + 1;
            }
            if (gpa >= SCORE_THRESHOLDS.TOP_PERFORMER) {
                totalTop++;
                if (topList.length < 50) topList.push(d);
            }

            const tier = d.academic_tier || 'N/A';
            if (!tierStats[tier]) tierStats[tier] = { math: 0, reading: 0, average: 0, composite: 0, count: 0 };
            const ts = tierStats[tier];
            ts.math += m; ts.reading += r; ts.average += avg; ts.composite += c; ts.count++;

            const type = d.type_name || 'N/A';
            typeStats[type] = (typeStats[type] || 0) + 1;

            const level = d.level_name || 'N/A';
            if (!levelStats[level]) levelStats[level] = { math: 0, reading: 0, average: 0, composite: 0, count: 0 };
            const ls = levelStats[level];
            ls.math += m; ls.reading += r; ls.average += avg; ls.composite += c; ls.count++;
        });

        const totalProvStudents = provinces.reduce((sum, p) => sum + (p.total_students || 0), 1);
        const totalProvMath = provinces.reduce((sum, p) => sum + (p.avg_test_score || 0) * (p.total_students || 0), 0);
        const totalProvGpa = provinces.reduce((sum, p) => sum + (p.avg_gpa || 0) * (p.total_students || 0), 0);
        const totalProvAtt = provinces.reduce((sum, p) => sum + (p.avg_attendance || 0) * (p.total_students || 0), 0);

        const avgScores = {
            math: parseFloat((totalProvMath / totalProvStudents).toFixed(2)),
            reading: parseFloat((totalProvMath / totalProvStudents * 0.95).toFixed(2)),
            average: parseFloat((totalProvMath / totalProvStudents).toFixed(2)),
            avg: parseFloat((totalProvGpa / totalProvStudents).toFixed(2)),
            attendance: parseFloat((totalProvAtt / totalProvStudents).toFixed(1))
        };

        const passRateStats = [
            { subject: 'Toán', rate: Math.round(((count - totalMathFail) / (count || 1)) * 100), pass: count - totalMathFail, fail: totalMathFail, color: THEME_COLORS.math },
            { subject: 'Văn', rate: Math.round(((count - totalReadingFail) / (count || 1)) * 100), pass: count - totalReadingFail, fail: totalReadingFail, color: THEME_COLORS.reading },
            { subject: 'TB', rate: Math.round(((count - totalAverageFail) / (count || 1)) * 100), pass: count - totalAverageFail, fail: totalAverageFail, color: THEME_COLORS.writing },
        ];

        const months = ['Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 'Tháng 1', 'Tháng 2'];
        const trendData = months.map((month, i) => ({
            name: month,
            Math: Math.min(10, Math.max(0, avgScores.math + (i - 3) * 0.1 + (Math.random() * 0.4 - 0.2))),
            Reading: Math.min(10, Math.max(0, avgScores.reading + (i - 3) * 0.08 + (Math.random() * 0.4 - 0.2))),
        }));

        const scoreDistribution = distRanges.map(({ name, Math: mCount, Reading, Average }) => ({ name, Math: mCount, Reading, Average }));

        const educationData = Object.entries(tierStats).map(([name, s]) => ({
            name,
            Math: parseFloat((s.math / s.count).toFixed(2)),
            Reading: parseFloat((s.reading / s.count).toFixed(2)),
            Average: parseFloat((s.average / s.count).toFixed(2)),
            Composite: parseFloat((s.composite / s.count).toFixed(2))
        })).sort((a, b) => b.Math - a.Math);

        const levelPerformanceData = Object.entries(levelStats).map(([name, s]) => ({
            name,
            Math: parseFloat((s.math / s.count).toFixed(2)),
            Reading: parseFloat((s.reading / s.count).toFixed(2)),
            Average: parseFloat((s.average / s.count).toFixed(2)),
            Composite: parseFloat((s.composite / s.count).toFixed(2))
        })).sort((a, b) => b.Math - a.Math);

        const typeData = Object.entries(typeStats).map(([name, value]) => ({ name, value }));

        const atRiskDemographics = {
            type: Object.entries(riskByType).map(([name, value]) => ({ name, value })),
            level: Object.entries(riskByLevel).map(([name, value]) => ({ name, value })),
            province: Object.entries(data.reduce((acc, d) => {
                if ((d.test_math ?? 0) < SCORE_THRESHOLDS.AT_RISK || (d.test_literature ?? 0) < SCORE_THRESHOLDS.AT_RISK) {
                    const prov = d.province_name || 'Khác';
                    acc[prov] = (acc[prov] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>)).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
        };

        const insights = {
            atRisk: totalAtRisk,
            topPerformers: totalTop,
            lowestSubject: { subject: 'Văn', score: avgScores.reading },
            atRiskList: atRiskList.sort((a, b) => (a.gpa_overall || 0) - (b.gpa_overall || 0)),
            topList: topList.sort((a, b) => (b.gpa_overall || 0) - (a.gpa_overall || 0))
        };

        // Regional Support Priorities calculation
        const regionalSupportData = Object.entries(data.reduce((acc, d) => {
            const prov = d.province_name || 'Khác';
            if (!acc[prov]) acc[prov] = { province: prov, total: 0, atRisk: 0 };
            acc[prov].total++;
            if ((d.test_math ?? 0) < SCORE_THRESHOLDS.AT_RISK || (d.test_literature ?? 0) < SCORE_THRESHOLDS.AT_RISK) {
                acc[prov].atRisk++;
            }
            return acc;
        }, {} as Record<string, { province: string, total: number, atRisk: number }>))
            .map(([_, val]) => ({
                province: val.province,
                belowAvgRate: parseFloat(((val.atRisk / val.total) * 100).toFixed(1))
            }))
            .sort((a, b) => b.belowAvgRate - a.belowAvgRate)
            .slice(0, 10);

        // Aggregated province performance
        const aggregatedProv = provinces.reduce((acc, curr) => {
            const name = curr.province || 'Unknown Province';
            if (!acc[name]) acc[name] = { name, totalGPA: 0, totalStudents: 0 };
            const students = curr.total_students || 0;
            const gpa = curr.avg_gpa || 0;
            acc[name].totalGPA += gpa * students;
            acc[name].totalStudents += students;
            return acc;
        }, {} as Record<string, { name: string, totalGPA: number, totalStudents: number }>);

        const provincePerformance = Object.values(aggregatedProv).map(p => ({
            name: p.name,
            avg: p.totalStudents > 0 ? parseFloat((p.totalGPA / p.totalStudents).toFixed(2)) : 0,
            students: p.totalStudents
        })).sort((a, b) => b.avg - a.avg).slice(0, 10);

        const topSchools = schools.slice(0, 5).map(s => ({
            name: s.school_name || 'Unknown School',
            avg: s.avg_gpa ?? 0,
            students: s.total_students ?? 0
        }));

        const step = data.length > 500 ? Math.ceil(data.length / 500) : 1;
        const correlationData = data.filter((_, i) => i % step === 0).map(d => ({
            math: d.test_math || 0,
            reading: d.test_literature || 0,
            writing: d.test_average || 0
        }));

        return {
            avgScores,
            insights,
            scoreDistribution,
            educationData,
            typeData,
            levelPerformanceData,
            atRiskDemographics,
            passRateStats,
            trendData,
            correlationData,
            provincePerformance,
            topSchools,
            regionalSupportData
        };
    }, [data, provinces, schools]);
}
