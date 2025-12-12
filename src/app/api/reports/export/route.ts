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
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate'); // YYYY-MM-DD
        const endDateStr = searchParams.get('endDate');     // YYYY-MM-DD

        let dateFilter: any = {};

        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);

            // Validate max 31 days
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 31) {
                return NextResponse.json({ error: 'Date range cannot exceed 31 days' }, { status: 400 });
            }

            dateFilter = {
                dateOfExpense: {
                    gte: start,
                    lte: end
                }
            };
        } else {
            // Default to last 30 days if not specified
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            dateFilter = {
                dateOfExpense: {
                    gte: start,
                    lte: end
                }
            };
        }

        const expenses = await prisma.expenseReport.findMany({
            where: {
                ...dateFilter
            },
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { dateOfExpense: 'desc' }
        });

        // Generate CSV
        const header = ['ID', 'User', 'Email', 'Date', 'Amount', 'Currency', 'Category', 'Status', 'Description'];
        const rows = expenses.map(e => [
            e.id,
            e.user.name,
            e.user.email,
            e.dateOfExpense.toISOString().split('T')[0],
            e.amount,
            e.currency,
            e.category,
            e.currentStatus,
            e.description ? `"${e.description.replace(/"/g, '""')}"` : ''
        ]);

        const csvContent = [
            header.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="expenses_export_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
