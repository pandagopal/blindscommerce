import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simplified middleware that doesn't depend on auth module
export function middleware(request: NextRequest) {
  // Get path info
  const { pathname } = request.nextUrl;

  // For paths that need protection, check auth
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/account')
  ) {
    const token = request.cookies.get('auth_token')?.value;

    // If no token, redirect to login
    if (!token) {
      const url = new URL(`/login`, request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // This is a simplified middleware that just checks for the presence of a token
    // In a real app, we would verify the token and check roles
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
  ],
};
