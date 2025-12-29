import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canProcessExpenses, canAccessAdminPanel } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session || (!canProcessExpenses(session) && !canAccessAdminPanel(session))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Fetch Key Metrics

        // 1. Approved for Payment: Sum of all expenses waiting for accounting (MANAGER_APPROVED or top-level SUBMITTED)
        // We'll approximate top-level SUBMITTED by checking for SUBMITTED + null manager
        const approvedForPaymentAgg = await prisma.expenseReport.aggregate({
            where: {
                OR: [
                    { currentStatus: 'MANAGER_APPROVED' },
                    { currentStatus: 'SUBMITTED', user: { managerId: null } }
                ]
            },
            _sum: { amount: true }
        });
        const totalApproved = approvedForPaymentAgg._sum.amount || 0;

        // 2. Pending Validation: Count of the same set + DETAILS_REQUESTED
        const pendingValidation = await prisma.expenseReport.count({
            where: {
                OR: [
                    { currentStatus: 'MANAGER_APPROVED' },
                    { currentStatus: 'SUBMITTED', user: { managerId: null } },
                    { currentStatus: 'DETAILS_REQUESTED' }
                ]
            }
        });

        // 3. Total Requested: Sum of all expenses actively in progress (not Draft, Rejected, or fully Paid)
        const totalRequestedAgg = await prisma.expenseReport.aggregate({
            where: {
                currentStatus: {
                    notIn: ['DRAFT', 'MANAGER_REJECTED', 'ACCOUNTING_REJECTED', 'PAID']
                }
            },
            _sum: { amount: true }
        });
        const totalRequested = totalRequestedAgg._sum.amount || 0;

        // 4. Total Executed: Sum of PAID
        const totalExecutedAgg = await prisma.expenseReport.aggregate({
            where: { currentStatus: 'PAID' },
            _sum: { amount: true }
        });
        const totalExecuted = totalExecutedAgg._sum.amount || 0;


        // Category Breakdown
        const allExpenses = await prisma.expenseReport.findMany({
            where: { currentStatus: { notIn: ['DRAFT', 'MANAGER_REJECTED', 'ACCOUNTING_REJECTED'] } },
            select: { category: true, amount: true }
        });

        const byCategory: Record<string, { amount: number, count: number }> = {};
        allExpenses.forEach(exp => {
            const cat = exp.category || 'uncategorized';
            if (!byCategory[cat]) byCategory[cat] = { amount: 0, count: 0 };
            byCategory[cat].amount += exp.amount;
            byCategory[cat].count += 1;
        });

        // Monthly Trend (Simplified to Paid only)
        const paidExpenses = await prisma.expenseReport.findMany({
            where: { currentStatus: 'PAID' },
            select: { amount: true, dateOfExpense: true } // Using dateOfExpense as proxy for period
        });

        const monthlyExecuted: { month: string; amount: number }[] = [];
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = `${months[d.getMonth()]} ${d.getFullYear()}`;

            const totalForMonth = paidExpenses
                .filter(e => {
                    const eDate = new Date(e.dateOfExpense);
                    return eDate.getMonth() === d.getMonth() && eDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum, e) => sum + (e.amount || 0), 0);

            monthlyExecuted.push({ month: monthLabel, amount: totalForMonth });
        }

        return NextResponse.json({
            totalRequested,
            totalApproved,
            totalExecuted,
            pendingValidation,
            monthlyExecuted,
            byCategory: Object.entries(byCategory).map(([key, val]) => ({
                category: key,
                amount: val.amount,
                count: val.count
            }))
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
