import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/jobs/post', '/profile'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. If trying to access a protected route without a token, redirect to login
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !token) {
    const loginUrl = new URL('/login', request.url);
    // Optional: save the target URL to redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  // 2. If trying to access login/register with an active token, redirect to jobs page
  if (AUTH_ROUTES.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/jobs', request.url));
  }

  // 3. If a logged-in user visits the root, redirect to jobs
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/jobs', request.url));
  }

  return NextResponse.next();
}

// Config to specify exactly which routes this middleware applies to
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/jobs/post',
    '/profile',
    '/login',
    '/register',
  ],
};
