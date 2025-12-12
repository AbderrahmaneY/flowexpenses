'use client';

import { useEffect, useState, use } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionUser, setSessionUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        canSubmit: false,
        canApprove: false,
        canProcess: false,
        isAdmin: false
    });

    useEffect(() => {
        // Auth
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user || !data.user.isAdmin) {
                    router.push('/dashboard');
                    return;
                }
                setSessionUser(data.user);
            });

        // Load Role
        if (id) {
            fetch('/api/admin/roles')
                .then(res => res.json())
                .then(roles => {
                    const role = roles.find((r: any) => r.id === parseInt(id));
                    if (role) {
                        setFormData({
                            name: role.name,
                            description: role.description || '',
                            canSubmit: role.canSubmit,
                            canApprove: role.canApprove,
                            canProcess: role.canProcess,
                            isAdmin: role.isAdmin
                        });
                        setLoading(false);
                    } else {
                        alert('Role not found');
                        router.push('/admin/roles');
                    }
                });
        }
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch(`/api/admin/roles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/admin/roles');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update role');
            }
        } catch (error) {
            alert('Error updating role');
        } finally {
            setSubmitting(false);
        }
    };

    if (!sessionUser || loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation user={sessionUser} onLogout={() => window.location.href = '/login'} />

            <main className="container py-8 max-w-2xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin/roles" className="text-gray-500 hover:text-gray-800">
                        ← Back to Roles
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">

                            <div>
                                <label className="form-label">Role Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-primary">Permissions</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                                            checked={formData.canSubmit}
                                            onChange={e => setFormData({ ...formData, canSubmit: e.target.checked })}
                                        />
                                        <div>
                                            <span className="font-medium block">Can Submit Expenses</span>
                                            <span className="text-sm text-gray-500">Enable creating and submitting expense reports</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
                                            checked={formData.canApprove}
                                            onChange={e => setFormData({ ...formData, canApprove: e.target.checked })}
                                        />
                                        <div>
                                            <span className="font-medium block">Can Approve (Manager)</span>
                                            <span className="text-sm text-gray-500">Enable approving reports for direct reports</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-600"
                                            checked={formData.canProcess}
                                            onChange={e => setFormData({ ...formData, canProcess: e.target.checked })}
                                        />
                                        <div>
                                            <span className="font-medium block">Can Process (Accounting)</span>
                                            <span className="text-sm text-gray-500">Enable final processing and reimbursement</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-amber-100 bg-amber-50 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-600"
                                            checked={formData.isAdmin}
                                            onChange={e => setFormData({ ...formData, isAdmin: e.target.checked })}
                                        />
                                        <div>
                                            <span className="font-medium block text-amber-900">Administrator</span>
                                            <span className="text-sm text-amber-700">Full system access including user management</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Link href="/admin/roles" className="btn btn-secondary">Cancel</Link>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
