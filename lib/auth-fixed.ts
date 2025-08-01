/**
 * Fixed Authentication Library
 * Resolves circular dependency by using direct database queries for auth
 */

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp?: number;
}

interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isAdmin: boolean;
  role: string;
  vendorId?: number;
}

interface UserRow extends RowDataPacket {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  vendor_id?: number;
  is_active: boolean;
}

// Generate JWT token
export async function generateToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  return jwt.sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    JWT_SECRET
  );
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

// Clear auth cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}

// Get auth token from request
export function getTokenFromRequest(req: NextRequest): string | null {
  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieToken = req.cookies.get('auth_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Get current user - FIXED VERSION
 * Uses direct database query instead of V2 API to avoid circular dependency
 */
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

    // Direct database query to avoid circular dependency
    const pool = await getPool();
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT 
        user_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        vendor_id,
        is_active
      FROM users 
      WHERE user_id = ? AND is_active = 1`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return null;
    }

    const userData = rows[0];

    // Transform to expected format
    return {
      userId: userData.user_id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      phone: userData.phone,
      isAdmin: userData.role === 'admin' || userData.role === 'super_admin',
      role: userData.role,
      vendorId: userData.vendor_id
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if a route requires authentication
export function requireAuth(req: NextRequest): boolean {
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/',
    '/products',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/v2/content',
    '/api/v2/commerce/products',
    '/api/v2/commerce/categories'
  ];

  const pathname = req.nextUrl.pathname;

  // Check if path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return false;
  }

  // All other paths require authentication
  return true;
}

// Check if user has required role
export function hasRole(user: User | null, requiredRole: string): boolean {
  if (!user) return false;

  const roleHierarchy: Record<string, number> = {
    'super_admin': 100,
    'admin': 90,
    'vendor': 70,
    'installer': 60,
    'sales_representative': 50,
    'shipping_agent': 40,
    'customer': 10
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

// Authenticate user with email and password
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const bcrypt = await import('bcryptjs');
    const pool = await getPool();
    
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return null;
    }

    // Return user data
    return {
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isAdmin: user.role === 'admin' || user.role === 'super_admin',
      role: user.role,
      vendorId: user.vendor_id
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Helper to get user from token (for API routes)
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Direct database query
    const pool = await getPool();
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT 
        user_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        vendor_id,
        is_active
      FROM users 
      WHERE user_id = ? AND is_active = 1`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return null;
    }

    const userData = rows[0];

    return {
      userId: userData.user_id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      phone: userData.phone,
      isAdmin: userData.role === 'admin' || userData.role === 'super_admin',
      role: userData.role,
      vendorId: userData.vendor_id
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// Export all functions
export default {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getTokenFromRequest,
  getCurrentUser,
  requireAuth,
  hasRole,
  authenticateUser,
  getUserFromToken
};