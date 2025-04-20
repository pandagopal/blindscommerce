import { NextRequest, NextResponse } from 'next/server';
import { loginUser, generateToken, setAuthCookie } from '@/lib/auth';

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
    const token = generateToken(user);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        role: user.role || 'customer',
        isAdmin: user.isAdmin
      }
    });

    // Set auth cookie
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
