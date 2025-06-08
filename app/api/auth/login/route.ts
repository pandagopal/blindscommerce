import { NextRequest, NextResponse } from 'next/server';
import { loginUser, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { loginSchema, loginRateLimiter } from '@/lib/security/validation';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limiting
    if (loginRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate and sanitize input
    let validatedData;
    try {
      validatedData = loginSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input data', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
    }
    
    const { email, password } = validatedData;

    // Remove sensitive email logging in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Login attempt for:', email?.substring(0, 3) + '***');
    }

    // Attempt to login user
    const user = await loginUser(email, password);
    // Safe logging without exposing user data
    if (process.env.NODE_ENV !== 'production') {
      console.log('Login result:', user ? 'Success' : 'Failed');
    }

    if (!user) {
      // Remove debug logging that could aid brute force attacks
      if (process.env.NODE_ENV !== 'production') {
        console.log('Authentication failed');
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Reset rate limit on successful login
    loginRateLimiter.reset(clientIP);

    // Generate JWT token
    const token = await generateToken(user);
    // Remove token information logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Token generated successfully');
    }

    // Set secure cookie
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: true, // Always use secure cookies
      sameSite: 'strict', // Prevent CSRF attacks
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    // Safe logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Authentication cookie set');
    }

    // Determine redirect URL based on role
    let redirectUrl = '/account';
    if (user.role === 'admin') redirectUrl = '/admin';
    else if (user.role === 'vendor') redirectUrl = '/vendor';
    else if (user.role === 'sales') redirectUrl = '/sales';
    else if (user.role === 'installer') redirectUrl = '/installer';

    // Safe logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Redirecting to:', redirectUrl);
    }

    return NextResponse.json({
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      redirectUrl
    });
  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Login error:', error);
    } else {
      console.error('Authentication error occurred');
    }
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}