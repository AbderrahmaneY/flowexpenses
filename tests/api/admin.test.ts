import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/users/route';
import { NextRequest } from 'next/server';
import { resetTestDatabase, seedTestUsers } from '../helpers/db';
import * as AuthLib from '@/lib/auth';

describe('Admin API', () => {
    let users: any;

    beforeEach(async () => {
        await resetTestDatabase();
        users = await seedTestUsers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('Admin can list users', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.admin);
        const req = new NextRequest('http://localhost/api/admin/users');
        const res = await GET(req);
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.length).toBeGreaterThanOrEqual(4);
    });

    it('Admin can create new user', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.admin);
        const req = new NextRequest('http://localhost/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                name: 'New Guy',
                email: 'new@test.com',
                password: 'pass',
                canSubmit: true
            })
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    it('Non-admin cannot list users', async () => {
        vi.spyOn(AuthLib, 'getSession').mockResolvedValue(users.manager);
        const req = new NextRequest('http://localhost/api/admin/users');
        const res = await GET(req);
        expect(res.status).toBe(403);
    });
});
