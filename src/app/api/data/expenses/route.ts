import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    // API Key authentication for data team
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.DATA_API_KEY || 'default-data-key';

    if (apiKey !== validApiKey) {
        return NextResponse.json({ error: 'Unauthorized. Provide valid x-api-key header.' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const status = searchParams.get('status');
        const format = searchParams.get('format') || 'json';

        // Build filters
        let whereClause: any = {};

        if (startDateStr && endDateStr) {
            whereClause.dateOfExpense = {
                gte: new Date(startDateStr),
                lte: new Date(endDateStr)
            };
        }

        if (status) {
            whereClause.currentStatus = status;
        }

        // Fetch all expenses with related data
        const expenses = await prisma.expenseReport.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: { select: { name: true } }
                    }
                },
                approvalSteps: {
                    select: {
                        stepType: true,
                        status: true,
                        comment: true,
                        resolvedAt: true,
                        approvedByUser: { select: { name: true } }
                    }
                },
                attachments: {
                    select: {
                        fileName: true,
                        fileType: true,
                        fileSize: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for CSV if requested
        if (format === 'csv') {
            const header = ['ID', 'Title', 'Amount', 'Currency', 'Category', 'Status', 'DateOfExpense', 'CreatedAt', 'UserName', 'UserEmail'];
            const rows = expenses.map(e => [
                e.id,
                `"${e.title.replace(/"/g, '""')}"`,
                e.amount,
                e.currency,
                e.category,
                e.currentStatus,
                e.dateOfExpense.toISOString().split('T')[0],
                e.createdAt.toISOString(),
                `"${e.user.name}"`,
                e.user.email
            ]);

            const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="expenses_data_${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        // JSON response
        return NextResponse.json({
            total: expenses.length,
            exportedAt: new Date().toISOString(),
            data: expenses.map(e => ({
                id: e.id,
                title: e.title,
                description: e.description,
                amount: e.amount,
                currency: e.currency,
                category: e.category,
                status: e.currentStatus,
                dateOfExpense: e.dateOfExpense.toISOString().split('T')[0],
                createdAt: e.createdAt.toISOString(),
                updatedAt: e.updatedAt.toISOString(),
                user: {
                    id: e.user.id,
                    name: e.user.name,
                    email: e.user.email,
                    role: e.user.role?.name
                },
                approvalSteps: e.approvalSteps,
                attachmentCount: e.attachments.length
            }))
        });

    } catch (error) {
        console.error('Data API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
