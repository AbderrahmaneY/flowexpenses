import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/expenses/route';
import { NextRequest } from 'next/server';
import { resetTestDatabase, seedTestUsers } from '../helpers/db';
import * as AuthLib from '@/lib/auth';

describe('Expenses API', () => {
    let users: any;

    beforeEach(async () => {
        await resetTestDatabase();
        users = await seedTestUsers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('allows employee to submit expense', async () => {
        // Mock Session
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.employee);

        const req = new NextRequest('http://localhost/api/expenses', {
            method: 'POST',
            body: JSON.stringify({
                title: 'Lunch',
                description: 'Team lunch',
                category: 'meal',
                amount: 25,
                dateOfExpense: new Date().toISOString(),
                status: 'SUBMITTED'
            })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.title).toBe('Lunch');
        expect(data.currentStatus).toBe('SUBMITTED');
    });

    it('prevents unauthorized submission (no canSubmit)', async () => {
        // User with NO permissions
        const noPermsUser = { ...users.employee, canSubmit: false, canApprove: false, canProcess: false, isAdmin: false };
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(noPermsUser);

        const req = new NextRequest('http://localhost/api/expenses', {
            method: 'POST',
            body: JSON.stringify({ title: 'Test', amount: 100 })
        });

        const res = await POST(req);
        expect(res.status).toBe(403);
    });

    it('lists only own expenses for employee', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.employee);

        // Seed some expenses
        // (Use POST or direct db helper would be better, but let's use Prisma directly in helper context)
        // Actually we are in a test file, we can import prisma
        const { prisma } = await import('@/lib/prisma');
        await prisma.expenseReport.create({
            data: { userId: users.employee.id, title: 'Emp Expense', amount: 10, category: 'meal', dateOfExpense: new Date() }
        });
        await prisma.expenseReport.create({
            data: { userId: users.manager.id, title: 'Mgr Expense', amount: 20, category: 'meal', dateOfExpense: new Date() }
        });

        const req = new NextRequest('http://localhost/api/expenses');
        const res = await GET(req);
        const data = await res.json();

        expect(data).toHaveLength(1);
        expect(data[0].title).toBe('Emp Expense');
    });

    it('lists all expenses for accounting', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.accounting);

        const { prisma } = await import('@/lib/prisma');
        await prisma.expenseReport.create({ data: { userId: users.employee.id, title: 'Emp Expense', amount: 10, category: 'meal', dateOfExpense: new Date() } });
        await prisma.expenseReport.create({ data: { userId: users.manager.id, title: 'Mgr Expense', amount: 20, category: 'meal', dateOfExpense: new Date() } });

        const req = new NextRequest('http://localhost/api/expenses');
        const res = await GET(req);
        const data = await res.json();

        expect(data).toHaveLength(2);
    });
});
