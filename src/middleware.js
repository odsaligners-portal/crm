import { NextResponse } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/signin', '/register'];

// List of role-specific routes
const adminRoutes = ['/admin'];
const doctorRoutes = ['/doctor'];
const superAdminRoutes = ['/super-admin'];

export function middleware(request) {
  const token = request.cookies.get('token');
  const userRole = request.cookies.get('userRole')?.value;
  
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

  // Role-based access control
  if (userRole === 'super-admin' && !pathname.startsWith('/super-admin')) {
    return NextResponse.redirect(new URL('/super-admin', request.url));
  }

  if (userRole === 'admin' && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (userRole === 'doctor' && !pathname.startsWith('/doctor')) {
    return NextResponse.redirect(new URL('/doctor', request.url));
  }

  // Prevent access to role-specific routes if the role does not match
  if (pathname.startsWith('/super-admin') && userRole !== 'super-admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/doctor') && userRole !== 'doctor') {
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
     * - materials (static PDFs)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|materials|logo.png|fav.png).*)',
  ],
}; 