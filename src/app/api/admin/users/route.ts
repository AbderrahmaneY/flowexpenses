import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canAccessAdminPanel } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session || !canAccessAdminPanel(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            include: {
                manager: { select: { id: true, name: true } },
                role: true, // Include Role
                _count: { select: { reports: true } }
            },
            orderBy: { name: 'asc' }
        });

        // Exclude password from response
        const safeUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        return NextResponse.json(safeUsers);
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
        const { name, email, password, roleId, managerId } = body;

        if (!email || !password || !name || !roleId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                roleId: parseInt(roleId),
                managerId: managerId ? parseInt(managerId) : null
            },
            include: { role: true }
        });

        const { password: _, ...rest } = newUser;
        return NextResponse.json(rest);

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
