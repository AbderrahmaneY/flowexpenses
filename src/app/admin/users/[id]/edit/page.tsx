'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    // Unwrap params in Next.js 15+ 
    // Wait, params is a Promise as per type, so we use use() hook or await.
    const { id } = use(params);

    const [managers, setManagers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Optional
        managerId: '',
        roleId: ''
    });

    useEffect(() => {
        // Auth Check
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user || !data.user.isAdmin) {
                    router.push('/dashboard');
                    return;
                }
                setSessionUser(data.user);
            });

        // Load Data
        Promise.all([
            fetch('/api/admin/users').then(r => r.json()),
            fetch('/api/admin/users/managers').then(r => r.json()),
            fetch('/api/admin/roles').then(r => r.json())
        ]).then(([users, managersData, rolesData]) => {
            setManagers(managersData || []);
            setRoles(rolesData || []);

            if (id) {
                const user = users.find((u: any) => u.id === parseInt(id));
                if (user) {
                    setFormData({
                        name: user.name,
                        email: user.email,
                        password: '', // Don't show hash
                        managerId: user.managerId ? String(user.managerId) : '',
                        roleId: user.roleId ? String(user.roleId) : ''
                    });
                    setLoading(false);
                } else {
                    alert('User not found');
                    router.push('/admin/users');
                }
            }
        });
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload: any = { ...formData };
            if (!payload.password) delete payload.password; // Don't send empty pwd

            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/admin/users');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update user');
            }
        } catch (error) {
            alert('Error updating user');
        } finally {
            setSubmitting(false);
        }
    };

    // ... [Logout handler same] ...

    if (!sessionUser || loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation user={sessionUser} onLogout={() => window.location.href = '/login'} />

            <main className="container py-8 max-w-2xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin/users" className="text-gray-500 hover:text-gray-800">
                        ← Back to Users
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-6">

                            {/* Identity */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-primary">User Details</h3>
                                <div className="grid gap-4">
                                    <div>
                                        <label className="form-label">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Password</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                className="form-input"
                                                placeholder="Leave blank to keep current"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            />
                                            {id && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline text-xs whitespace-nowrap"
                                                    onClick={async () => {
                                                        const newPwd = prompt('Enter new password for this user (min 8 chars):');
                                                        if (!newPwd) return;
                                                        if (newPwd.length < 8) {
                                                            alert('Password too short');
                                                            return;
                                                        }
                                                        try {
                                                            const res = await fetch(`/api/admin/users/${id}/reset-password`, {
                                                                method: 'POST',
                                                                body: JSON.stringify({ newPassword: newPwd }),
                                                                headers: { 'Content-Type': 'application/json' }
                                                            });
                                                            if (res.ok) alert('Password reset successfully');
                                                            else alert('Failed to reset password');
                                                        } catch (e) {
                                                            alert('Error resetting password');
                                                        }
                                                    }}
                                                >
                                                    Force Reset
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Only fill input to change during update, or use "Force Reset" to set immediately.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">Role <span className="text-red-500">*</span></label>
                                            <select
                                                className="form-select"
                                                required
                                                value={formData.roleId}
                                                onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                                            >
                                                <option value="">Select Role...</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label">Manager</label>
                                            <select
                                                className="form-select"
                                                value={formData.managerId}
                                                onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                                            >
                                                <option value="">No Manager (Top Level)</option>
                                                {managers.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <Link href="/admin/users" className="btn btn-secondary">Cancel</Link>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </main >
        </div >
    );
}
