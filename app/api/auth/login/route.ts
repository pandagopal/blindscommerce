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

    // Attempt to login user
    const user = await loginUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Reset rate limit on successful login
    loginRateLimiter.reset(clientIP);

    // Generate JWT token
    const token = await generateToken(user);

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: true, // Always use secure cookies
      sameSite: 'strict', // Prevent CSRF attacks
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Determine redirect URL based on role
    let redirectUrl = '/'; // Default to homepage for customers
    if (user.role === 'admin') redirectUrl = '/admin';
    else if (user.role === 'vendor') redirectUrl = '/vendor';
    else if (user.role === 'sales') redirectUrl = '/sales';
    else if (user.role === 'installer') redirectUrl = '/installer';
    else if (user.role === 'customer') redirectUrl = '/?login=success';

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
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}