import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

// Types for user data
export interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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

// Helper to verify JWT token from string
export async function verifyToken(token: string): Promise<any>;
// Helper to verify JWT token from NextRequest
export async function verifyToken(request: NextRequest): Promise<any>;
// Implementation
export async function verifyToken(tokenOrRequest: string | NextRequest): Promise<any> {
  try {
    let token: string;
    
    if (typeof tokenOrRequest === 'string') {
      token = tokenOrRequest;
    } else {
      // Extract token from NextRequest cookies
      token = tokenOrRequest.cookies.get('auth_token')?.value || '';
      if (!token) {
        return null;
      }
    }
    
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

    // FIXED: Direct database query to avoid circular dependency with V2 API
    const { getPool } = await import('@/lib/db');
    const pool = await getPool();
    const [rows] = await pool.execute<any[]>(
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
      role: userData.role
    };
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
    // Use V2 API to login
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/v2/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const data = result.data || result;

    // Transform to expected format
    return {
      userId: data.user.userId || data.user.user_id,
      email: data.user.email,
      firstName: data.user.firstName || data.user.first_name,
      lastName: data.user.lastName || data.user.last_name,
      phone: data.user.phone,
      isAdmin: data.user.isAdmin || data.user.is_admin || data.user.role === 'admin',
      role: data.user.role
    };
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
    // Use V2 API to register
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/v2/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: role || 'customer'
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const data = result.data || result;

    // Transform to expected format
    return {
      userId: data.user.userId || data.user.user_id,
      email: data.user.email,
      firstName: data.user.firstName || data.user.first_name,
      lastName: data.user.lastName || data.user.last_name,
      phone: data.user.phone,
      isAdmin: data.user.isAdmin || data.user.is_admin || data.user.role === 'admin',
      role: data.user.role
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return null;
  }
}
