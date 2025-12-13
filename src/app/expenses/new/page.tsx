'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LineItem {
    id: number;
    description: string;
    category: string;
    amount: string;
    dateOfExpense: string;
}

export default function NewExpensePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    const [title, setTitle] = useState('');
    const [currency, setCurrency] = useState('MAD');
    const [description, setDescription] = useState('');

    // Line items - start with one empty item
    const [lineItems, setLineItems] = useState<LineItem[]>([{
        id: 1,
        description: '',
        category: 'meal',
        amount: '',
        dateOfExpense: new Date().toISOString().split('T')[0]
    }]);

    const addLineItem = () => {
        setLineItems([...lineItems, {
            id: Date.now(),
            description: '',
            category: 'meal',
            amount: '',
            dateOfExpense: new Date().toISOString().split('T')[0]
        }]);
    };

    const removeLineItem = (id: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: number, field: keyof LineItem, value: string) => {
        setLineItems(lineItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const calculateTotal = () => {
        return lineItems.reduce((sum, item) => {
            const amount = parseFloat(item.amount) || 0;
            return sum + amount;
        }, 0);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const validFiles = newFiles.filter(file => {
                if (file.size > 2 * 1024 * 1024) {
                    alert(`File ${file.name} is too large (max 2MB)`);
                    return false;
                }
                return true;
            });
            setFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'SUBMITTED') => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate
        if (!title.trim()) {
            setError('Please enter a report title');
            setLoading(false);
            return;
        }

        const validItems = lineItems.filter(item => item.description && item.amount);
        if (validItems.length === 0) {
            setError('Please add at least one expense item with description and amount');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                title,
                description,
                currency,
                dateOfExpense: lineItems[0]?.dateOfExpense || new Date().toISOString().split('T')[0],
                status,
                lineItems: validItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    amount: parseFloat(item.amount),
                    dateOfExpense: item.dateOfExpense
                }))
            };

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create expense');
            }

            const expense = await res.json();

            // Upload files if any
            if (files.length > 0) {
                const uploadData = new FormData();
                files.forEach(file => {
                    uploadData.append('files', file);
                });

                await fetch(`/api/expenses/${expense.id}/attachments`, {
                    method: 'POST',
                    body: uploadData
                });
            }

            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    return (
        <div className="container py-8 max-w-3xl mx-auto">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 mb-6 inline-block">
                &larr; Back to Dashboard
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">New Expense Report</h1>

            <div className="card">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                <form className="space-y-6">
                    {/* Report Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">
                                Report Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="form-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                placeholder="e.g. Business Trip Dec 2025"
                            />
                        </div>
                        <div>
                            <label className="form-label">Currency</label>
                            <select
                                className="form-input"
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                            >
                                <option value="MAD">MAD</option>
                            </select>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Expense Items</h3>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {lineItems.map((item, index) => (
                                <div key={item.id} className="p-4 bg-white">
                                    <div className="flex items-start gap-4">
                                        <span className="text-gray-400 font-medium pt-2">{index + 1}.</span>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                                                <input
                                                    className="form-input text-sm"
                                                    placeholder="e.g. Client lunch"
                                                    value={item.description}
                                                    onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                                                <select
                                                    className="form-input text-sm"
                                                    value={item.category}
                                                    onChange={e => updateLineItem(item.id, 'category', e.target.value)}
                                                >
                                                    <option value="meal">Meal</option>
                                                    <option value="transport">Transport</option>
                                                    <option value="hotel">Hotel</option>
                                                    <option value="mileage">Mileage</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input text-sm"
                                                    placeholder="0.00"
                                                    value={item.amount}
                                                    onChange={e => updateLineItem(item.id, 'amount', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-6">
                                            <input
                                                type="date"
                                                className="form-input text-sm w-36"
                                                value={item.dateOfExpense}
                                                onChange={e => updateLineItem(item.id, 'dateOfExpense', e.target.value)}
                                            />
                                            {lineItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLineItem(item.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remove item"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={addLineItem}
                                className="text-primary hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Line Item
                            </button>
                            <div className="text-right">
                                <span className="text-gray-500 text-sm">Total:</span>
                                <span className="ml-2 text-xl font-bold text-gray-900">
                                    {formatCurrency(calculateTotal())}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="form-label">
                            Receipts & Attachments <span className="text-gray-400 font-normal">(optional, max 2MB each)</span>
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="space-y-1 text-center">
                                <svg
                                    className="mx-auto text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    style={{ width: '48px', height: '48px' }}
                                >
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-indigo-500">
                                        <span>Upload files</span>
                                        <input id="file-upload" type="file" className="sr-only" multiple accept="image/*,.pdf" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 2MB</p>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                                {files.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                                        <div className="flex w-0 flex-1 items-center">
                                            <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                                            <span className="ml-2 text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                        <button type="button" onClick={() => removeFile(index)} className="ml-4 font-medium text-red-600 hover:text-red-500">Remove</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-input"
                            rows={2}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Additional notes or context..."
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'SUBMITTED')}
                            className="btn btn-primary flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Expense Report'}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'DRAFT')}
                            className="btn btn-outline flex-1"
                            disabled={loading}
                        >
                            Save Draft
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
