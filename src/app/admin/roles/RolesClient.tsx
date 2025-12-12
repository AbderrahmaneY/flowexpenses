'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

interface Role {
    id: number;
    name: string;
    description: string | null;
    canSubmit: boolean;
    canApprove: boolean;
    canProcess: boolean;
    isAdmin: boolean;
    _count: { users: number };
}

export default function RolesClient({ user: sessionUser }: { user: any }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        canSubmit: false,
        canApprove: false,
        canProcess: false,
        isAdmin: false,
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    async function fetchRoles() {
        try {
            const res = await fetch('/api/admin/roles');
            const data = await res.json();
            setRoles(data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const url = editingRole
            ? `/api/admin/roles/${editingRole.id}`
            : '/api/admin/roles';
        const method = editingRole ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchRoles();
                resetForm();
            } else {
                const err = await res.json();
                alert(err.error || 'Operation failed');
            }
        } catch (error) {
            console.error('Save failed:', error);
        }
    }

    async function handleDelete(roleId: number) {
        if (!confirm('Are you sure you want to delete this role?')) return;

        try {
            const res = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRoles();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }

    function startEdit(role: Role) {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            canSubmit: role.canSubmit,
            canApprove: role.canApprove,
            canProcess: role.canProcess,
            isAdmin: role.isAdmin,
        });
        setShowForm(true);
    }

    function resetForm() {
        setEditingRole(null);
        setFormData({
            name: '',
            description: '',
            canSubmit: false,
            canApprove: false,
            canProcess: false,
            isAdmin: false,
        });
        setShowForm(false);
    }

    const handleLogout = () => {
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation user={sessionUser} onLogout={handleLogout} />

            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
                        <p className="text-gray-500">Define roles and their permissions</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary shadow-lg shadow-primary/30"
                    >
                        + Add New Role
                    </button>
                </div>

                <div className="flex gap-2 mb-6">
                    <a
                        href="/admin/users"
                        className="btn btn-secondary text-gray-600 hover:text-gray-900"
                    >
                        Users
                    </a>
                    <a
                        href="/admin/roles"
                        className="btn btn-primary"
                    >
                        Roles
                    </a>
                </div>

                {showForm && (
                    <div className="card mb-6 mb-slide-down">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="card-title">
                                {editingRole ? 'Edit Role' : 'New Role'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label className="form-label">
                                        Role Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        required
                                        placeholder="e.g. Sales Manager"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="form-input"
                                        placeholder="Optional description"
                                    />
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="form-label mb-3 block">Permissions</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                                            checked={formData.canSubmit}
                                            onChange={(e) => setFormData({ ...formData, canSubmit: e.target.checked })}
                                        />
                                        <span className="font-medium text-gray-700">Can Submit</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
                                            checked={formData.canApprove}
                                            onChange={(e) => setFormData({ ...formData, canApprove: e.target.checked })}
                                        />
                                        <span className="font-medium text-gray-700">Can Approve</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-600"
                                            checked={formData.canProcess}
                                            onChange={(e) => setFormData({ ...formData, canProcess: e.target.checked })}
                                        />
                                        <span className="font-medium text-gray-700">Can Process</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-2 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-600"
                                            checked={formData.isAdmin}
                                            onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                        />
                                        <span className="font-medium text-amber-700">Is Admin</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading roles...</div>
                ) : (
                    <div className="card !p-0 overflow-hidden">
                        <table className="glass-table w-full">
                            <thead>
                                <tr>
                                    <th>Role Name</th>
                                    <th>Description</th>
                                    <th className="text-center">Permissions</th>
                                    <th className="text-center">Users</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((role) => (
                                    <tr key={role.id}>
                                        <td className="font-medium text-gray-900">{role.name}</td>
                                        <td className="text-gray-500">{role.description || '-'}</td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-1">
                                                {role.canSubmit && <span className="w-2 h-2 rounded-full bg-blue-500" title="Submit"></span>}
                                                {role.canApprove && <span className="w-2 h-2 rounded-full bg-purple-500" title="Approve"></span>}
                                                {role.canProcess && <span className="w-2 h-2 rounded-full bg-green-500" title="Process"></span>}
                                                {role.isAdmin && <span className="w-2 h-2 rounded-full bg-amber-500" title="Admin"></span>}
                                            </div>
                                        </td>
                                        <td className="text-center font-mono text-gray-600">{role._count?.users || 0}</td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => startEdit(role)} className="btn btn-ghost btn-sm">
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(role.id)}
                                                    className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"
                                                    disabled={(role._count?.users || 0) > 0}
                                                    title={role._count?.users > 0 ? "Cannot delete role with assigned users" : ""}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
