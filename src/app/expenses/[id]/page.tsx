'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function ExpenseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [expense, setExpense] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [sessionUser, setSessionUser] = useState<any>(null); // To know if I am the approver
    const [comment, setComment] = useState('');

    useEffect(() => {
        // Fetch session user first
        fetch('/api/auth/me').then(res => res.json()).then(data => setSessionUser(data.user));

        if (id) {
            fetch(`/api/expenses/${id}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to load');
                })
                .then(data => {
                    setExpense(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id]);

    const handleAction = async (action: 'APPROVE' | 'REJECT' | 'PAY') => {
        if (action === 'REJECT' && !comment) {
            alert('Please provide a rejection reason in the comment box.');
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch('/api/approvals/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expenseId: parseInt(id),
                    action,
                    comment
                })
            });
            if (res.ok) {
                router.refresh();
                // reload data
                const updated = await res.json();
                if (updated.success) {
                    // Fetch fresh data
                    const fresh = await fetch(`/api/expenses/${id}`).then(r => r.json());
                    setExpense(fresh);
                }
            } else {
                alert('Action failed');
            }
        } catch (e) {
            alert('Error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;
    if (!expense) return <div className="container" style={{ padding: '2rem' }}>Expense not found</div>;

    const canApprove = sessionUser && (
        (sessionUser.role === 'MANAGER' && expense.currentStatus === 'SUBMITTED') ||
        (sessionUser.role === 'DIRECTOR' && expense.currentStatus === 'MANAGER_APPROVED') ||
        (sessionUser.role === 'ACCOUNTING' && (expense.currentStatus === 'DIRECTOR_APPROVED' || (expense.currentStatus === 'MANAGER_APPROVED'))) // simplified check logic, backend handles real check
    );

    return (
        <div className="page-container">
            <BackButton />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1>{expense.title}</h1>
                <span className={`badge badge-${expense.currentStatus.toLowerCase().split('_')[0]}`}>
                    {expense.currentStatus.replace(/_/g, ' ')}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Details</h3>
                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>Report ID: #{expense.id} • Created by {expense.user.name}</p>

                        <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Amount</label>
                                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{expense.currency} {expense.amount.toFixed(2)}</div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</label>
                                <div style={{ fontSize: '1.125rem' }}>{new Date(expense.dateOfExpense).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Category</label>
                                <div style={{ fontSize: '1rem' }}>{expense.category}</div>
                            </div>
                        </div>

                        {expense.description && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Description</label>
                                <p style={{ marginTop: '0.5rem' }}>{expense.description}</p>
                            </div>
                        )}

                        {/* Attachments Section */}
                        {expense.attachments && expense.attachments.length > 0 && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid #E4E4E7', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Attachments</h4>
                                <div className="flex flex-wrap gap-4">
                                    {expense.attachments.map((att: any) => (
                                        <a
                                            key={att.id}
                                            href={att.filePath}
                                            target="_blank"
                                            className="card p-3 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
                                            style={{ minWidth: '120px', textDecoration: 'none', border: '1px solid #E4E4E7' }}
                                            rel="noopener noreferrer"
                                        >
                                            <div className="text-3xl">
                                                {att.fileType.startsWith('image/') ? '🖼️' : '📄'}
                                            </div>
                                            <div className="text-sm font-medium text-gray-700 truncate w-full text-center" title={att.fileName}>
                                                {att.fileName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {(att.fileSize / 1024).toFixed(0)} KB
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {canApprove && (
                        <div className="card" style={{ marginTop: '2rem', borderColor: '#2563EB', borderWidth: '2px' }}>
                            <h3 style={{ marginBottom: '1rem', color: '#2563EB' }}>Approval Action</h3>
                            <textarea
                                className="input"
                                placeholder="Add a comment (required for rejection)..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                style={{ marginBottom: '1rem' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => handleAction(sessionUser.role === 'ACCOUNTING' && expense.currentStatus !== 'PAID' ? 'PAY' : 'APPROVE')}
                                    className="btn btn-primary"
                                    disabled={actionLoading}
                                    style={{ flex: 1 }}
                                >
                                    {sessionUser.role === 'ACCOUNTING' ? 'Validate / Pay' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleAction('REJECT')}
                                    className="btn btn-outline"
                                    style={{ color: '#EF4444', borderColor: '#EF4444', flex: 1 }}
                                    disabled={actionLoading}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Timeline</h3>
                        {expense.approvalSteps?.length === 0 ? (
                            <p className="text-muted">No activity yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none' }}>
                                {expense.approvalSteps?.map((step: any) => (
                                    <li key={step.id} style={{ marginBottom: '1rem', borderLeft: '2px solid #E2E8F0', paddingLeft: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{step.stepType} {step.status}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                            By {step.approvedByUser?.name} on {new Date(step.createdAt).toLocaleDateString()}
                                        </div>
                                        {step.comment && (
                                            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', padding: '0.5rem', background: '#F8FAFC', borderRadius: '4px' }}>
                                                "{step.comment}"
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
