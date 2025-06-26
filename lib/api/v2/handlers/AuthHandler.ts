/**
 * Auth Handler for V2 API
 * Handles authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { BaseHandler, ApiError } from '../BaseHandler';
import { UserService } from '@/lib/services';
import { comparePassword, hashPassword } from '@/lib/db';
import { z } from 'zod';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export class AuthHandler extends BaseHandler {
  private userService = new UserService();

  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'me': () => this.getCurrentUser(user),
      'verify': () => this.verifyToken(req),
    };

    return this.routeAction(action, routes);
  }

  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'login': () => this.login(req),
      'register': () => this.register(req),
      'logout': () => this.logout(user),
      'forgot-password': () => this.forgotPassword(req),
      'reset-password': () => this.resetPassword(req),
      'refresh': () => this.refreshToken(req),
    };

    return this.routeAction(action, routes);
  }

  private async getCurrentUser(user: any) {
    if (!user) {
      throw new ApiError('Not authenticated', 401);
    }

    return {
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified,
      }
    };
  }

  private async login(req: NextRequest) {
    const data = await this.getValidatedBody(req, LoginSchema);

    // Find user
    const user = await this.userService.getUserByEmail(data.email);
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password_hash);
    if (!isValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Check if active
    if (!user.is_active) {
      throw new ApiError('Account is disabled', 403);
    }

    // Generate token
    const token = sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Update last login
    await this.userService.raw(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    // Set JWT cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Determine redirect URL based on role
    let redirectUrl = '/';
    switch (user.role) {
      case 'super_admin':
        redirectUrl = '/super-admin';
        break;
      case 'admin':
        redirectUrl = '/admin';
        break;
      case 'vendor':
        redirectUrl = '/vendor';
        break;
      case 'sales_representative':
        redirectUrl = '/sales';
        break;
      case 'installer':
        redirectUrl = '/installer';
        break;
      case 'customer':
        redirectUrl = '/account';
        break;
    }

    return {
      token,
      redirectUrl,
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified,
      },
    };
  }

  private async register(req: NextRequest) {
    const data = await this.getValidatedBody(req, RegisterSchema);

    // Check if email exists
    const exists = await this.userService.emailExists(data.email);
    if (exists) {
      throw new ApiError('Email already registered', 400);
    }

    // Create user
    const user = await this.userService.createUser({
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      role: 'customer', // Default role
    });

    if (!user) {
      throw new ApiError('Failed to create account', 500);
    }

    // Generate token
    const token = sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // TODO: Send verification email

    return {
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: false,
      },
    };
  }

  private async logout(user: any) {
    // Clear the auth cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');

    return { message: 'Logged out successfully' };
  }

  private async forgotPassword(req: NextRequest) {
    const data = await this.getValidatedBody(req, ForgotPasswordSchema);

    const user = await this.userService.getUserByEmail(data.email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Save token
    await this.userService.raw(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())
       ON DUPLICATE KEY UPDATE
         token = VALUES(token),
         expires_at = VALUES(expires_at),
         created_at = VALUES(created_at)`,
      [user.user_id, token]
    );

    // TODO: Send reset email

    return { message: 'If the email exists, a reset link has been sent' };
  }

  private async resetPassword(req: NextRequest) {
    const data = await this.getValidatedBody(req, ResetPasswordSchema);

    // Verify token
    const [tokenData] = await this.userService.raw(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = ? AND expires_at > NOW()`,
      [data.token]
    );

    if (!tokenData) {
      throw new ApiError('Invalid or expired reset token', 400);
    }

    // Update password
    const newHash = await hashPassword(data.password);
    await this.userService.update(tokenData.user_id, {
      password_hash: newHash,
      updated_at: new Date(),
    });

    // Delete token
    await this.userService.raw(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [tokenData.user_id]
    );

    return { message: 'Password reset successfully' };
  }

  private async verifyToken(req: NextRequest) {
    const searchParams = this.getSearchParams(req);
    const token = searchParams.get('token');

    if (!token) {
      throw new ApiError('Token required', 400);
    }

    // TODO: Verify JWT token

    return { valid: true };
  }

  private async refreshToken(req: NextRequest) {
    // TODO: Implement token refresh
    throw new ApiError('Not implemented', 501);
  }
}