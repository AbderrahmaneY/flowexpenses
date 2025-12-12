'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navigation({ user, onLogout }: { user: any, onLogout: () => void }) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
        ? 'nav-link active'
        : 'nav-link';

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    // Get initials for avatar
    const initials = user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <nav className="navbar">
            {/* Brand */}
            <Link href="/dashboard" className="nav-brand">
                <img
                    src="/branding/logo.png"
                    alt="YoLa Fresh"
                    className="h-10 w-auto object-contain"
                    style={{ maxWidth: '150px' }}
                />
            </Link>

            {/* Center Links - Pill Style */}
            <div className="nav-links hidden md:flex">
                <Link href="/dashboard" className={isActive('/dashboard')}>
                    Dashboard
                </Link>

                {user.canApprove && (
                    <Link href="/approvals" className={isActive('/approvals')}>
                        Approvals
                    </Link>
                )}

                {user.canProcess && (
                    <Link href="/accounting" className={isActive('/accounting')}>
                        Accounting
                    </Link>
                )}

                {user.isAdmin && (
                    <Link href="/admin/users" className={isActive('/admin')}>
                        Admin
                    </Link>
                )}
            </div>

            {/* Right: User Menu */}
            <div className="relative" ref={menuRef}>
                <div
                    className="user-menu"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <div className="user-avatar">
                        {initials}
                    </div>
                    <span className="user-name hidden sm:block">{user.name}</span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Signed in as</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                        </div>
                        <Link
                            href="/change-password"
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Change Password
                        </Link>
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center gap-2 border-t border-gray-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
