import { NextRequest, NextResponse } from 'next/server';
import { loginUser, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Attempt login
    const user = await loginUser(email, password);

    // Check if login was successful
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken(user);

    // Create response with redirect URL
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        role: user.role || 'customer',
        isAdmin: user.isAdmin
      },
      redirectUrl: user.role === 'admin' ? '/admin' : 
                  user.role === 'vendor' ? '/vendor' :
                  user.role === 'sales' ? '/sales' :
                  user.role === 'installer' ? '/installer' :
                  '/account'
    });

    // Set the auth cookie with proper options
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    console.log('Login successful:', {
      tokenPreview: typeof token === 'string' ? token.substring(0, 20) + '...' : 'Invalid token',
      role: user.role,
      redirectUrl: response.headers.get('location')
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
