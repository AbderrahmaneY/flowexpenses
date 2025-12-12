'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AccountingDashboard({ user }: { user: any }) {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Accounting role fetches all in our API
        fetch('/api/expenses')
            .then(res => res.json())
            .then(data => {
                setExpenses(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    return (
        <div>
            <h2>Accounting Overview</h2>

            {loading ? (
                <p>Loading expenses...</p>
            ) : expenses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="text-muted">No expenses found.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Employee</th>
                                <th style={{ padding: '1rem' }}>Title</th>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Amount</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((expense) => (
                                <tr key={expense.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '1rem' }}>{expense.user?.name}</td>
                                    <td style={{ padding: '1rem' }}>{expense.title}</td>
                                    <td style={{ padding: '1rem' }}>{new Date(expense.dateOfExpense).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>{expense.currency} {expense.amount.toFixed(2)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge badge-${expense.currentStatus.toLowerCase().split('_')[0]}`}>
                                            {expense.currentStatus.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/expenses/${expense.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
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
