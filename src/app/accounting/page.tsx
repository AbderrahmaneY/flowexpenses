'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AccountingChart from '@/components/AccountingChart';

interface Expense {
    id: number;
    title: string;
    amount: number;
    currency: string;
    category: string;
    currentStatus: string;
    dateOfExpense: string;
    user: {
        name: string;
        email: string;
    };
}

export default function AccountingDashboardPage() {
    const router = useRouter();
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // Action Modal State
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [actionType, setActionType] = useState<'REJECT' | 'REQUEST_DETAILS' | null>(null);
    const [comment, setComment] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user) {
                    router.push('/login');
                    return;
                }
                if (!data.user.canProcess && !data.user.isAdmin) {
                    router.push('/dashboard');
                    return;
                }
                setSessionUser(data.user);
                loadData();
            });
    }, [router]);

    const loadData = async () => {
        try {
            // Load stats
            const statsRes = await fetch('/api/dashboard/accounting');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Load pending expenses using the Approvals API which handles the specific logic
            // (MANAGER_APPROVED + Top-Level SUBMITTED)
            const expensesRes = await fetch('/api/approvals');
            if (expensesRes.ok) {
                const expensesData = await expensesRes.json();
                setPendingExpenses(expensesData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (expenseId: number) => {
        await submitAction(expenseId, 'PAY');
    };

    const openActionModal = (expense: Expense, action: 'REJECT' | 'REQUEST_DETAILS') => {
        setSelectedExpense(expense);
        setActionType(action);
        setComment('');
    };

    const closeActionModal = () => {
        setSelectedExpense(null);
        setActionType(null);
        setComment('');
    };

    const submitAction = async (expenseId: number, action: string, actionComment?: string) => {
        setProcessingAction(true);
        try {
            const res = await fetch('/api/approvals/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenseId, action, comment: actionComment }),
            });

            if (res.ok) {
                closeActionModal();
                setPendingExpenses(pendingExpenses.filter(e => e.id !== expenseId));
                loadData(); // Reload stats
            } else {
                const data = await res.json();
                alert(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Action failed:', error);
            alert('Network error. Please try again.');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedExpense && actionType) {
            submitAction(selectedExpense.id, actionType, comment);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout');
        router.push('/login');
    };

    function formatCurrency(amount: number, currency: string = 'MAD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    if (!sessionUser) return null;

    return (
        <>
            <Navigation user={sessionUser} onLogout={handleLogout} />

            <main className="page-container">
                <div className="page-header">
                    <h1 className="page-title">Accounting Analytics</h1>
                    <p className="page-subtitle">Real-time financial overview and expense tracking.</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading metrics...</div>
                ) : stats ? (
                    <div className="space-y-8">

                        {/* Actions */}
                        <div className="flex justify-end mb-4">
                            <a href="/api/reports/export" target="_blank" className="btn btn-outline flex items-center gap-2 bg-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Export Last 30 Days (CSV)
                            </a>
                        </div>

                        {/* Summary Cards */}
                        <div className="stats-grid">
                            <div className="stat-card purple">
                                <div className="stat-icon">📥</div>
                                <div className="stat-value">{formatCurrency(stats.totalRequested)}</div>
                                <div className="stat-label">Total Requested</div>
                            </div>
                            <div className="stat-card blue">
                                <div className="stat-icon">✅</div>
                                <div className="stat-value">{formatCurrency(stats.totalApproved)}</div>
                                <div className="stat-label">Approved for Payment</div>
                            </div>
                            <div className="stat-card green">
                                <div className="stat-icon">💰</div>
                                <div className="stat-value">{formatCurrency(stats.totalExecuted)}</div>
                                <div className="stat-label">Total Executed</div>
                            </div>
                            <div className="stat-card amber">
                                <div className="stat-icon">⏳</div>
                                <div className="stat-value">{stats.pendingValidation}</div>
                                <div className="stat-label">Pending Validation</div>
                            </div>
                        </div>

                        {/* Pending Validation Queue */}
                        {pendingExpenses.length > 0 && (
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">🔔 Pending Validation ({pendingExpenses.length})</h3>
                                </div>
                                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingExpenses.map((expense) => (
                                                <tr key={expense.id}>
                                                    <td>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{expense.user.name}</div>
                                                            <div className="text-sm text-gray-500">{expense.user.email}</div>
                                                        </div>
                                                    </td>
                                                    <td>{expense.title}</td>
                                                    <td className="capitalize">{expense.category}</td>
                                                    <td>{new Date(expense.dateOfExpense).toLocaleDateString()}</td>
                                                    <td className="font-semibold">
                                                        {expense.currency} {expense.amount.toFixed(2)}
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-blue text-xs">
                                                            {expense.currentStatus.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handlePay(expense.id)}
                                                                className="btn btn-success btn-sm"
                                                                disabled={processingAction}
                                                            >
                                                                💰 Pay
                                                            </button>
                                                            <button
                                                                onClick={() => openActionModal(expense, 'REQUEST_DETAILS')}
                                                                className="btn btn-secondary btn-sm"
                                                                disabled={processingAction}
                                                            >
                                                                📝 Details
                                                            </button>
                                                            <button
                                                                onClick={() => openActionModal(expense, 'REJECT')}
                                                                className="btn btn-danger btn-sm"
                                                                disabled={processingAction}
                                                            >
                                                                ✕ Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 card">
                                <div className="card-header">
                                    <h3 className="card-title">Monthly Execution Trend</h3>
                                </div>
                                <AccountingChart data={stats.monthlyExecuted} />
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Expense Breakdown</h3>
                                </div>
                                <div className="space-y-1">
                                    {stats.byCategory.length === 0 ? (
                                        <div className="text-gray-400 text-sm text-center py-8">No expenses yet.</div>
                                    ) : (
                                        stats.byCategory.map((cat: any) => (
                                            <div key={cat.category} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${cat.category === 'transport' ? 'bg-blue-500' :
                                                        cat.category === 'meal' ? 'bg-orange-500' :
                                                            cat.category === 'hotel' ? 'bg-purple-500' :
                                                                cat.category === 'mileage' ? 'bg-green-500' :
                                                                    'bg-gray-500'
                                                        }`} />
                                                    <div>
                                                        <div className="font-medium text-gray-900 capitalize text-sm">{cat.category}</div>
                                                        <div className="text-xs text-gray-500">{cat.count} reports</div>
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-gray-700 text-sm">
                                                    {formatCurrency(cat.amount)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">⚠️</div>
                        <h3 className="empty-state-title">Data Unavailable</h3>
                        <p className="empty-state-text">We couldn't load the analytics data at this moment.</p>
                        <button onClick={loadData} className="btn btn-secondary">Retry</button>
                    </div>
                )}
            </main>

            {/* Action Modal */}
            {selectedExpense && actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="card-header">
                            <h3 className="card-title">
                                {actionType === 'REJECT' ? 'Reject Expense' : 'Request Details'}
                            </h3>
                        </div>
                        <form onSubmit={handleModalSubmit}>
                            <div className="p-4 pt-0">
                                <p className="text-sm text-gray-500 mb-4">
                                    {actionType === 'REJECT'
                                        ? 'Please provide a reason for rejecting this expense report.'
                                        : 'Please explain what additional details or corrections are needed.'}
                                </p>
                                <div className="form-group">
                                    <label className="form-label">
                                        Reason / Comment <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="form-input min-h-[100px]"
                                        placeholder="Enter your comment here..."
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                                <button type="button" onClick={closeActionModal} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className={`btn ${actionType === 'REJECT' ? 'btn-danger' : 'btn-primary'}`} disabled={processingAction}>
                                    {processingAction ? 'Processing...' : (actionType === 'REJECT' ? 'Confirm Rejection' : 'Send Request')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
