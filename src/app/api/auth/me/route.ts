import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await getSession();
    // session is the user payload itself or null
    return NextResponse.json({ user: session || null });
}
