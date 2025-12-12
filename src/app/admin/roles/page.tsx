import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RolesClient from './RolesClient';

export default async function RolesPage() {
    const session = await getSession();

    if (!session || !session.isAdmin) {
        redirect('/dashboard');
    }

    return <RolesClient user={session} />;
}
