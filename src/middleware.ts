import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/pricing', '/about'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Auth routes (login, register)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Protected routes (dashboard, projects, etc.)
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/projects') || 
                          pathname.startsWith('/parcels');

  // If user is logged in and tries to access auth routes, redirect to dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access protected routes, redirect to login
  if (!isLoggedIn && isProtectedRoute) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};

