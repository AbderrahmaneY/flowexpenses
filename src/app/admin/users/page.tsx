import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (!session.isAdmin) {
        redirect('/dashboard');
    }

    return <AdminUsersClient user={session} />;
}
