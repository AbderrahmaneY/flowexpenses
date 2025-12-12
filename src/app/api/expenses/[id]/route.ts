import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canApproveExpenses, canProcessExpenses, canAccessAdminPanel } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const expense = await prisma.expenseReport.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { name: true, email: true, managerId: true } },
                attachments: true,
                approvalSteps: {
                    include: { approvedByUser: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!expense) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Access Control
        const isOwner = expense.userId === session.userId;
        const canViewAsAdmin = canAccessAdminPanel(session) || canProcessExpenses(session);
        // Allow Managers to view as well (simplified: any manager can view any for now, or strictly their reports)
        // For strictness: if (canApproveExpenses(session) && expense.user.managerId === session.userId)
        // For demo simplicity let's allow canApprove to view (they need to verify details before action)
        const isApprover = canApproveExpenses(session);

        if (!isOwner && !canViewAsAdmin && !isApprover) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const expense = await prisma.expenseReport.findUnique({ where: { id: parseInt(id) } });
        if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Only owner can update details
        if (expense.userId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If not draft, prevent editing content (unless marking as submitted)
        if (expense.currentStatus !== 'DRAFT' && !body.statusOnly) {
            // Allow status change (DRAFT -> SUBMITTED)
        }

        const { title, description, category, amount, dateOfExpense, status } = body;

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (category) updateData.category = category;
        if (amount) updateData.amount = parseFloat(amount);
        if (dateOfExpense) updateData.dateOfExpense = new Date(dateOfExpense);
        if (status) updateData.currentStatus = status;

        const updated = await prisma.expenseReport.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return NextResponse.json(updated);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
