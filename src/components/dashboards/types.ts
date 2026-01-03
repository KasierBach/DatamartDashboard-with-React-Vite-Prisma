import { DataRecord, ProvinceSummaryRecord, SchoolSummaryRecord } from "../../types";

export interface DashboardProps {
    data: DataRecord[];
    provinces: ProvinceSummaryRecord[];
    schools: SchoolSummaryRecord[];
    avgScores: {
        math: number;
        reading: number;
        average: number;
        avg: number;
        attendance: number;
    };
    insights: {
        atRisk: number;
        topPerformers: number;
        lowestSubject: { subject: string; score: number };
        atRiskList: any[];
        topList: any[];
    };
    scoreDistribution: any[];
    passRateStats: any[];
    educationData: any[]; // academic_tier based
    typeData: any[];     // type_name based
    trendData: any[];
    levelPerformanceData: any[]; // level_name based
    correlationData: any[];
    atRiskDemographics: {
        type: { name: string, value: number }[];
        level: { name: string, value: number }[];
    };
    provincePerformance: { name: string, avg: number | null, students: number | null }[];
    topSchools: { name: string, avg: number | null, students: number | null }[];
    facultyStats: any[];
    classStats: any[];
    teacherStats: any[];
    supportNeeds: any[];
    enrichedData: any[];
}
