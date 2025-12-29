import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import AccountingDashboard from '@/components/AccountingDashboard';
import { logout } from '@/lib/auth';

export default async function DashboardPage() {
    const user = await getSession(); // Returns SessionPayload (User) directly

    if (!user) {
        redirect('/login');
    }

    // Determine primary role label for display
    let roleLabel = 'Employee';
    if (user.isAdmin) roleLabel = 'Admin';
    else if (user.canProcess) roleLabel = 'Accounting';
    else if (user.canApprove) roleLabel = 'Manager';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation needs a client wrapper or we use the server action for logout in it? 
                 Navigation component accepts onLogout. 
                 Since this is a Server Component, we can't pass a server action easily to a client component prop expected to be a function without 'use server'.
                 Actually Navigation is 'use client'.
                 
                 Let's wrap the logout logic or just pass a simple logout handler if possible, 
                 but Navigation expects `onLogout`.
                 
                 Simpler: Create a client wrapper for the dashboard content, 
                 OR make Navigation take a server action?
                 
                 Let's stick to the previous pattern: The Navigation component handles logout via API call in the client.
                 So `onLogout` prop in Navigation.tsx (step 595) was:
                 `export default function Navigation({ user, onLogout }: { user: any, onLogout: () => void })`
                 
                 We can't pass a server action directly as a void function prop to a client component easily in all Next versions without binding. 
                 BUT, since Navigation IS a client component, we can just define the logout handler INSIDE it or pass it.
                 
                 Wait, in AdminUsersPage (step 597), I defined handleLogout client-side.
                 Here in DashboardPage (Server Component), I can't define a client function to pass.
                 
                 Solution: Wrap the dashboard content in a Client Component `DashboardShell`? 
                 OR: Just allow `Navigation` to handle logout internally? 
                 Navigation component currently TAKES `onLogout` as a prop.
                 I should modify Navigation to handle logout itself if I can't pass it from server page.
                 
                 However, `EmployeeDashboard` etc are likely Client Components (or formatted as such).
                 
                 Let's check `src/components/Navigation.tsx`. It exports `Navigation`. 
                 I will update `src/components/Navigation.tsx` to optionally take `onLogout` OR handle it default.
                 
                 Actually, simpler fix for *this* file: maintain the server component structure but render a Client Component that holds the structure.
                 
                 Let's look at `src/app/dashboard/page.tsx` again. usage in step 583 used a form action...
                 
                 <form action={async () => { 'use server'; ... }}>
                 
                 But I replaced the header with `Navigation`.
                 
                 I will create a client component `DashboardClient.tsx` that takes the `user` and renders Navigation + Content.
             */}

            {/* Inline Client Component Pattern or just separate file? Separate file is cleaner. */}

            <DashboardClient user={user} roleLabel={roleLabel} />
        </div>
    );
}

// Helper Client Component to handle interactivity
import DashboardClient from './DashboardClient';
