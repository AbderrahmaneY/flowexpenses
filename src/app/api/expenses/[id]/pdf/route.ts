import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get base URL for logo
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    try {
        const expense = await prisma.expenseReport.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { name: true, email: true } },
                lineItems: true,
                approvalSteps: {
                    include: { approvedByUser: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!expense) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Generate HTML for PDF
        const lineItemsHtml = expense.lineItems.length > 0
            ? expense.lineItems.map((item, i) => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${i + 1}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-transform: capitalize;">${item.category}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(item.dateOfExpense).toLocaleDateString()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${expense.currency} ${item.amount.toFixed(2)}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: center;">Single expense: ${expense.currency} ${expense.amount.toFixed(2)}</td></tr>`;

        const approvalsHtml = expense.approvalSteps.length > 0
            ? expense.approvalSteps.map(step => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${step.stepType}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${step.status}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${step.approvedByUser?.name || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${step.resolvedAt ? new Date(step.resolvedAt).toLocaleDateString() : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${step.comment || '-'}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: center;">No approval history</td></tr>';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Expense Report #${expense.id}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
        h1 { color: #2563eb; margin-bottom: 5px; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
        .meta { color: #666; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f3f4f6; text-align: left; border: 1px solid #ddd; padding: 10px; font-size: 12px; }
        td { font-size: 13px; }
        .total-row { background: #f3f4f6; font-weight: bold; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-submitted { background: #dbeafe; color: #1e40af; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        .info-item .value { font-size: 16px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <img src="${baseUrl}/branding/logo.png" alt="YoLa Fresh" style="height: 50px; width: auto;" onerror="this.style.display='none'" />
            <div style="text-align: right; color: #666; font-size: 12px;">
                EXPENSE REPORT<br>
                #${expense.id}
            </div>
        </div>
        <h1>${expense.title}</h1>
        <p class="meta">
            Submitted by ${expense.user.name} (${expense.user.email})<br>
            Created: ${new Date(expense.createdAt).toLocaleDateString()}
        </p>
    </div>

    <div class="section">
        <div class="info-grid">
            <div class="info-item">
                <label>Total Amount</label>
                <div class="value">${expense.currency} ${expense.amount.toFixed(2)}</div>
            </div>
            <div class="info-item">
                <label>Date of Expense</label>
                <div class="value">${new Date(expense.dateOfExpense).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
                <label>Status</label>
                <div><span class="status status-${expense.currentStatus.toLowerCase().split('_')[0]}">${expense.currentStatus.replace(/_/g, ' ')}</span></div>
            </div>
            <div class="info-item">
                <label>Category</label>
                <div class="value" style="text-transform: capitalize;">${expense.category || 'Multiple'}</div>
            </div>
        </div>
    </div>

    ${expense.description ? `
    <div class="section">
        <div class="section-title">Notes</div>
        <p>${expense.description}</p>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Expense Items</div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${lineItemsHtml}
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="4" style="border: 1px solid #ddd; padding: 10px; text-align: right;">TOTAL</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${expense.currency} ${expense.amount.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Approval History</div>
        <table>
            <thead>
                <tr>
                    <th>Step</th>
                    <th>Status</th>
                    <th>Approved By</th>
                    <th>Date</th>
                    <th>Comment</th>
                </tr>
            </thead>
            <tbody>
                ${approvalsHtml}
            </tbody>
        </table>
    </div>

    <div class="section" style="margin-top: 60px;">
        <div style="display: flex; justify-content: space-between;">
            <div style="width: 200px; border-top: 1px solid #000; padding-top: 5px; text-align: center;">
                <small>Employee Signature</small>
            </div>
            <div style="width: 200px; border-top: 1px solid #000; padding-top: 5px; text-align: center;">
                <small>Manager Approval</small>
            </div>
            <div style="width: 200px; border-top: 1px solid #000; padding-top: 5px; text-align: center;">
                <small>Finance Approval</small>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>YoLa Fresh Expense Management System</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
        `;

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="expense-report-${expense.id}.html"`
            }
        });

    } catch (error) {
        console.error('PDF export error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
