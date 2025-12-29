'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Logo
        const logoUrl = window.location.origin + '/branding/logo.png';
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => {
            // Draw logo and content after image loads
            renderContent(img);
        };
        img.onerror = () => {
            // Draw content without logo if it fails
            renderContent(null);
        };

        const renderContent = (logoImg: HTMLImageElement | null) => {
            // Header
            if (logoImg) {
                doc.addImage(logoImg, 'PNG', 14, 10, 40, 15);
            }

            doc.setFontSize(10);
            doc.text('Expense Report', pageWidth - 14, 15, { align: 'right' });
            doc.text(`#${expense.id}`, pageWidth - 14, 20, { align: 'right' });

            doc.setDrawColor(37, 99, 235); // Blue color
            doc.setLineWidth(1);
            doc.line(14, 30, pageWidth - 14, 30);

            // Title & Meta
            doc.setFontSize(18);
            doc.setTextColor(37, 99, 235);
            doc.text(expense.title, 14, 40);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Submitted by: ${expense.user.name} (${expense.user.email})`, 14, 48);
            doc.text(`Created: ${new Date(expense.createdAt).toLocaleDateString()}`, 14, 53);

            // Info Grid
            let yPos = 65;
            doc.setFontSize(12);
            doc.setTextColor(0);

            // Row 1
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text('TOTAL AMOUNT', 14, yPos);
            doc.text('DATE OF EXPENSE', 105, yPos);

            yPos += 5;
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`${expense.currency} ${expense.amount.toFixed(2)}`, 14, yPos);
            doc.text(new Date(expense.dateOfExpense).toLocaleDateString(), 105, yPos);

            yPos += 12;
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text('STATUS', 14, yPos);
            doc.text('CATEGORY', 105, yPos);

            yPos += 5;
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(expense.currentStatus.replace(/_/g, ' '), 14, yPos);
            doc.text(expense.category || 'Multiple', 105, yPos);

            // Notes
            if (expense.description) {
                yPos += 20;
                doc.setFontSize(12);
                doc.setTextColor(37, 99, 235);
                doc.text('Notes', 14, yPos);

                yPos += 7;
                doc.setFontSize(10);
                doc.setTextColor(0);
                doc.text(expense.description, 14, yPos, { maxWidth: pageWidth - 28 });
                yPos += 10; // approximate height
            } else {
                yPos += 10;
            }

            // Line Items Table
            yPos += 10;
            doc.setFontSize(12);
            doc.setTextColor(37, 99, 235);
            doc.text('Expense Items', 14, yPos);

            // Prepare table data
            const tableColumn = ["#", "Description", "Category", "Date", "Amount"];
            const tableRows: any[] = [];

            expense.lineItems.forEach((item: any, index: number) => {
                const itemData = [
                    index + 1,
                    item.description,
                    item.category,
                    new Date(item.dateOfExpense).toLocaleDateString(),
                    `${expense.currency} ${item.amount.toFixed(2)}`
                ];
                tableRows.push(itemData);
            });

            // Add Total Row
            tableRows.push(['', '', 'TOTAL', '', `${expense.currency} ${expense.amount.toFixed(2)}`]);

            autoTable(doc, {
                startY: yPos + 5,
                head: [tableColumn],
                body: tableRows,
                headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
                footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
                theme: 'grid',
                styles: { fontSize: 10 },
                columnStyles: {
                    4: { halign: 'right' }
                },
                didParseCell: (data) => {
                    // Style the last row (Total)
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [243, 244, 246];
                    }
                }
            });

            // Approval History
            const finalY = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(12);
            doc.setTextColor(37, 99, 235);
            doc.text('Approval History', 14, finalY);

            const approvalRows = expense.approvalSteps?.map((step: any) => [
                step.stepType,
                step.status,
                step.approvedByUser?.name || '-',
                new Date(step.createdAt).toLocaleDateString(),
                step.comment || '-'
            ]) || [];

            if (approvalRows.length > 0) {
                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Step', 'Status', 'Approved By', 'Date', 'Comment']],
                    body: approvalRows,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] }
                });
            } else {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('No approval history available.', 14, finalY + 10);
            }

            // Footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`YoLa Fresh Expense Management System - Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            doc.save(`expense-report-${expense.id}.pdf`);
        };
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1>{expense.title}</h1>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        onClick={generatePDF}
                        className="btn btn-outline text-sm"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                        📄 Download PDF
                    </button>
                    <span className={`badge badge-${expense.currentStatus.toLowerCase().split('_')[0]}`}>
                        {expense.currentStatus.replace(/_/g, ' ')}
                    </span>
                </div>
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
                                <label className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Notes</label>
                                <p style={{ marginTop: '0.5rem' }}>{expense.description}</p>
                            </div>
                        )}

                        {/* Line Items Section */}
                        {expense.lineItems && expense.lineItems.length > 0 && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid #E4E4E7', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Expense Items</h4>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="p-2 font-semibold">Description</th>
                                            <th className="p-2 font-semibold">Category</th>
                                            <th className="p-2 font-semibold">Date</th>
                                            <th className="p-2 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {expense.lineItems.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="p-2">{item.description}</td>
                                                <td className="p-2 capitalize">{item.category}</td>
                                                <td className="p-2">{new Date(item.dateOfExpense).toLocaleDateString()}</td>
                                                <td className="p-2 text-right font-medium">{expense.currency} {item.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-gray-300 bg-gray-50">
                                            <td colSpan={3} className="p-2 font-semibold">Total</td>
                                            <td className="p-2 text-right font-bold text-lg">{expense.currency} {expense.amount.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {/* Attachments Section */}
                        {expense.attachments && expense.attachments.length > 0 && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid #E4E4E7', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                                    Attachments ({expense.attachments.length})
                                </h4>
                                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                                    {expense.attachments.map((att: any) => (
                                        <li key={att.id} className="flex items-center justify-between py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">
                                                    {att.fileType?.startsWith('image/') ? '🖼️' : '📄'}
                                                </span>
                                                <div>
                                                    <a
                                                        href={att.filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        {att.fileName}
                                                    </a>
                                                    <div className="text-xs text-gray-500">
                                                        {(att.fileSize / 1024).toFixed(0)} KB
                                                    </div>
                                                </div>
                                            </div>
                                            <a
                                                href={att.filePath}
                                                download
                                                className="text-gray-400 hover:text-gray-600"
                                                title="Download"
                                            >
                                                ⬇️
                                            </a>
                                        </li>
                                    ))}
                                </ul>
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
