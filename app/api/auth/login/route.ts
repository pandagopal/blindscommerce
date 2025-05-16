import { NextRequest, NextResponse } from 'next/server';
import { getPool, comparePassword } from '@/lib/db';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    const result = await pool.query(
      'SELECT user_id, email, password_hash, first_name, last_name, is_admin, is_active FROM blinds.users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user role
    let role = 'customer';
    if (user.is_admin) {
      role = 'admin';
    } else {
      const vendorResult = await pool.query(
        'SELECT vendor_info_id FROM blinds.vendor_info WHERE user_id = $1',
        [user.user_id]
      );
      if (vendorResult.rows.length > 0) {
        role = 'vendor';
      }
    }

    // Create JWT token
    const token = sign(
      {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Create the response with redirect URL
    const response = NextResponse.json({
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: role
      },
      redirectUrl: role === 'admin' ? '/admin' : '/account'
    });

    // Set cookie in the response
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
