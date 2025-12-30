import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.AUTH_SECRET || 'secret-key-for-dev-only';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
    userId: number;
    email: string;
    name: string;
    roleId: number;
    roleName: string;
    canSubmit: boolean;
    canApprove: boolean;
    canProcess: boolean;
    isAdmin: boolean;
    mustChangePassword: boolean;
    expires?: Date;
}

export async function encrypt(payload: { user: SessionPayload, expires: Date }) {
    return await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Session lasts 24 hours
        .sign(key);
}

export async function decrypt(input: string): Promise<{ user: SessionPayload, expires: Date }> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    });
    return payload as any;
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    try {
        const parsed = await decrypt(session);
        return parsed.user;
    } catch (error) {
        return null;
    }
}

export async function createSession(userData: SessionPayload) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user: userData, expires });
    const cookieStore = await cookies();
    cookieStore.set('session', session, { expires, httpOnly: true });
}

export async function login(userData: SessionPayload) {
    await createSession(userData);
}

export async function logout() {
    // Destroy the session
    const cookieStore = await cookies();
    cookieStore.set('session', '', { expires: new Date(0) });
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    if (!session) return;

    // Refresh output session expiry
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
        name: 'session',
        value: await encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
    });
    return res;
}

