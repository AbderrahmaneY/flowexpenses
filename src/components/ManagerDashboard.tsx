'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ManagerDashboard({ user }: { user: any }) {
    const [myExpenses, setMyExpenses] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/expenses').then(r => r.ok ? r.json() : []),
            fetch('/api/approvals').then(r => r.ok ? r.json() : [])
        ]).then(([expensesData, approvalsData]) => {
            setMyExpenses(expensesData);
            setApprovals(approvalsData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);



    return (
        <div className="space-y-8">
            {/* Section 1: My Expenses */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">My Expenses</h2>
                    {/* Fix 1: Show New Expense button for managers */}
                    {user.canSubmit && (
                        <Link href="/expenses/new" className="btn btn-primary">
                            + New Expense
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="card text-center py-8 text-gray-400">Loading...</div>
                ) : myExpenses.length === 0 ? (
                    <div className="card text-center py-8 text-gray-500 bg-gray-50 border-dashed border-2 border-gray-200">
                        You have not submitted any expenses yet.
                    </div>
                ) : (
                    <div className="table-container card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myExpenses.slice(0, 5).map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="font-medium">{expense.title}</td>
                                        <td>{new Date(expense.dateOfExpense).toLocaleDateString()}</td>
                                        <td className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</td>
                                        <td>
                                            <span className={`badge badge-${expense.currentStatus.toLowerCase()}`}>
                                                {expense.currentStatus.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <Link href={`/expenses/${expense.id}`} className="btn btn-ghost btn-sm">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {myExpenses.length > 5 && (
                            <div className="p-3 text-center border-t border-gray-100">
                                <Link href="/expenses" className="text-sm text-indigo-600 hover:text-indigo-800">
                                    View all expenses
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Section 2: Pending Approvals (Merged) */}
            {user.canApprove && (
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Pending Approvals <span className="text-gray-400 text-lg font-normal">({approvals.length})</span></h2>
                    </div>

                    {loading ? (
                        <div className="card text-center py-8 text-gray-400">Loading...</div>
                    ) : approvals.length === 0 ? (
                        <div className="empty-state card">
                            <div className="empty-state-icon">👍</div>
                            <h3 className="empty-state-title">All Caught Up</h3>
                            <p className="empty-state-text">You have no pending approvals at the moment.</p>
                        </div>
                    ) : (
                        <div className="table-container card">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Expense Title</th>
                                        <th>Submitted By</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvals.map(a => (
                                        <tr key={a.id}>
                                            <td className="font-medium text-gray-900">{a.title}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                                        {a.user.name.charAt(0)}
                                                    </div>
                                                    {a.user.name}
                                                </div>
                                            </td>
                                            <td className="font-semibold text-gray-800">{a.amount} {a.currency}</td>
                                            <td className="text-gray-500 text-sm">{new Date(a.dateOfExpense).toLocaleDateString()}</td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/expenses/${a.id}`} className="btn btn-ghost btn-sm">
                                                        Details
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
