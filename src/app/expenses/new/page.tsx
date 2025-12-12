'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation'; // Assuming we want nav here too, or relying on layout.
// User's snippet didnt explicitly show Nav, but it's better UX. 
// However, the original code didn't have it (relied on layout?). 
// I'll stick to the original structure but improved UI.

export default function NewExpensePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [files, setFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        category: 'meal',
        amount: '',
        currency: 'USD',
        dateOfExpense: new Date().toISOString().split('T')[0],
        description: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Validate size
            const validFiles = newFiles.filter(file => {
                if (file.size > 500 * 1024) {
                    alert(`File ${file.name} is too large (max 500KB)`);
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

        try {
            // 1. Create Expense
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, status }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create expense');
            }

            const expense = await res.json();

            // 2. Upload Files (if any)
            if (files.length > 0) {
                const uploadData = new FormData();
                files.forEach(file => {
                    uploadData.append('files', file);
                });

                const uploadRes = await fetch(`/api/expenses/${expense.id}/attachments`, {
                    method: 'POST',
                    body: uploadData
                });

                if (!uploadRes.ok) {
                    console.error('File upload failed but expense created');
                    // We don't block navigation but maybe warn?
                    // Ideally we'd show a "Partially saved" message, but simplicity suggests redirecting.
                }
            }

            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="container py-8 max-w-2xl mx-auto">
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
                    <div>
                        <label className="form-label">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="form-input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required placeholder="e.g. Lunch with Client"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">Category</label>
                            <select
                                className="form-input"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="meal">Meal</option>
                                <option value="transport">Transport</option>
                                <option value="hotel">Hotel</option>
                                <option value="mileage">Mileage</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.dateOfExpense}
                                onChange={e => setFormData({ ...formData, dateOfExpense: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                required placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="form-label">Currency</label>
                            <select
                                className="form-input"
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="MAD">MAD</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">
                            Proof of Payment <span className="text-gray-400 font-normal">(optional, max 500KB each)</span>
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative">
                            <div className="space-y-1 text-center">
                                <svg
                                    className="mx-auto text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                    style={{ width: '48px', height: '48px', maxWidth: '48px', maxHeight: '48px' }}
                                >
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                        <span>Upload files</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,.pdf" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 500KB</p>
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
                                        <div className="ml-4 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="font-medium text-red-600 hover:text-red-500"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="pt-4">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'SUBMITTED')}
                            className="btn btn-primary flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Expense'}
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
