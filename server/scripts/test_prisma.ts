import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    console.log('--- TESTING PRISMA CONNECTION ---');
    try {
        // 1. Test connection by counting users
        const userCount = await prisma.user.count();
        console.log('✅ Prisma connected successfully!');
        console.log(`📊 Number of users in database: ${userCount}`);

        // 2. Test fetching a sample record
        const sampleStudent = await prisma.factScore.findFirst();
        if (sampleStudent) {
            console.log('✅ Data fetching works!');
            console.log('📝 Sample student record:', JSON.stringify(sampleStudent, null, 2));
        } else {
            console.log('⚠️ No student data found, but connection is OK.');
        }
    } catch (error) {
        console.error('❌ Prisma test failed:');
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
