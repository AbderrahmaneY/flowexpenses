import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, login } from '@/lib/auth'; // We need login to update the session payload
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { password } = await request.json();

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({
            where: { id: session.userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false // Clear the flag
            },
            include: { role: true }
        });

        // Update the session to remove the mustChangePassword flag
        await login({
            userId: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            roleId: updatedUser.roleId,
            roleName: updatedUser.role.name,
            canSubmit: updatedUser.role.canSubmit,
            canApprove: updatedUser.role.canApprove,
            canProcess: updatedUser.role.canProcess,
            isAdmin: updatedUser.role.isAdmin,
            mustChangePassword: false, // Updated
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
