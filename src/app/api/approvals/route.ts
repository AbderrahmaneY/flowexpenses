import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canApproveExpenses, canProcessExpenses, canAccessAdminPanel } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    const session = await getSession();
    // Strict Access Control: Only Managers and Approvers/Admins can see approvals
    if (!session || (!canApproveExpenses(session) && !canAccessAdminPanel(session))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        let whereClause: any = {};
        const isManager = canApproveExpenses(session);
        const isAccounting = canProcessExpenses(session);

        // Filter Logic
        if (isManager) {
            // Managers look for SUBMITTED items from their team
            whereClause = {
                currentStatus: 'SUBMITTED',
                user: { managerId: session.userId }
            };
        } else if (isAccounting) {
            // Accounting looks for:
            // 1. MANAGER_APPROVED items
            // 2. SUBMITTED items from users who have NO manager (Top-level)
            whereClause = {
                OR: [
                    { currentStatus: 'MANAGER_APPROVED' },
                    {
                        currentStatus: 'SUBMITTED',
                        user: { managerId: null }
                    }
                ]
            };
        } else {
            return NextResponse.json([]);
        }

        // If user is both manager and accounting, we might need to handle logic (e.g. show both or use query param).
        // For simplicity, assuming distinct dashboard views or accounting overrides. 
        // If isAccounting, showing MANAGER_APPROVED overrides the generic manager view of SUBMITTED? 
        // Let's assume Accounting takes precedence for global view, but effectively they might want to see 'SUBMITTED' too if they manage ppl.
        // For this MVP, let's keep it simple: Accessing /api/approvals implies checking "My Action Items".
        // If I am Accounting, my action items are Validating.
        // If I am Manager, my action items are Approving.

        // Refinement: If I have both, I should probably see both? Or just use one?
        // Let's prioritize: If Accounting, show Accounting pending. If Manager, show Manager pending.
        // User request: "Manager who that also submits... Accounting staff... Admin"
        // Let's just return based on role flag priority for the lists:
        // Or do an OR query?

        if (isAccounting && isManager) {
            whereClause = {
                OR: [
                    { currentStatus: 'SUBMITTED', user: { managerId: session.userId } },
                    { currentStatus: 'MANAGER_APPROVED' },
                    { currentStatus: 'SUBMITTED', user: { managerId: null } }
                ]
            };
        }

        const expenses = await prisma.expenseReport.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(expenses);

    } catch (error) {
        console.error('Error fetching approvals:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}