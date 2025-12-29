
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Verifying passwords...');

    const email = 'emma@flow.com';
    const password = 'password123';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('User not found!');
        return;
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
        console.log(`✅ Success: Password for ${email} is correctly set to '${password}'`);
    } else {
        console.error(`❌ Failed: Password for ${email} does NOT match '${password}'`);
    }

    await prisma.$disconnect();
}

main();
