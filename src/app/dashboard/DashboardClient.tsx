'use client';

import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EmployeeDashboard from '@/components/EmployeeDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import AccountingDashboard from '@/components/AccountingDashboard';

export default function DashboardClient({ user, roleLabel }: { user: any, roleLabel: string }) {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout');
        router.push('/login');
    };

    return (
        <>
            <Navigation user={user} onLogout={handleLogout} />

            <main className="page-container">
                <div className="page-header">
                    <h1 className="page-title">Dashboard</h1>
                    <div className="welcome-section mt-2">
                        <span className="welcome-text">Welcome back, {user.name}</span>
                        <div className="role-badges">
                            {user.canSubmit && <span className="badge badge-role-submitter">Submitter</span>}
                            {user.canApprove && <span className="badge badge-role-manager">Manager</span>}
                            {user.canProcess && <span className="badge badge-role-accounting">Accounting</span>}
                            {user.isAdmin && <span className="badge badge-role-admin">Admin</span>}
                        </div>
                    </div>
                </div>

                {/* Show New Expense button for ALL users with canSubmit permission */}
                {user.canSubmit && (
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => router.push('/expenses/new')}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            New Expense
                        </button>
                    </div>
                )}

                {user.canProcess ? (
                    <div className="space-y-8">
                        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 flex justify-between items-center p-6">
                            <div>
                                <h3 className="text-lg font-bold text-blue-900">Accounting Overview</h3>
                                <p className="text-blue-700 mt-1">View financial analytics and trends across the organization.</p>
                            </div>
                            <button onClick={() => router.push('/accounting')} className="btn btn-primary">
                                Go to Analytics
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <AccountingDashboard user={user} />
                    </div>
                ) : user.canApprove ? (
                    <ManagerDashboard user={user} />
                ) : (
                    <EmployeeDashboard user={user} />
                )}
            </main>
        </>
    );
}
