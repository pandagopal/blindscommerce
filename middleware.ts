import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return !!payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if the path needs protection
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      console.log('No token found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify the token
    const isValid = await verifyToken(token);
    if (!isValid) {
      console.log('Invalid token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Continue with the request
    return NextResponse.next();
  }

  // Allow access to all other paths
  return NextResponse.next();
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
