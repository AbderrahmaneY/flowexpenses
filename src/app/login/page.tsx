'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('employee@flow.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                const data = await res.json();
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card w-full max-w-md p-8 relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <img
                            src="/branding/logo.png"
                            alt="YoLa Fresh"
                            className="h-16 mx-auto mb-4 object-contain"
                            style={{ maxWidth: '200px' }}
                        />
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-600 to-blue-600 mb-2">
                            Expense Management
                        </h1>
                        <p className="text-gray-500 text-sm">Sign in to manage your expenses</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@flow.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="form-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full py-3 text-base"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-500 font-medium mb-3">DEMO CREDENTIALS</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="p-2 bg-gray-50 rounded text-center border border-gray-100">employee@flow.com</div>
                            <div className="p-2 bg-gray-50 rounded text-center border border-gray-100">manager@flow.com</div>
                            <div className="p-2 bg-gray-50 rounded text-center border border-gray-100">accounting@flow.com</div>
                            <div className="p-2 bg-gray-50 rounded text-center border border-gray-100">admin@flow.com</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
