import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Seeding database...');

    try {
        await prisma.approvalStep.deleteMany();
        await prisma.attachment.deleteMany();
        await prisma.expenseReport.deleteMany();
        await prisma.user.deleteMany();
        await prisma.ruleConfig.deleteMany();
    } catch (e: any) {
        console.log('Clean up errors ignored, proceeding...');
    }

    // Clean up
    try {
        await prisma.approvalStep.deleteMany();
        await prisma.attachment.deleteMany();
        await prisma.expenseReport.deleteMany();
        await prisma.user.deleteMany();
        await prisma.role.deleteMany();
        await prisma.ruleConfig.deleteMany();
    } catch (e) { }

    // 1. Create Roles (Same as before)
    const employeeRole = await prisma.role.create({
        data: {
            name: 'Employee',
            description: 'Can submit expense reports',
            canSubmit: true,
            canApprove: false,
            canProcess: false,
            isAdmin: false,
        },
    });

    const managerRole = await prisma.role.create({
        data: {
            name: 'Manager',
            description: 'Can submit and approve expense reports',
            canSubmit: true,
            canApprove: true,
            canProcess: false,
            isAdmin: false,
        },
    });

    const accountantRole = await prisma.role.create({
        data: {
            name: 'Accountant',
            description: 'Can process approved expenses for payment',
            canSubmit: false,
            canApprove: false,
            canProcess: true,
            isAdmin: false,
        },
    });

    const adminRole = await prisma.role.create({
        data: {
            name: 'Admin',
            description: 'Full system access',
            canSubmit: true,
            canApprove: true,
            canProcess: true,
            isAdmin: true,
        },
    });

    // 2. Create Rules
    await prisma.ruleConfig.createMany({
        data: [
            { category: 'transport', maxAmountPerExpense: 1000 },
            { category: 'meal', maxAmountPerExpense: 50 },
            { category: 'hotel', maxAmountPerExpense: 200 },
            { category: 'mileage', maxAmountPerExpense: 500, perKmRate: 0.5 },
        ],
    });

    // 3. Create Users with Roles
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@flow.com',
            password: hashedPassword,
            roleId: adminRole.id,
        },
    });

    const manager = await prisma.user.create({
        data: {
            name: 'Marie Manager',
            email: 'manager@flow.com',
            password: hashedPassword,
            roleId: managerRole.id,
        },
    });

    const accounting = await prisma.user.create({
        data: {
            name: 'Alex Accounting',
            email: 'accounting@flow.com',
            password: hashedPassword,
            roleId: accountantRole.id,
        },
    });

    const emma = await prisma.user.create({
        data: {
            name: 'Emma Employee',
            email: 'emma@flow.com',
            password: hashedPassword,
            roleId: employeeRole.id,
            managerId: manager.id,
        },
    });

    const eric = await prisma.user.create({
        data: {
            name: 'Eric Employee',
            email: 'eric@flow.com',
            password: hashedPassword,
            roleId: employeeRole.id,
            managerId: manager.id,
        },
    });

    // 4. Sample Expense
    await prisma.expenseReport.create({
        data: {
            userId: emma.id,
            title: 'Team Lunch',
            category: 'meal',
            amount: 45.0,
            dateOfExpense: new Date(),
            currentStatus: 'SUBMITTED',
        },
    });

    console.log('Seeding finished.');
    console.log('Roles created:', { employeeRole, managerRole, accountantRole, adminRole });
}

main()
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
