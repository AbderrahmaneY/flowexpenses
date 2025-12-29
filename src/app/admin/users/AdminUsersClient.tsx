'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function AdminUsersClient({ user: sessionUser }: { user: any }) {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/users').then(r => r.json()),
            fetch('/api/admin/roles').then(r => r.json())
        ]).then(([usersData, rolesData]) => {
            console.log('Users fetched:', usersData);
            setUsers(usersData);
            setRoles(rolesData);
            setLoading(false);
        }).catch(err => {
            console.error('Fetch error:', err);
            setLoading(false);
        });
    }, []);

    const handleRoleChange = async (userId: number, newRoleId: string) => {
        const roleId = parseInt(newRoleId);
        const originalUsers = [...users];
        const newRole = roles.find(r => r.id === roleId);

        // Optimistic update
        setUsers(users.map(u =>
            u.id === userId ? { ...u, roleId, role: newRole } : u
        ));

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleId })
            });

            if (!res.ok) throw new Error('Failed to update');
        } catch (error) {
            setUsers(originalUsers);
            alert('Failed to update role');
        }
    };

    const handleLogout = () => {
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation user={sessionUser} onLogout={handleLogout} />

            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-500">Manage system access and permissions</p>
                    </div>
                    <Link href="/admin/users/new" className="btn btn-primary">
                        + Add New User
                    </Link>
                </div>

                <div className="flex gap-2 mb-6">
                    <a
                        href="/admin/users"
                        className="btn btn-primary"
                    >
                        Users
                    </a>
                    <a
                        href="/admin/roles"
                        className="btn btn-secondary text-gray-600 hover:text-gray-900"
                    >
                        Roles
                    </a>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading users...</div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="p-4 font-semibold text-gray-600">User</th>
                                        <th className="p-4 font-semibold text-gray-600">Current Role</th>
                                        <th className="p-4 font-semibold text-gray-600">Permissions (Read-Only)</th>
                                        <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={user.roleId}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="form-input py-1 text-sm border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                                >
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>{role.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {user.role?.canSubmit && <span className="badge badge-gray">Submit</span>}
                                                    {user.role?.canApprove && <span className="badge badge-blue">Approve</span>}
                                                    {user.role?.canProcess && <span className="badge badge-green">Process</span>}
                                                    {user.role?.isAdmin && <span className="badge badge-amber">Admin</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={async () => {
                                                            const newPwd = prompt(`Enter new password for ${user.name} (min 8 characters):`);
                                                            if (!newPwd) return;
                                                            if (newPwd.length < 8) {
                                                                alert('Password must be at least 8 characters');
                                                                return;
                                                            }
                                                            try {
                                                                const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ newPassword: newPwd })
                                                                });
                                                                if (res.ok) {
                                                                    alert(`Password reset for ${user.name}. User will be required to change it on next login.`);
                                                                } else {
                                                                    const err = await res.json();
                                                                    alert(err.error || 'Failed to reset password');
                                                                }
                                                            } catch (e) {
                                                                alert('Error resetting password');
                                                            }
                                                        }}
                                                        className="text-amber-600 hover:text-amber-800 font-medium text-sm"
                                                        title="Reset Password"
                                                    >
                                                        🔑 Reset
                                                    </button>
                                                    <Link href={`/admin/users/${user.id}/edit`} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                                                        ✏️ Edit
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
