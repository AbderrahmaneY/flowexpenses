import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test query
        const userCount = await prisma.user.count();

        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            userCount,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL,
                nodeEnv: process.env.NODE_ENV
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
