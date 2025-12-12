import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canApproveExpenses, canProcessExpenses } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const expenseId = body.expenseId;
        const action = body.action?.trim().toUpperCase(); // APPROVE, REJECT, PAY, REQUEST_DETAILS
        const comment = body.comment;

        console.log('Action received:', action, 'Comment:', comment);

        const expense = await prisma.expenseReport.findUnique({
            where: { id: expenseId },
            include: { user: true }
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        let pNextStatus = expense.currentStatus;
        const isManager = canApproveExpenses(session);
        const isAccounting = canProcessExpenses(session);

        // Helper: Check if expense is in a state valid for Accounting to act on
        // 1. MANAGER_APPROVED
        // 2. SUBMITTED but user has no manager (Top Level)
        const isAccountingEligible = expense.currentStatus === 'MANAGER_APPROVED' ||
            (expense.currentStatus === 'SUBMITTED' && expense.user.managerId === null);

        // State Machine logic
        if (isManager && expense.currentStatus === 'SUBMITTED' && expense.user.managerId !== null) {
            // Manager Action
            // (Ideally check if session.userId == expense.user.managerId)

            if (action === 'APPROVE') {
                pNextStatus = 'MANAGER_APPROVED';
            } else if (action === 'REJECT') {
                pNextStatus = 'MANAGER_REJECTED';
            }
            // Managers typically don't Request Details in this simplified flow, but if requested:
            else if (action === 'REQUEST_DETAILS') {
                pNextStatus = 'DETAILS_REQUESTED';
            }
        }
        else if (isAccounting && isAccountingEligible) {
            // Accounting Action
            if (action === 'PAY') {
                pNextStatus = 'PAID';
            } else if (action === 'REJECT') {
                pNextStatus = 'ACCOUNTING_REJECTED';
            } else if (action === 'REQUEST_DETAILS') {
                pNextStatus = 'DETAILS_REQUESTED';
            }
        }
        else if (isAccounting && expense.currentStatus === 'ACCOUNTING_VALIDATED' && action === 'PAY') {
            // Allow Paying after validation (if legacy or existing data)
            pNextStatus = 'PAID';
        }
        else {
            return NextResponse.json({ error: 'Invalid action for current status or permission' }, { status: 400 });
        }

        // Validate comment for Rejection or Request Details
        if ((action === 'REJECT' || action === 'REQUEST_DETAILS') && !comment) {
            return NextResponse.json({ error: 'Reason/Comment is required for this action' }, { status: 400 });
        }

        // Update Transaction
        await prisma.$transaction([
            prisma.expenseReport.update({
                where: { id: expenseId },
                data: { currentStatus: pNextStatus }
            }),
            prisma.approvalStep.create({
                data: {
                    expenseReportId: expenseId,
                    stepType: isAccounting && isAccountingEligible ? 'ACCOUNTING' : 'MANAGER',
                    status: action,
                    approvedByUserId: session.userId,
                    comment: comment || action, // Use provided comment or action name as default
                    resolvedAt: new Date()
                }
            })
        ]);

        return NextResponse.json({ success: true, status: pNextStatus });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
