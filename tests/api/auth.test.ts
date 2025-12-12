import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import { resetTestDatabase, seedTestUsers } from '../helpers/db';

// Mock cookies
vi.mock('next/headers', () => ({
    cookies: () => ({
        set: vi.fn(),
        get: vi.fn(),
    }),
}));

describe('Auth API', () => {
    beforeEach(async () => {
        await resetTestDatabase();
    });

    it('logs in successfully with valid credentials and returns user with flags', async () => {
        const { admin } = await seedTestUsers();

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: admin.email, password: admin.password })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(admin.email);
        expect(data.user.isAdmin).toBe(true);
    });

    it('rejects invalid credentials', async () => {
        await seedTestUsers();

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@test.com', password: 'wrong' })
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
    });
});
