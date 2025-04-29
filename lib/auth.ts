import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
// Fix TypeScript error by adding a declaration for jsonwebtoken
// @ts-ignore - Add this to bypass the TypeScript error for jsonwebtoken
import jwt from 'jsonwebtoken';
import { getPool, hashPassword } from './db';

// Types for user data
export interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  role?: string;
}

// // Mock user for development (when no database connection)
// const MOCK_USER: User = {
//   userId: 1,
//   email: 'admin@example.com',
//   firstName: 'Admin',
//   lastName: 'User',
//   isAdmin: true,
//   role: 'admin'
// };

// Helper to generate JWT token
export function generateToken(user: User): string {
  const payload = {
    userId: user.userId,
    email: user.email,
    isAdmin: user.isAdmin
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'smartblindshub_secret',
    { expiresIn: '3h' }
  );

  return token;
}

// Helper to verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'smartblindshub_secret');
  } catch (error) {
    return null;
  }
}

// Set auth token in cookies
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 1 day
  });
}

// Clear auth token from cookies
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  });
}

// Get current user from auth token
export async function getCurrentUser(): Promise<User | null> {
   try {
    // Get token from cookies - fix the cookies().get issue
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Get user from database
    const query = `
      SELECT
        user_id as "userId",
        email,
        first_name as "firstName",
        last_name as "lastName",
        is_admin as "isAdmin"
      FROM
        blinds.users
      WHERE
        user_id = $1 AND is_active = TRUE
    `;

    const pool = await getPool();
    const result = await pool.query(query, [decoded.userId]);
    const user = result.rows[0];

    if (!user) {
      return null;
    }

    // Get user role
    const roleQuery = `
      SELECT
        CASE WHEN is_admin THEN 'admin'
        WHEN EXISTS (
          SELECT 1 FROM vendor_info
          WHERE user_id = $1 AND is_active = TRUE
        ) THEN 'vendor'
        ELSE 'customer'
        END as role
      FROM
        blinds.users
      WHERE
        user_id = $1
    `;

    const roleResult = await pool.query(roleQuery, [user.userId]);
    if (roleResult.rows.length > 0) {
      user.role = roleResult.rows[0].role;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if a route requires authentication
export function requireAuth(req: NextRequest): boolean {
  // List of authenticated routes
  const authRoutes = [
    '/account',
    '/api/account',
    '/checkout',
    '/vendor',
    '/admin'
  ];

  // Check if the current path starts with any of the auth routes
  return authRoutes.some(route => req.nextUrl.pathname.startsWith(route));
}

// Check if request is from an authenticated user
export function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return false;
  }

  const decoded = verifyToken(token);
  return !!decoded;
}

// Add a hasRole helper function to check if a user has a specific role
export function hasRole(user: User | null, requiredRole: string | string[]): boolean {
  if (!user) return false;

  // Admin has access to everything
  if (user.isAdmin) return true;

  // Handle string array of roles (any of these roles is acceptable)
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role || '');
  }

  // Check if user has the specific role
  return user.role === requiredRole;
}

// Check if request is from an admin user
export function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return false;
  }

  const decoded = verifyToken(token);
  return decoded?.isAdmin === true;
}

// Add a logoutUser function to handle user logout
export async function logoutUser(): Promise<boolean> {
  // In development, just return success
  if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
    return true;
  }

  try {
    // In a real app, we might invalidate the token in a database or
    // add it to a blacklist, but for our purposes just returning success is enough
    return true;
  } catch (error) {
    console.error('Error logging out user:', error);
    return false;
  }
}

// Login user with email and password
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    // Get user by email
    const query = `
      SELECT
        user_id as "userId",
        email,
        password_hash as "passwordHash",
        first_name as "firstName",
        last_name as "lastName",
        is_admin as "isAdmin"
      FROM
        blinds.users
      WHERE
        email = $1 AND is_active = TRUE
    `;

    const pool = await getPool();
    const result = await pool.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      return null;
    }

    // Verify password (in a real app, we would use bcrypt.compare)
    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== user.passwordHash) {
      return null;
    }

    // Get user role
    const roleQuery = `
      SELECT
        CASE WHEN is_admin THEN 'admin'
        WHEN EXISTS (
          SELECT 1 FROM vendor_info
          WHERE user_id = $1 AND is_active = TRUE
        ) THEN 'vendor'
        ELSE 'customer'
        END as role
      FROM
        blinds.users
      WHERE
        user_id = $1
    `;

    const roleResult = await pool.query(roleQuery, [user.userId]);
    if (roleResult.rows.length > 0) {
      user.role = roleResult.rows[0].role;
    }

    // Remove password hash from user object
    delete user.passwordHash;

    // Update last login date
    const updateQuery = `
      UPDATE blinds.users
      SET last_login = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    await pool.query(updateQuery, [user.userId]);

    return user;
  } catch (error) {
    console.error('Error logging in user:', error);
    return null;
  }
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
  role?: string
): Promise<User | null> {
  // Use mock data in development
  if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
    return Promise.resolve({
      userId: 0,
      email,
      firstName,
      lastName,
      isAdmin: false,
      role: role || 'customer'
    });
  }

  try {
    // Hash password
    const hashedPassword = await hashPassword(password);

    // Start a transaction
    const pool = await getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert new user
      const query = `
        INSERT INTO blinds.users (
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          is_admin,
          is_active,
          is_verified
        )
        VALUES ($1, $2, $3, $4, $5, FALSE, TRUE, FALSE)
        RETURNING
          user_id as "userId",
          email,
          first_name as "firstName",
          last_name as "lastName",
          is_admin as "isAdmin"
      `;

      const result = await client.query(query, [
        email,
        hashedPassword,
        firstName,
        lastName,
        phone || null
      ]);
      const user = result.rows[0];

      // Create empty wishlist for user
      const wishlistQuery = `
        INSERT INTO blinds.wishlist (user_id) VALUES ($1)
      `;
      await client.query(wishlistQuery, [user.userId]);

      await client.query('COMMIT');

      // Add role property
      user.role = role || 'customer';

      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return null;
  }
}
