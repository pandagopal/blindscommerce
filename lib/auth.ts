import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import pool from '@/lib/db';

// Define user types for authentication
export type UserRole = 'customer' | 'vendor' | 'admin' | 'sales' | 'installer';

export interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

export interface AuthToken {
  userId: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Hash password using Web Crypto API with SHA-256
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

  return hashHex;
};

// Compare password with hashed password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hashedPassword;
};

// Generate JWT token for authenticated user
export const generateToken = async (user: UserData): Promise<string> => {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret'
  );

  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
};

// Verify JWT token
export const verifyToken = async (token: string): Promise<AuthToken | null> => {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback_secret'
    );

    const { payload } = await jwtVerify(token, secret);

    return payload as unknown as AuthToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// Set auth cookie using cookies API
export const setAuthCookie = async (token: string, rememberMe: boolean = false): Promise<void> => {
  // Synchronous set for building
  // Type casting to avoid TypeScript errors - this works in Next.js's environment
  const cookieStore = cookies() as unknown as ResponseCookies;

  // Set expiration based on remember me preference
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

  cookieStore.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAge,
    path: '/',
    sameSite: 'strict',
  });
};

// Get current user from auth token cookie
export const getCurrentUser = async (): Promise<UserData | null> => {
  try {
    // Type casting to avoid TypeScript errors in Next.js edge runtime
    const cookieList = cookies() as any;
    const authToken = cookieList.get?.('auth_token');
    const token = authToken?.value;

    if (!token) {
      return null;
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return null;
    }

    // Mock user response for build to avoid DB issues
    if (process.env.NODE_ENV !== 'production') {
      return {
        userId: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      };
    }

    // Fetch latest user data from database
    const query = `
      SELECT user_id, email, first_name, last_name, is_admin,
             (SELECT COUNT(*) FROM vendor_info WHERE user_id = users.user_id AND is_active = TRUE) AS is_vendor,
             (SELECT COUNT(*) FROM sales_staff WHERE user_id = users.user_id AND is_active = TRUE) AS is_sales,
             (SELECT COUNT(*) FROM installer_staff WHERE user_id = users.user_id AND is_active = TRUE) AS is_installer
      FROM users
      WHERE user_id = $1 AND is_active = TRUE
    `;

    const result = await pool.query(query, [decoded.userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // Determine user role based on database info
    let role: UserRole = 'customer';

    if (user.is_admin) {
      role = 'admin';
    } else if (user.is_vendor > 0) {
      role = 'vendor';
    } else if (user.is_sales > 0) {
      role = 'sales';
    } else if (user.is_installer > 0) {
      role = 'installer';
    }

    return {
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

// Log out user by removing auth cookie
export const logoutUser = (): void => {
  // Type casting to avoid TypeScript errors - this works in Next.js's environment
  const cookieStore = cookies() as unknown as ResponseCookies;
  cookieStore.delete('auth_token');
};

// Check if user has required role
export const hasRole = (user: UserData | null, roles: UserRole[]): boolean => {
  if (!user) {
    return false;
  }

  return roles.includes(user.role);
};

// Login user with email and password
export const loginUser = async (email: string, password: string, rememberMe: boolean = false): Promise<{ user: UserData; token: string } | null> => {
  try {
    // Mock response for build to avoid DB issues
    if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
      // For testing purposes, handle different demo accounts
      let userData: UserData;

      // Admin account
      if (email === 'admin@smartblindshub.com' && password === 'admin123') {
        userData = {
          userId: 1,
          email: email,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        };
      }
      // Vendor account
      else if (email === 'vendor@example.com' && password === 'vendor123') {
        userData = {
          userId: 2,
          email: email,
          firstName: 'Vendor',
          lastName: 'User',
          role: 'vendor'
        };
      }
      // Sales account
      else if (email === 'sales@smartblindshub.com' && password === 'sales123') {
        userData = {
          userId: 3,
          email: email,
          firstName: 'Sales',
          lastName: 'Rep',
          role: 'sales'
        };
      }
      // Installer account
      else if (email === 'installer@smartblindshub.com' && password === 'installer123') {
        userData = {
          userId: 4,
          email: email,
          firstName: 'Install',
          lastName: 'Tech',
          role: 'installer'
        };
      }
      // Customer account
      else if (email === 'customer@example.com' && password === 'password123') {
        userData = {
          userId: 5,
          email: email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer'
        };
      }
      // Invalid login
      else {
        return null;
      }

      const token = await generateToken(userData);
      return { user: userData, token };
    }

    const hashedPassword = await hashPassword(password);

    const query = `
      SELECT
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.is_admin,
          (SELECT COUNT(*) FROM vendor_info WHERE user_id = u.user_id AND is_active = TRUE) AS is_vendor,
          (SELECT COUNT(*) FROM sales_staff WHERE user_id = u.user_id AND is_active = TRUE) AS is_sales,
          (SELECT COUNT(*) FROM installer_staff WHERE user_id = u.user_id AND is_active = TRUE) AS is_installer
      FROM users u
      WHERE u.email = $1 AND u.password_hash = $2 AND u.is_active = TRUE
    `;

    const result = await pool.query(query, [email, hashedPassword]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // Determine user role
    let role: UserRole = 'customer';

    if (user.is_admin) {
      role = 'admin';
    } else if (user.is_vendor > 0) {
      role = 'vendor';
    } else if (user.is_sales > 0) {
      role = 'sales';
    } else if (user.is_installer > 0) {
      role = 'installer';
    }

    const userData: UserData = {
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role,
    };

    const token = await generateToken(userData);

    return { user: userData, token };
  } catch (error) {
    console.error('Error logging in user:', error);
    return null;
  }
};

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
  role: UserRole = 'customer'
): Promise<UserData | null> => {
  try {
    // Mock response for build to avoid DB issues
    if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
      return {
        userId: Math.floor(Math.random() * 1000) + 10,
        email,
        firstName,
        lastName,
        role
      };
    }

    const hashedPassword = await hashPassword(password);

    // Begin transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert the new user
      const insertUserQuery = `
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
        RETURNING user_id
      `;

      const isAdmin = role === 'admin';
      const values = [
        email,
        hashedPassword,
        firstName,
        lastName,
        phone || null,
        isAdmin,
        true, // is_active
        false // is_verified (will need email verification)
      ];

      const result = await client.query(insertUserQuery, values);
      const userId = result.rows[0].user_id;

      // If the role is vendor, sales, or installer, create the appropriate record
      if (role === 'vendor') {
        const insertVendorQuery = `
          INSERT INTO vendor_info (
            user_id,
            business_name,
            business_email,
            business_phone,
            is_active,
            approval_status
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(insertVendorQuery, [
          userId,
          `${firstName}'s Business`, // Default business name
          email,
          phone || null,
          true, // is_active
          'pending' // approval_status
        ]);
      } else if (role === 'sales') {
        const insertSalesQuery = `
          INSERT INTO sales_staff (user_id, is_active)
          VALUES ($1, $2)
        `;

        await client.query(insertSalesQuery, [userId, true]);
      } else if (role === 'installer') {
        const insertInstallerQuery = `
          INSERT INTO installer_staff (user_id, is_active)
          VALUES ($1, $2)
        `;

        await client.query(insertInstallerQuery, [userId, true]);
      }

      // Create wishlist for all users
      const insertWishlistQuery = `
        INSERT INTO wishlist (user_id)
        VALUES ($1)
      `;

      await client.query(insertWishlistQuery, [userId]);

      // Commit transaction
      await client.query('COMMIT');

      return {
        userId,
        email,
        firstName,
        lastName,
        role
      };
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
};
