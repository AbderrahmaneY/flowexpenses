import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST as EXPENSE_POST } from '@/app/api/expenses/route';
import { POST as ACTION_POST } from '@/app/api/approvals/action/route';
import { NextRequest } from 'next/server';
import { resetTestDatabase, seedTestUsers } from '../helpers/db';
import * as AuthLib from '@/lib/auth';

describe('Expense Workflow Integration', () => {
    let users: any;

    beforeEach(async () => {
        await resetTestDatabase();
        users = await seedTestUsers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('completes full approval cycle', async () => {
        // 1. Employee creates expense (SUBMITTED)
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.employee);
        const createReq = new NextRequest('http://localhost/api/expenses', {
            method: 'POST',
            body: JSON.stringify({
                title: 'Full Cycle Test',
                category: 'meal',
                amount: 100,
                dateOfExpense: new Date().toISOString(),
                status: 'SUBMITTED'
            })
        });
        const createRes = await EXPENSE_POST(createReq);
        const expense = await createRes.json();
        expect(expense.currentStatus).toBe('SUBMITTED');

        // 2. Manager approves
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.manager);
        const approveReq = new NextRequest('http://localhost/api/approvals/action', {
            method: 'POST',
            body: JSON.stringify({ expenseId: expense.id, action: 'APPROVE' })
        });
        const approveRes = await ACTION_POST(approveReq);
        const approveData = await approveRes.json();
        expect(approveData.status).toBe('MANAGER_APPROVED');

        // 3. Accounting pays
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.accounting);
        const payReq = new NextRequest('http://localhost/api/approvals/action', {
            method: 'POST',
            body: JSON.stringify({ expenseId: expense.id, action: 'PAY' })
        });
        const payRes = await ACTION_POST(payReq);
        const payData = await payRes.json();
        expect(payData.status).toBe('PAID');
    });
});
