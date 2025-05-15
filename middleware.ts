import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Custom type for decoded JWT payload
interface JwtPayload {
  userId: number;
  email: string;
  role: 'customer' | 'vendor' | 'admin' | 'sales' | 'installer';
  iat?: number;
  exp?: number;
}

export async function middleware(request: NextRequest) {
  // Get path info
  const { pathname } = request.nextUrl;
  console.log('Middleware processing path:', pathname);

  // Define URLs that require specific roles
  const roleRestrictedPaths = [
    { path: '/admin', roles: ['admin'] },
    { path: '/vendor', roles: ['vendor'] },
    { path: '/sales', roles: ['sales', 'admin'] },
    { path: '/installer', roles: ['installer', 'admin'] },
    { path: '/account', roles: ['customer', 'vendor', 'admin', 'sales', 'installer'] }
  ];

  // Handle login/register pages when user is already authenticated
  if (pathname === '/login' || pathname === '/register') {
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'smartblindshub_secret');
        const { payload } = await jose.jwtVerify(token, secret);
        const decoded = payload as JwtPayload;
        console.log('Authenticated user accessing login/register:', { role: decoded.role });

        // Get the redirect URL from query params or use role-based default
        const searchParams = request.nextUrl.searchParams;
        const redirectTo = searchParams.get('redirect') || (
          decoded.role === 'admin' ? '/admin' :
          decoded.role === 'vendor' ? '/vendor' :
          decoded.role === 'sales' ? '/sales' :
          decoded.role === 'installer' ? '/installer' :
          '/account'
        );

        return NextResponse.redirect(new URL(redirectTo, request.url));
      } catch (error) {
        // Invalid or expired token, let them continue to login/register
        console.error('Token verification error:', error);
        // Clear the invalid token
        const response = NextResponse.next();
        response.cookies.delete('auth_token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // Check if current path requires authentication
  const requiresAuth = roleRestrictedPaths.some(route => 
    pathname === route.path || pathname.startsWith(`${route.path}/`)
  );
  console.log('Requires auth:', requiresAuth);

  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  console.log('Auth token present:', !!token);

  // Handle protected routes
  if (requiresAuth) {
    // If no token, redirect to login with return URL
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      console.log('No token, redirecting to:', url.toString());
      return NextResponse.redirect(url);
    }

    try {
      // Verify token using jose
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'smartblindshub_secret');
      const { payload } = await jose.jwtVerify(token, secret);
      const decoded = payload as JwtPayload;
      console.log('Token verified for user:', { email: decoded.email, role: decoded.role });

      // Find which route pattern matches the current path
      const matchedRoute = roleRestrictedPaths.find(route => 
        pathname === route.path || pathname.startsWith(`${route.path}/`)
      );

      // Check if user has the required role for this path
      if (matchedRoute && !matchedRoute.roles.includes(decoded.role)) {
        console.log('User role not authorized:', { userRole: decoded.role, requiredRoles: matchedRoute.roles });
        // Redirect to home page if user doesn't have required role
        return NextResponse.redirect(new URL('/', request.url));
      }

      // User is authenticated and authorized, let them proceed
      console.log('User authorized to access:', pathname);
      return NextResponse.next();
    } catch (error) {
      console.error('Token verification failed:', error);
      // Token is invalid or expired, redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Update the matcher to include all relevant paths
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/vendor',
    '/vendor/:path*',
    '/sales',
    '/sales/:path*',
    '/installer',
    '/installer/:path*',
    '/account',
    '/account/:path*',
    '/login',
    '/register'
  ]
};
