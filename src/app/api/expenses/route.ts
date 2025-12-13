import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canSubmitExpenses, canProcessExpenses, canAccessAdminPanel } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
        let whereClause: any = {};

        // Filter by status if provided
        if (status) {
            whereClause.currentStatus = status;
        }

        // Permission-based visibility
        // Accounting and Admin can see all expenses
        const canViewAll = canProcessExpenses(session) || canAccessAdminPanel(session);

        if (!canViewAll) {
            // Everyone else sees only their own
            whereClause.userId = session.userId;
        }

        const expenses = await prisma.expenseReport.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, email: true } },
                attachments: true,
                lineItems: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface LineItem {
    description: string;
    category: string;
    amount: number | string;
    dateOfExpense: string;
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canSubmitExpenses(session)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to submit expenses' }, { status: 403 });
    }

    try {
        let body: any = {};
        let file: File | null = null;

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            body = {
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                amount: formData.get('amount'),
                currency: formData.get('currency'),
                dateOfExpense: formData.get('dateOfExpense'),
                status: formData.get('status'),
            };
            const fileEntry = formData.get('file');
            if (fileEntry && typeof fileEntry === 'object' && 'arrayBuffer' in fileEntry) {
                file = fileEntry as File;
            }
        } else {
            body = await request.json();
        }

        const { title, description, category, amount, currency, dateOfExpense, status, lineItems } = body;

        // Validation
        if (!title) {
            return NextResponse.json({ error: 'Missing required field: Title' }, { status: 400 });
        }

        // Handle line items or single expense
        let totalAmount = 0;
        let lineItemsData: any[] = [];

        if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
            // Multi-line expense
            for (const item of lineItems as LineItem[]) {
                const itemAmount = parseFloat(String(item.amount));
                if (isNaN(itemAmount) || itemAmount <= 0) {
                    return NextResponse.json({ error: `Invalid amount in line item: ${item.description}` }, { status: 400 });
                }
                totalAmount += itemAmount;
                lineItemsData.push({
                    description: String(item.description || 'Expense Item'),
                    category: String(item.category || 'other'),
                    amount: itemAmount,
                    dateOfExpense: new Date(item.dateOfExpense || dateOfExpense)
                });
            }
        } else {
            // Single expense (backward compatibility)
            if (!amount || !dateOfExpense) {
                return NextResponse.json({ error: 'Missing required fields (Amount, Date) for single expense' }, { status: 400 });
            }
            const parsedAmount = parseFloat(String(amount));
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return NextResponse.json({ error: 'Invalid amount. Must be a positive number.' }, { status: 400 });
            }
            totalAmount = parsedAmount;
        }

        // Determine initial status
        let initialStatus = status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT';

        // Prepare File Attachment Logic
        let attachmentData = undefined;
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Ensure directory exists
            const uploadDir = join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadDir, { recursive: true });

            // Create unique filename
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const filepath = join(uploadDir, filename);

            await writeFile(filepath, buffer);

            attachmentData = {
                create: {
                    filePath: `/uploads/${filename}`,
                    fileType: file.type || 'application/octet-stream',
                    fileSize: file.size,
                    fileName: file.name
                }
            };
        }

        const expense = await prisma.expenseReport.create({
            data: {
                userId: session.userId,
                title: String(title),
                description: description ? String(description) : null,
                category: category ? String(category) : null,
                amount: totalAmount,
                currency: currency || 'USD',
                dateOfExpense: new Date(dateOfExpense || new Date()),
                currentStatus: initialStatus,
                attachments: attachmentData,
                lineItems: lineItemsData.length > 0 ? {
                    create: lineItemsData
                } : undefined
            },
            include: {
                lineItems: true
            }
        });

        return NextResponse.json(expense);

    } catch (error: any) {
        console.error('Create expense error:', error);
        return NextResponse.json(
            { error: 'Failed to create expense', details: error.message },
            { status: 500 }
        );
    }
}

