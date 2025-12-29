import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canAccessAdminPanel } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session || !canAccessAdminPanel(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const managers = await prisma.user.findMany({
            where: {
                role: {
                    canApprove: true
                }
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(managers);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
