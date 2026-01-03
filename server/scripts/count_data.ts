import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countData() {
    try {
        const studentCount = await prisma.studentDetail.count();
        const provinceCount = await prisma.provinceSummary.count();
        const schoolCount = await prisma.schoolSummary.count();
        const userCount = await prisma.user.count();

        console.log(`Student Details: ${studentCount}`);
        console.log(`Province Summaries: ${provinceCount}`);
        console.log(`School Summaries: ${schoolCount}`);
        console.log(`Users: ${userCount}`);

    } catch (error) {
        console.error('Error counting data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

countData();
