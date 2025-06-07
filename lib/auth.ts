import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { getPool, hashPassword, comparePassword } from './db';
import { RowDataPacket } from 'mysql2';

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
export async function generateToken(user: User): Promise<string> {
  const payload = {
    userId: user.userId,
    email: user.email,
    isAdmin: user.isAdmin,
    role: user.role || 'customer'
  };

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'Blinds_secret');
  const alg = 'HS256';

  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return token;
}

// Helper to verify JWT token
export async function verifyToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'Blinds_secret');
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
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
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Get user from database with role
    const query = `
      SELECT
        u.user_id as userId,
        u.email,
        u.first_name as firstName,
        u.last_name as lastName,
        u.is_admin as isAdmin,
        u.role as role
      FROM
        users u
      WHERE
        u.user_id = ? AND u.is_active = TRUE
    `;

    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(query, [decoded.userId]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
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
  try {
    // Clear the auth cookie using the cookies API
    const cookieStore = cookies();
    cookieStore.delete('auth_token');
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
        u.user_id as userId,
        u.email,
        u.password_hash as passwordHash,
        u.first_name as firstName,
        u.last_name as lastName,
        u.is_admin as isAdmin,
        u.role as role
      FROM
        users u
      WHERE
        u.email = ? AND u.is_active = TRUE
    `;

    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(query, [email]);

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Remove passwordHash from user object
    delete user.passwordHash;

    return user;
  } catch (error) {
    console.error('Login error:', error);
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
  try {
    // Hash password
    const hashedPassword = await hashPassword(password);

    // Start a transaction
    const pool = await getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert new user
      const query = `
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
        VALUES (?, ?, ?, ?, ?, FALSE, TRUE, FALSE)
      `;

      const [result] = await connection.execute(query, [
        email,
        hashedPassword,
        firstName,
        lastName,
        phone || null
      ]);

      const userId = (result as any).insertId;

      // Get the inserted user
      const [userRows] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          user_id as userId,
          email,
          first_name as firstName,
          last_name as lastName,
          is_admin as isAdmin
        FROM users 
        WHERE user_id = ?`,
        [userId]
      );

      const user = userRows[0];

      // Create empty wishlist for user
      const wishlistQuery = `
        INSERT INTO wishlist (user_id) VALUES (?)
      `;
      await connection.execute(wishlistQuery, [userId]);

      await connection.commit();

      // Add role property
      user.role = role || 'customer';

      return user;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return null;
  }
}
