import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/jobs/post', '/profile', '/settings'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname.startsWith('/auth/callback');

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/jobs', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/jobs/post',
    '/profile',
    '/settings',
    '/login',
    '/register',
    '/register/:path*',
    '/auth/callback/:path*',
  ],
};
