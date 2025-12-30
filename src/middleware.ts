import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

export async function middleware(request: NextRequest) {
    const session = await getSession();

    // If not logged in, let the app handle it (usually redirected by layout/page checks or other middleware logic if any)
    // But here we specifically want to check for password change requirement
    if (session && session.mustChangePassword) {
        // Allow access to change-password page and api routes (to submit the change)
        if (!request.nextUrl.pathname.startsWith('/change-password') &&
            !request.nextUrl.pathname.startsWith('/api/') &&
            !request.nextUrl.pathname.startsWith('/_next/')) {
            return NextResponse.redirect(new URL('/change-password', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
