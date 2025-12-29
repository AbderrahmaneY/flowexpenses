import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ApprovalsClient from './ApprovalsClient';

export default async function ApprovalsPage() {
    // getSession internally checks cookies or headers as needed in this implementation
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (!session.canApprove) {
        redirect('/dashboard');
    }

    return <ApprovalsClient user={session} />;
}
