import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Pre-computed hash for 'pass' - avoids async hashing in each test
const TEST_PASSWORD_HASH = bcrypt.hashSync('pass', 10);

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
    const adminUser = await prisma.user.create({
        data: { name: 'Admin', email: 'admin@test.com', password: TEST_PASSWORD_HASH, roleId: adminRole.id }
    });

    const managerUser = await prisma.user.create({
        data: { name: 'Manager', email: 'manager@test.com', password: TEST_PASSWORD_HASH, roleId: managerRole.id }
    });

    const accountingUser = await prisma.user.create({
        data: { name: 'Accounting', email: 'accounting@test.com', password: TEST_PASSWORD_HASH, roleId: accountantRole.id }
    });

    const employeeUser = await prisma.user.create({
        data: { name: 'Employee', email: 'employee@test.com', password: TEST_PASSWORD_HASH, roleId: employeeRole.id, managerId: managerUser.id }
    });

    // Return session-formatted objects with flattened role permissions
    return {
        admin: {
            userId: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            roleId: adminRole.id,
            roleName: adminRole.name,
            canSubmit: adminRole.canSubmit,
            canApprove: adminRole.canApprove,
            canProcess: adminRole.canProcess,
            isAdmin: adminRole.isAdmin,
            mustChangePassword: false
        },
        manager: {
            userId: managerUser.id,
            email: managerUser.email,
            name: managerUser.name,
            roleId: managerRole.id,
            roleName: managerRole.name,
            canSubmit: managerRole.canSubmit,
            canApprove: managerRole.canApprove,
            canProcess: managerRole.canProcess,
            isAdmin: managerRole.isAdmin,
            mustChangePassword: false
        },
        accounting: {
            userId: accountingUser.id,
            email: accountingUser.email,
            name: accountingUser.name,
            roleId: accountantRole.id,
            roleName: accountantRole.name,
            canSubmit: accountantRole.canSubmit,
            canApprove: accountantRole.canApprove,
            canProcess: accountantRole.canProcess,
            isAdmin: accountantRole.isAdmin,
            mustChangePassword: false
        },
        employee: {
            userId: employeeUser.id,
            email: employeeUser.email,
            name: employeeUser.name,
            roleId: employeeRole.id,
            roleName: employeeRole.name,
            canSubmit: employeeRole.canSubmit,
            canApprove: employeeRole.canApprove,
            canProcess: employeeRole.canProcess,
            isAdmin: employeeRole.isAdmin,
            mustChangePassword: false
        }
    };
}
