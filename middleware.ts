import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { addSecurityHeaders } from '@/lib/security/headers';

// Paths that require authentication
const protectedPaths = [
  '/account',
  '/vendor',
  '/admin',
];

// Paths that are public
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// JWT verification for Edge Runtime
async function verifyToken(token: string): Promise<boolean> {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return !!payload;
  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Token verification error:', error);
    }
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response
  let response: NextResponse;

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    response = NextResponse.next();
  }
  // Check if the path needs protection
  else if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('No token found, redirecting to login');
      }
      response = NextResponse.redirect(new URL('/login', request.url));
    } else {
      // Verify the token
      const isValid = await verifyToken(token);
      if (!isValid) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Invalid token, redirecting to login');
        }
        response = NextResponse.redirect(new URL('/login', request.url));
      } else {
        response = NextResponse.next();
      }
    }
  } else {
    // Allow access to all other paths
    response = NextResponse.next();
  }
  
  // Add security headers to all responses
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
