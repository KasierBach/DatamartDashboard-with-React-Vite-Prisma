import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import prisma from '../utils/prisma';

async function parseCsv<T>(filePath: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const results: T[] = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

async function importNewData(): Promise<void> {
    try {
        console.log('--- Starting New Data Import ---');

        // Paths to CSV files
        const studentDetailsPath = path.join(__dirname, '../../data/DEC29_fact_student_details.csv');
        const provinceSummaryPath = path.join(__dirname, '../../data/DEC29_province_summary.csv');
        const schoolSummaryPath = path.join(__dirname, '../../data/DEC29_school_summary.csv');

        // 1. Clear existing data and reset sequences
        console.log('Clearing existing data...');
        await prisma.studentDetail.deleteMany();
        await prisma.provinceSummary.deleteMany();
        await prisma.schoolSummary.deleteMany();

        await prisma.$executeRawUnsafe('ALTER SEQUENCE student_details_id_seq RESTART WITH 1');
        await prisma.$executeRawUnsafe('ALTER SEQUENCE province_summary_id_seq RESTART WITH 1');
        await prisma.$executeRawUnsafe('ALTER SEQUENCE school_summary_id_seq RESTART WITH 1');

        // 2. Import Student Details
        console.log('Importing Student Details...');
        const studentRows = await parseCsv<any>(studentDetailsPath);
        const studentData = studentRows.map(row => ({
            student_fact_id: row.student_fact_id,
            student_uid: row.student_uid,
            school_uid: row.school_uid,
            record_id: row.record_id,
            province_id: parseInt(row.province_id) || 0,
            school_type_id: parseInt(row.school_type_id) || 0,
            school_level_id: parseInt(row.school_level_id) || 0,
            performance_category_id: parseInt(row.performance_category_id) || 0,
            year: parseInt(row.year) || 0,
            grade: row.grade,
            gpa_overall: parseFloat(row.gpa_overall) || 0,
            attendance_rate: parseFloat(row.attendance_rate) || 0,
            test_math: parseFloat(row.test_math) || 0,
            test_literature: parseFloat(row.test_literature) || 0,
            test_average: parseFloat(row.test_average) || 0,
            composite_score: parseFloat(row.composite_score) || 0,
            school_name: row.school_name,
            province_name: row.province_name,
            level_name: row.level_name,
            type_name: row.type_name,
            school_founding_year: parseInt(row.school_founding_year) || 0,
            school_age: parseInt(row.school_age) || 0,
            academic_tier: row.academic_tier,
        }));
        await prisma.studentDetail.createMany({ data: studentData });
        console.log(`Imported ${studentData.length} records into StudentDetail.`);

        // 3. Import Province Summary
        console.log('Importing Province Summary...');
        const provinceRows = await parseCsv<any>(provinceSummaryPath);
        const provinceData = provinceRows.map(row => ({
            province: row.province,
            level: row.level,
            total_students: parseInt(row.total_students) || 0,
            total_schools: parseInt(row.total_schools) || 0,
            avg_gpa: parseFloat(row.avg_gpa) || 0,
            avg_attendance: parseFloat(row.avg_attendance) || 0,
            avg_test_score: parseFloat(row.avg_test_score) || 0,
            avg_composite_score: parseFloat(row.avg_composite_score) || 0,
            excellent_count: parseInt(row.excellent_count) || 0,
            good_count: parseInt(row.good_count) || 0,
            average_count: parseInt(row.average_count) || 0,
            below_average_count: parseInt(row.below_average_count) || 0,
        }));
        await prisma.provinceSummary.createMany({ data: provinceData });
        console.log(`Imported ${provinceData.length} records into ProvinceSummary.`);

        // 4. Import School Summary
        console.log('Importing School Summary...');
        const schoolRows = await parseCsv<any>(schoolSummaryPath);
        const schoolData = schoolRows.map(row => ({
            school_id: row.school_id,
            school_name: row.school_name,
            province: row.province,
            level: row.level,
            type: row.type,
            founding_year: parseInt(row.founding_year) || 0,
            school_age: parseInt(row.school_age) || 0,
            total_students: parseInt(row.total_students) || 0,
            avg_gpa: parseFloat(row.avg_gpa) || 0,
            avg_attendance: parseFloat(row.avg_attendance) || 0,
            avg_test_math: parseFloat(row.avg_test_math) || 0,
            avg_test_literature: parseFloat(row.avg_test_literature) || 0,
            avg_composite_score: parseFloat(row.avg_composite_score) || 0,
            top_performer_count: parseInt(row.top_performer_count) || 0,
        }));
        await prisma.schoolSummary.createMany({ data: schoolData });
        console.log(`Imported ${schoolData.length} records into SchoolSummary.`);

        console.log('--- All Data Imports Completed Successfully ---');
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error importing new data:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

importNewData();
