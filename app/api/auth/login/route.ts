import { NextRequest, NextResponse } from 'next/server';
import { loginUser, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Attempt to login user
    const user = await loginUser(email, password);
    console.log('Login result:', user ? 'Success' : 'Failed');

    if (!user) {
      console.log('Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken(user);
    console.log('Token generated, length:', token.length);

    // Set cookie
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    console.log('Cookie set');

    // Determine redirect URL based on role
    let redirectUrl = '/account';
    if (user.role === 'admin') redirectUrl = '/admin';
    else if (user.role === 'vendor') redirectUrl = '/vendor';
    else if (user.role === 'sales') redirectUrl = '/sales';
    else if (user.role === 'installer') redirectUrl = '/installer';

    console.log('Redirecting to:', redirectUrl);

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
