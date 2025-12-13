import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/approvals/route';
import { POST as ACTION_POST } from '@/app/api/approvals/action/route';
import { NextRequest } from 'next/server';
import { resetTestDatabase, seedTestUsers } from '../helpers/db';
import * as AuthLib from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('Approvals API', () => {
    let users: any;
    let expenseId: number;

    beforeEach(async () => {
        await resetTestDatabase();
        users = await seedTestUsers();

        // Create a submitted expense for Employee
        const exp = await prisma.expenseReport.create({
            data: {
                userId: users.employee.userId,
                title: 'Approval Test',
                category: 'meal',
                amount: 50,
                dateOfExpense: new Date(),
                currentStatus: 'SUBMITTED'
            }
        });
        expenseId = exp.id;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('Manager sees submitted expense', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.manager);

        const req = new NextRequest('http://localhost/api/approvals');
        const res = await GET(req);
        const data = await res.json();

        expect(data).toHaveLength(1);
        expect(data[0].id).toBe(expenseId);
    });

    it('Manager approves expense -> MANAGER_APPROVED', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.manager);

        const req = new NextRequest('http://localhost/api/approvals/action', {
            method: 'POST',
            body: JSON.stringify({ expenseId, action: 'APPROVE', comment: 'LGTM' })
        });

        const res = await ACTION_POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.status).toBe('MANAGER_APPROVED');

        const updated = await prisma.expenseReport.findUnique({ where: { id: expenseId } });
        expect(updated?.currentStatus).toBe('MANAGER_APPROVED');
    });

    it('Accounting pays expense -> PAID', async () => {
        // First set to MANAGER_APPROVED
        await prisma.expenseReport.update({ where: { id: expenseId }, data: { currentStatus: 'MANAGER_APPROVED' } });

        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.accounting);

        const req = new NextRequest('http://localhost/api/approvals/action', {
            method: 'POST',
            body: JSON.stringify({ expenseId, action: 'PAY', comment: 'Paid' })
        });

        const res = await ACTION_POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.status).toBe('PAID');
    });
});
