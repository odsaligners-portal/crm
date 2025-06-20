import { NextResponse } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/signin', '/signup', '/forgot-password'];

// List of admin-only routes
const adminRoutes = ['/admin'];

export function middleware(request) {
  const token = request.cookies.get('token');
  const userRole = request.cookies.get('userRole');
  const { pathname } = request.nextUrl;

  // Redirect logged-in users away from auth pages
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow access to public routes for non-logged in users
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // Check for admin routes
  if (adminRoutes.some(route => pathname.startsWith(route)) && userRole?.value !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 