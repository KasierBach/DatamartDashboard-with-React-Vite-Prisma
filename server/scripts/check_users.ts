import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log(`Total users found: ${users.length}`);
        if (users.length > 0) {
            console.log('Sample users:', users.map(u => ({ username: u.username, role: u.role })));
        } else {
            console.log('NO USERS FOUND IN DATABASE');
        }
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
