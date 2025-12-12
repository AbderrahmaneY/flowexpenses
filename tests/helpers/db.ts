import { prisma } from '@/lib/prisma';

export async function resetTestDatabase() {
    await prisma.approvalStep.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.expenseReport.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.ruleConfig.deleteMany();

    // Create default rules
    await prisma.ruleConfig.createMany({
        data: [
            { category: 'transport', maxAmountPerExpense: 1000 },
            { category: 'meal', maxAmountPerExpense: 50 },
            { category: 'hotel', maxAmountPerExpense: 200 }
        ]
    });
}

export async function seedTestUsers() {
    // First create roles
    const adminRole = await prisma.role.create({
        data: { name: 'Admin', isAdmin: true, canSubmit: true, canApprove: true, canProcess: true }
    });
    const managerRole = await prisma.role.create({
        data: { name: 'Manager', canSubmit: true, canApprove: true }
    });
    const accountantRole = await prisma.role.create({
        data: { name: 'Accountant', canProcess: true }
    });
    const employeeRole = await prisma.role.create({
        data: { name: 'Employee', canSubmit: true }
    });

    // Create users with role references
    const admin = await prisma.user.create({
        data: { name: 'Admin', email: 'admin@test.com', password: 'pass', roleId: adminRole.id }
    });

    const manager = await prisma.user.create({
        data: { name: 'Manager', email: 'manager@test.com', password: 'pass', roleId: managerRole.id }
    });

    const accounting = await prisma.user.create({
        data: { name: 'Accounting', email: 'accounting@test.com', password: 'pass', roleId: accountantRole.id }
    });

    const employee = await prisma.user.create({
        data: { name: 'Employee', email: 'employee@test.com', password: 'pass', roleId: employeeRole.id, managerId: manager.id }
    });

    return { admin, manager, accounting, employee };
}
