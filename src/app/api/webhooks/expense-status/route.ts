import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.WEBHOOK_API_KEY || 'default-secret-key';

    if (apiKey !== validApiKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { expenseId, status, paymentReference, notes } = body;

        console.log('Received Webhook update:', { expenseId, status, paymentReference });

        // In a real app, update the database here.
        // const updated = await prisma.expenseReport.update({ ... });

        return NextResponse.json({ success: true, message: 'Status updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
}
