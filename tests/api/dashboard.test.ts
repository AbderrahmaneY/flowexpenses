import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/dashboard/accounting/route';
import { NextRequest } from 'next/server';
import { resetTestDatabase, seedTestUsers } from '../helpers/db';
import * as AuthLib from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('Dashboard API', () => {
    let users: any;

    beforeEach(async () => {
        await resetTestDatabase();
        users = await seedTestUsers();

        // Seed Data for Stats
        await prisma.expenseReport.createMany({
            data: [
                { userId: users.employee.userId, title: 'Pending', amount: 100, category: 'meal', dateOfExpense: new Date(), currentStatus: 'SUBMITTED' },
                { userId: users.employee.userId, title: 'Approved', amount: 200, category: 'transport', dateOfExpense: new Date(), currentStatus: 'MANAGER_APPROVED' },
                { userId: users.employee.userId, title: 'Paid', amount: 300, category: 'hotel', dateOfExpense: new Date(), currentStatus: 'PAID' },
            ]
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('Returns correct aggregation for Accounting', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.accounting);

        const req = new NextRequest('http://localhost/api/dashboard/accounting');
        const res = await GET(req);
        const data = await res.json();

        expect(res.status).toBe(200);

        // Calculations (based on API logic):
        // Requested: Excludes PAID, so SUBMITTED(100) + MANAGER_APPROVED(200) = 300
        expect(data.totalRequested).toBe(300);

        // Approved: MANAGER_APPROVED (waiting for accounting) = 200
        expect(data.totalApproved).toBe(200);

        // Executed: PAID(300)
        expect(data.totalExecuted).toBe(300);

        // Pending Validation: MANAGER_APPROVED(1)
        expect(data.pendingValidation).toBe(1);
    });

    it('Non-accounting gets 403', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.employee);
        const req = new NextRequest('http://localhost/api/dashboard/accounting');
        const res = await GET(req);
        expect(res.status).toBe(403);
    });
});
