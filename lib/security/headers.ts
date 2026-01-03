import { NextResponse } from 'next/server';

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data: blob:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com wss: ws:",
    "frame-src https://checkout.stripe.com https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '));
  
  // Remove server information
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  return response;
}

// CORS configuration for API routes
export function setCORSHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}