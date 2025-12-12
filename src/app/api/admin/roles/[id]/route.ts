import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canAccessAdminPanel } from '@/lib/permissions';

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !canAccessAdminPanel(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const params = await props.params;
        const id = parseInt(params.id);
        const body = await request.json();
        const { name, canSubmit, canApprove, canProcess, isAdmin, description } = body;

        const role = await prisma.role.update({
            where: { id },
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
        console.error('Error updating role:', error);
        return NextResponse.json({ error: 'Error updating role' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session || !canAccessAdminPanel(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const params = await props.params;
        const id = parseInt(params.id);

        // Check if role is in use
        const userCount = await prisma.user.count({
            where: { roleId: id }
        });

        if (userCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete role that is assigned to users' },
                { status: 400 }
            );
        }

        await prisma.role.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting role:', error);
        return NextResponse.json({ error: 'Error deleting role' }, { status: 500 });
    }
}
