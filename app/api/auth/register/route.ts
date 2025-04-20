import { NextRequest, NextResponse } from 'next/server';
import { registerUser, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, role } = body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Register the user
    const newUser = await registerUser(
      email,
      password,
      firstName,
      lastName,
      phone,
      role || 'customer' // Default to customer role if not specified
    );

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to register user. Email may already be in use.' },
        { status: 400 }
      );
    }

    // Generate token for the new user if auto-login is desired
    // For this implementation, we'll just return success without auto-login
    // to redirect to the login page
    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Check for duplicate key violation (email already exists)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
