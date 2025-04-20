import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Custom type for decoded JWT payload
interface JwtPayload {
  userId: number;
  email: string;
  role: 'customer' | 'vendor' | 'admin' | 'sales' | 'installer';
  iat: number;
  exp: number;
}

export async function middleware(request: NextRequest) {
  // Get path info
  const { pathname } = request.nextUrl;

  // Define URLs that require specific roles
  const roleRestrictedPaths = [
    { path: '/admin', roles: ['admin'] },
    { path: '/vendor', roles: ['vendor'] },
    { path: '/sales', roles: ['sales', 'admin'] },
    { path: '/installer', roles: ['installer', 'admin'] },
    { path: '/account', roles: ['customer', 'vendor', 'admin', 'sales', 'installer'] }
  ];

  // Check if current path requires authentication
  const requiresAuth = roleRestrictedPaths.some(route => pathname.startsWith(route.path));

  if (requiresAuth) {
    // Get auth token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // If no token, redirect to login with return URL
    if (!token) {
      const url = new URL(`/login`, request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Verify token
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback_secret'
      );

      const { payload } = await jwtVerify(token, secret);
      const user = payload as unknown as JwtPayload;

      // Find which route pattern matches the current path
      const matchedRoute = roleRestrictedPaths.find(route => pathname.startsWith(route.path));

      // Check if user has the required role for this path
      if (matchedRoute && !matchedRoute.roles.includes(user.role)) {
        // User is authenticated but doesn't have the required role

        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'admin':
            return NextResponse.redirect(new URL('/admin', request.url));
          case 'vendor':
            return NextResponse.redirect(new URL('/vendor', request.url));
          case 'sales':
            return NextResponse.redirect(new URL('/sales', request.url));
          case 'installer':
            return NextResponse.redirect(new URL('/installer', request.url));
          case 'customer':
          default:
            return NextResponse.redirect(new URL('/account', request.url));
        }
      }
    } catch (error) {
      // Invalid token - redirect to login
      const url = new URL(`/login`, request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // If the user is accessing /login or /register but is already authenticated,
  // redirect them to their dashboard
  if (pathname === '/login' || pathname === '/register') {
    const token = request.cookies.get('auth_token')?.value;

    if (token) {
      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'fallback_secret'
        );

        const { payload } = await jwtVerify(token, secret);
        const user = payload as unknown as JwtPayload;

        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'admin':
            return NextResponse.redirect(new URL('/admin', request.url));
          case 'vendor':
            return NextResponse.redirect(new URL('/vendor', request.url));
          case 'sales':
            return NextResponse.redirect(new URL('/sales', request.url));
          case 'installer':
            return NextResponse.redirect(new URL('/installer', request.url));
          case 'customer':
          default:
            return NextResponse.redirect(new URL('/account', request.url));
        }
      } catch (error) {
        // Invalid token, let them continue to login/register
        console.error('Token verification error:', error);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
  ],
};
