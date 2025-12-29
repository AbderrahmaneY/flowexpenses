
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Listing users...');
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.name})`));
    await prisma.$disconnect();
}

main();
