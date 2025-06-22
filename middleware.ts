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
  const { pathname, hostname } = request.nextUrl;
  
  // Handle vendor subdomain routing
  if (hostname.includes('.blindscommerce.com') && !hostname.startsWith('www.') && !hostname.startsWith('admin.')) {
    const subdomain = hostname.split('.')[0];
    
    // Skip API and static routes
    if (!pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon')) {
      // Rewrite to vendor storefront
      const url = request.nextUrl.clone();
      url.pathname = `/storefront/${subdomain}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  
  // Check for maintenance mode (skip for admin routes and API)
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    try {
      // Simple check using environment variable for maintenance mode
      // This could be enhanced to check database settings
      if (process.env.MAINTENANCE_MODE === 'true') {
        // Only allow admin users during maintenance
        const token = request.cookies.get('auth_token')?.value;
        let isAdmin = false;
        
        if (token) {
          try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
            const { payload } = await jwtVerify(token, secret);
            isAdmin = (payload as any)?.role === 'admin';
          } catch (error) {
            // Token invalid, user is not admin
          }
        }
        
        if (!isAdmin) {
          // Return maintenance page for non-admin users
          return new NextResponse(
            `<!DOCTYPE html>
            <html>
            <head>
              <title>Maintenance Mode - Smart Blinds Hub</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #CC2229; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; margin-bottom: 20px; }
                .logo { font-size: 24px; font-weight: bold; color: #CC2229; margin-bottom: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">Smart Blinds Hub</div>
                <h1>🔧 Maintenance Mode</h1>
                <p>We're currently performing scheduled maintenance to improve your experience.</p>
                <p>We'll be back online shortly. Thank you for your patience!</p>
                <p>If you need immediate assistance, please contact us at support@smartblindshub.com</p>
              </div>
            </body>
            </html>`,
            {
              status: 503,
              headers: {
                'Content-Type': 'text/html',
                'Retry-After': '3600', // Suggest retry after 1 hour
              },
            }
          );
        }
      }
    } catch (error) {
      // If maintenance check fails, continue normally
      console.error('Maintenance mode check failed:', error);
    }
  }
  
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
      }
      response = NextResponse.redirect(new URL('/login', request.url));
    } else {
      // Verify the token
      const isValid = await verifyToken(token);
      if (!isValid) {
        if (process.env.NODE_ENV !== 'production') {
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
