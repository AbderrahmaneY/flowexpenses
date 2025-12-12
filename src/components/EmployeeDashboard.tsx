'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EmployeeDashboard({ user }: { user: any }) {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/expenses')
            .then(res => res.json())
            .then(data => {
                setExpenses(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    // Filter for Details Requested
    const detailsRequested = expenses.filter(e => e.currentStatus === 'DETAILS_REQUESTED');

    return (
        <div>
            {/* Action Required Section */}
            {detailsRequested.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Action Required
                    </h2>
                    <div className="grid gap-4">
                        {detailsRequested.map(expense => (
                            <div key={expense.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-amber-900">{expense.title}</p>
                                    <p className="text-amber-700 text-sm mt-1">Accounting has requested changes or details for this expense.</p>
                                    <div className="mt-2 text-xs font-mono bg-white/50 inline-block px-2 py-1 rounded text-amber-800">
                                        Status: DETAILS REQUESTED
                                    </div>
                                </div>
                                <Link href={`/expenses/${expense.id}/edit`} className="btn btn-sm bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 shadow-sm">
                                    Edit & Resubmit
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">My Expenses</h2>
                <Link href="/expenses/new" className="btn btn-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    New Expense
                </Link>
            </div>

            {loading ? (
                <p className="text-center py-8 text-gray-500">Loading expenses...</p>
            ) : expenses.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">📝</div>
                    <h3 className="empty-state-title">No Expenses Yet</h3>
                    <p className="empty-state-text">You haven't submitted any expense reports yet.</p>
                    <Link href="/expenses/new" className="btn btn-secondary">Create your first expense</Link>
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
                            {expenses.map((expense) => (
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
                </div>
            )}
        </div>
    );
}
