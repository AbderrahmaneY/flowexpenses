import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { login } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Rate limiting by IP or email
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitKey = `login:${clientIp}:${email || 'unknown'}`;
        const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMITS.login);

        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: `Too many login attempts. Try again in ${rateCheck.resetIn} seconds.` },
                { status: 429 }
            );
        }

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });

        // Check credentials
        const isValid = user && await bcrypt.compare(password, user.password);

        if (!user || !isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (user.isActive === false) {
            return NextResponse.json(
                { error: 'Your account has been deactivated. Please contact an administrator.' },
                { status: 403 }
            );
        }

        // Credentials valid - create session with permissions from Role
        await login({
            userId: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
            roleName: user.role.name,
            canSubmit: user.role.canSubmit,
            canApprove: user.role.canApprove,
            canProcess: user.role.canProcess,
            isAdmin: user.role.isAdmin,
            mustChangePassword: user.mustChangePassword,
        });

        // Return user info (used by client to know where to redirect)
        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

