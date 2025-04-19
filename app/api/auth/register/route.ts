import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, UserData, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        is_admin,
        is_active,
        is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING user_id, email, first_name, last_name
    `;

    const values = [
      email,
      passwordHash,
      firstName || null,
      lastName || null,
      phone || null,
      false, // is_admin
      true,  // is_active
      false  // is_verified
    ];

    const result = await pool.query(insertQuery, values);
    const newUser = result.rows[0];

    // Create user data for token
    const userData: UserData = {
      userId: newUser.user_id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: 'customer' // Default role for new users
    };

    // Generate token
    const token = await generateToken(userData);

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          userId: userData.userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
