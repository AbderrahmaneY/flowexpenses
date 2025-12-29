
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Resetting all passwords...');

    try {
        const hashedPassword = await bcrypt.hash('password123', 10);

        const { count } = await prisma.user.updateMany({
            data: {
                password: hashedPassword
            }
        });

        console.log(`Successfully reset passwords for ${count} users to 'password123'.`);
    } catch (e) {
        console.error('Error resetting passwords:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
