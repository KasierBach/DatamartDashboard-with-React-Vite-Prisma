import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function verifyData() {
    try {
        const studentDetailsPath = path.join(__dirname, '../data/DEC29_fact_student_details.csv');
        console.log('--- Verifying Student Data ---');

        const csvRows = await parseCsv<any>(studentDetailsPath);
        console.log(`CSV Records: ${csvRows.length}`);

        let csvMathTotal = 0, csvLitTotal = 0, csvGpaTotal = 0, csvAttendTotal = 0;
        csvRows.forEach(row => {
            csvMathTotal += parseFloat(row.test_math) || 0;
            csvLitTotal += parseFloat(row.test_literature) || 0;
            csvGpaTotal += parseFloat(row.gpa_overall) || 0;
            csvAttendTotal += parseFloat(row.attendance_rate) || 0;
        });

        const csvMathAvg = csvMathTotal / csvRows.length;
        const csvLitAvg = csvLitTotal / csvRows.length;
        const csvGpaAvg = csvGpaTotal / csvRows.length;
        const csvAttendAvg = csvAttendTotal / csvRows.length;

        console.log(`CSV Averages: Math=${csvMathAvg.toFixed(4)}, Lit=${csvLitAvg.toFixed(4)}, GPA=${csvGpaAvg.toFixed(4)}, Attend=${csvAttendAvg.toFixed(4)}`);

        const dbCount = await prisma.studentDetail.count();
        console.log(`DB Records: ${dbCount}`);

        const dbAverages = await prisma.studentDetail.aggregate({
            _avg: {
                test_math: true,
                test_literature: true,
                gpa_overall: true,
                attendance_rate: true
            }
        });

        console.log(`DB Averages: Math=${dbAverages._avg.test_math?.toFixed(4)}, Lit=${dbAverages._avg.test_literature?.toFixed(4)}, GPA=${dbAverages._avg.gpa_overall?.toFixed(4)}, Attend=${dbAverages._avg.attendance_rate?.toFixed(4)}`);

        if (Math.abs(csvMathAvg - (dbAverages._avg.test_math || 0)) > 0.001) {
            console.log('WARNING: Math average mismatch!');
        } else {
            console.log('Math average matches.');
        }

    } catch (error) {
        console.error('Error verifying data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyData();
