/**
 * Base Handler for V2 API
 * Provides common functionality for all v2 service handlers
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

// User roles
export const UserRoles = {
  SUPER_ADMIN: 100,
  ADMIN: 90,
  VENDOR: 70,
  INSTALLER: 60,
  SALES_REPRESENTATIVE: 50,
  TRADE_PROFESSIONAL: 40,
  CUSTOMER: 10,
  GUEST: 0,
} as const;

export type UserRole = keyof typeof UserRoles;

// Error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base handler class
export abstract class BaseHandler {
  /**
   * Get request body as JSON
   */
  protected async getBody<T = any>(req: NextRequest): Promise<T> {
    try {
      return await req.json();
    } catch (error) {
      throw new ApiError('Invalid request body', 400, 'INVALID_BODY');
    }
  }

  /**
   * Get and validate request body with Zod schema
   */
  protected async getValidatedBody<T>(
    req: NextRequest,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const body = await this.getBody(req);
    
    try {
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(
          `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          400,
          'VALIDATION_ERROR'
        );
      }
      throw error;
    }
  }

  /**
   * Get search params from request
   */
  protected getSearchParams(req: NextRequest): URLSearchParams {
    return new URL(req.url).searchParams;
  }

  /**
   * Get pagination parameters
   */
  protected getPagination(searchParams: URLSearchParams): {
    page: number;
    limit: number;
    offset: number;
  } {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Check if user has required role
   */
  protected checkRole(user: any, requiredRole: UserRole): boolean {
    if (!user) return false;
    
    // Convert role to uppercase to match UserRoles keys
    const userRoleKey = user.role?.toUpperCase() as UserRole;
    const userLevel = UserRoles[userRoleKey] || 0;
    const requiredLevel = UserRoles[requiredRole];
    
    return userLevel >= requiredLevel;
  }

  /**
   * Require authentication
   */
  protected requireAuth(user: any): void {
    if (!user) {
      throw new ApiError('Authentication required', 401, 'AUTH_REQUIRED');
    }
  }

  /**
   * Require specific role
   */
  protected requireRole(user: any, role: UserRole): void {
    this.requireAuth(user);
    
    if (!this.checkRole(user, role)) {
      throw new ApiError(
        `Access denied. Required role: ${role}`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }
  }

  /**
   * Parse action path into components
   */
  protected parseAction(action: string[]): {
    resource?: string;
    id?: string;
    subResource?: string;
    subId?: string;
    operation?: string;
  } {
    const [resource, id, subResource, subId, ...rest] = action;
    
    return {
      resource,
      id: id && !isNaN(Number(id)) ? id : undefined,
      subResource: id && isNaN(Number(id)) ? id : subResource,
      subId: subId && !isNaN(Number(subId)) ? subId : undefined,
      operation: rest.join('/') || undefined,
    };
  }

  /**
   * Build response with pagination
   */
  protected buildPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Validate required parameters
   */
  protected validateRequired(
    params: Record<string, any>,
    required: string[]
  ): void {
    const missing = required.filter(param => !params[param]);
    
    if (missing.length > 0) {
      throw new ApiError(
        `Missing required parameters: ${missing.join(', ')}`,
        400,
        'MISSING_PARAMS'
      );
    }
  }

  /**
   * Sanitize string input
   */
  protected sanitizeString(value: string | null, maxLength: number = 255): string | null {
    if (!value) return null;
    return value.trim().substring(0, maxLength);
  }

  /**
   * Sanitize number input
   */
  protected sanitizeNumber(
    value: string | null,
    min?: number,
    max?: number
  ): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    
    return num;
  }

  /**
   * Handle method routing based on action
   */
  protected async routeAction(
    action: string[],
    routes: Record<string, Function>,
    ...args: any[]
  ): Promise<any> {
    const actionPath = action.join('/');
    
    // Try exact match first
    if (routes[actionPath]) {
      return routes[actionPath].call(this, ...args);
    }

    // Try pattern matching
    for (const [pattern, handler] of Object.entries(routes)) {
      if (this.matchPattern(actionPath, pattern)) {
        return handler.call(this, ...args);
      }
    }

    throw new ApiError(
      `Unknown action: ${actionPath}`,
      404,
      'UNKNOWN_ACTION'
    );
  }

  /**
   * Match action path against pattern
   */
  private matchPattern(path: string, pattern: string): boolean {
    // Simple pattern matching (can be enhanced)
    const pathParts = path.split('/');
    const patternParts = pattern.split('/');
    
    if (pathParts.length !== patternParts.length) {
      return false;
    }
    
    for (let i = 0; i < pathParts.length; i++) {
      if (patternParts[i] === ':id' || patternParts[i] === '*') {
        continue;
      }
      
      if (pathParts[i] !== patternParts[i]) {
        return false;
      }
    }
    
    return true;
  }
}