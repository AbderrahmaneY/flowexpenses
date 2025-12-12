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
        const roles = await prisma.role.findMany({
            include: { _count: { select: { users: true } } },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !canAccessAdminPanel(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, canSubmit, canApprove, canProcess, isAdmin, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const role = await prisma.role.create({
            data: {
                name,
                description,
                canSubmit: !!canSubmit,
                canApprove: !!canApprove,
                canProcess: !!canProcess,
                isAdmin: !!isAdmin
            }
        });

        return NextResponse.json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        return NextResponse.json({ error: 'Error creating role' }, { status: 500 });
    }
}
