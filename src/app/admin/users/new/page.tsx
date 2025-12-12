'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function NewUserPage() {
    const router = useRouter();
    const [managers, setManagers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        managerId: '',
        roleId: ''
    });

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user || !data.user.isAdmin) {
                    router.push('/dashboard');
                    return;
                }
                setSessionUser(data.user);
            });

        // Load managers and roles
        Promise.all([
            fetch('/api/admin/users/managers').then(r => r.json()),
            fetch('/api/admin/roles').then(r => r.json())
        ]).then(([managersData, rolesData]) => {
            const managersArr = Array.isArray(managersData) ? managersData : [];
            const rolesArr = Array.isArray(rolesData) ? rolesData : [];
            setManagers(managersArr);
            setRoles(rolesArr);
            // Set default role if available (e.g., Employee)
            const defaultRole = rolesArr.find((r: any) => r.name === 'Employee');
            if (defaultRole) {
                setFormData(prev => ({ ...prev, roleId: String(defaultRole.id) }));
            }
        });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/admin/users');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create user');
            }
        } catch (error) {
            alert('Error creating user');
        } finally {
            setSubmitting(false);
        }
    };

    // ... [Logout handler same] ...

    if (!sessionUser) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation user={sessionUser} onLogout={() => window.location.href = '/login'} />

            <main className="container py-8 max-w-2xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin/users" className="text-gray-500 hover:text-gray-800">
                        ← Back to Users
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
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
                                        <label className="form-label">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
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
                                {submitting ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </main >
        </div >
    );
}
