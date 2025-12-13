'use client';

import { useState, useEffect } from 'react';
import BackButton from '@/components/BackButton';

interface User {
    userId: number;
    name: string;
    email: string;
    canSubmit: boolean;
    canApprove: boolean;
    canProcess: boolean;
    isAdmin: boolean;
}

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

export default function ApprovalsClient({ user }: { user: User }) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectComment, setRejectComment] = useState('');

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    async function fetchPendingApprovals() {
        try {
            const res = await fetch('/api/approvals');
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Failed to fetch approvals:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(expenseId: number, action: 'approve' | 'reject', comment?: string) {
        setActionLoading(expenseId);
        try {
            const res = await fetch('/api/approvals/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expenseId, action, comment }),
            });

            if (res.ok) {
                // Remove from list after action
                setExpenses(expenses.filter(e => e.id !== expenseId));
                // Clear rejection state
                setRejectingId(null);
                setRejectComment('');
            } else {
                const data = await res.json();
                console.error('Action failed:', data.error);
                alert(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Action failed:', error);
            alert('Network error. Please try again.');
        } finally {
            setActionLoading(null);
        }
    }

    function getStatusBadgeClass(status: string): string {
        const statusLower = status.toLowerCase().replace('_', '-');
        const statusMap: Record<string, string> = {
            'draft': 'badge-draft',
            'submitted': 'badge-submitted',
            'manager-approved': 'badge-approved',
            'manager-rejected': 'badge-rejected',
            'accounting-validated': 'badge-approved',
            'accounting-rejected': 'badge-rejected',
            'paid': 'badge-paid',
        };
        return statusMap[statusLower] || 'badge-pending';
    }

    function formatStatus(status: string): string {
        return status.replace(/_/g, ' ');
    }

    const handleRejectClick = (id: number) => {
        setRejectingId(id);
        setRejectComment('');
    };

    const submitRejection = () => {
        if (rejectingId) {
            if (!rejectComment.trim()) {
                alert('Please enter a reason for rejection');
                return;
            }
            handleAction(rejectingId, 'reject', rejectComment.trim());
        }
    };

    const closeRejectModal = () => {
        setRejectingId(null);
        setRejectComment('');
    };

    if (loading) {
        return (
            <div className="page-container">
                <BackButton />
                <div className="page-header">
                    <h1 className="page-title">Approvals</h1>
                </div>
                <div className="card">
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <BackButton />
            <div className="page-header">
                <h1 className="page-title">Pending Approvals</h1>
                <p className="page-subtitle">Review and approve expense requests from your team</p>
            </div>

            {expenses.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">✓</div>
                        <h3 className="empty-state-title">All caught up!</h3>
                        <p className="empty-state-text">No pending expenses to review.</p>
                    </div>
                </div>
            ) : (
                <div className="table-container">
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
                            {expenses.map((expense) => (
                                <tr key={expense.id}>
                                    <td>
                                        <div>
                                            <div className="font-medium text-gray-900">{expense.user.name}</div>
                                            <div className="text-sm text-gray-500">{expense.user.email}</div>
                                        </div>
                                    </td>
                                    <td>{expense.title}</td>
                                    <td>
                                        <span className="capitalize">{expense.category}</span>
                                    </td>
                                    <td>{new Date(expense.dateOfExpense).toLocaleDateString()}</td>
                                    <td className="font-medium">
                                        {expense.currency} {expense.amount.toFixed(2)}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadgeClass(expense.currentStatus)}`}>
                                            {formatStatus(expense.currentStatus)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(expense.id, 'approve')}
                                                className="btn btn-success btn-sm"
                                                disabled={actionLoading === expense.id}
                                            >
                                                {actionLoading === expense.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(expense.id)}
                                                className="btn btn-danger btn-sm"
                                                disabled={actionLoading === expense.id}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="card-header">
                            <h3 className="card-title">Reject Expense</h3>
                        </div>
                        <div className="p-4 pt-0">
                            <p className="text-sm text-gray-500 mb-4">
                                Please provide a reason for rejecting this expense report. This will be visible to the employee.
                            </p>
                            <div className="form-group">
                                <label className="form-label">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="form-input min-h-[100px]"
                                    placeholder="e.g. Policy violation, missing receipt..."
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                            <button
                                onClick={closeRejectModal}
                                className="btn btn-secondary"
                                disabled={actionLoading === rejectingId}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRejection}
                                className="btn btn-danger"
                                disabled={actionLoading === rejectingId}
                            >
                                {actionLoading === rejectingId ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
