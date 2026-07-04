import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for server-side route protection.
 * Prevents client-side authentication flicker.
 */
export function middleware(request: NextRequest) {
  // Retrieve token from cookies
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedPath = pathname.startsWith('/tasks') || pathname.startsWith('/annotate');
  const isAuthPath = pathname.startsWith('/login');

  // If user is trying to access protected path and is not authenticated
  if (isProtectedPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login page, redirect them to /tasks
  if (isAuthPath && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/tasks';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Scopes middleware matching
export const config = {
  matcher: [
    '/tasks/:path*',
    '/annotate/:path*',
    '/login',
  ],
};
