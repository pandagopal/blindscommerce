/**
 * API Consolidation Infrastructure for BlindsCommerce
 * Base utilities for creating consolidated, efficient API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { logError } from '@/lib/errorHandling';

// Standard response format for all consolidated APIs
interface ConsolidatedResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
  metadata?: ResponseMetadata;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface ResponseMetadata {
  timestamp: string;
  version: string;
  endpoint: string;
  executionTime: number;
  dataSource: 'cache' | 'database';
}


// Role-based access control for consolidated APIs
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: 100,
  ADMIN: 90,
  VENDOR: 70,
  INSTALLER: 60,
  SALES_REPRESENTATIVE: 50,
  TRADE_PROFESSIONAL: 40,
  CUSTOMER: 10,
  GUEST: 0
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;

// Base API handler class for consolidated endpoints
export abstract class ConsolidatedAPIHandler {
  protected startTime: number;
  protected endpoint: string;
  protected version: string = '1.0';

  constructor(endpoint: string) {
    this.startTime = Date.now();
    this.endpoint = endpoint;
  }

  // Abstract methods to be implemented by specific handlers
  abstract handleGET(req: NextRequest, user: any | null): Promise<ConsolidatedResponse>;
  abstract handlePOST?(req: NextRequest, user: any): Promise<ConsolidatedResponse>;
  abstract handlePUT?(req: NextRequest, user: any): Promise<ConsolidatedResponse>;
  abstract handleDELETE?(req: NextRequest, user: any): Promise<ConsolidatedResponse>;

  // Main router method
  async handle(req: NextRequest): Promise<NextResponse> {
    try {
      const method = req.method;
      const user = await this.getUser(req);

      let response: ConsolidatedResponse;

      switch (method) {
        case 'GET':
          response = await this.handleGET(req, user);
          break;
        case 'POST':
          if (!this.handlePOST) {
            return this.errorResponse('Method not allowed', 405);
          }
          if (!user) {
            return this.errorResponse('Authentication required', 401);
          }
          response = await this.handlePOST(req, user);
          break;
        case 'PUT':
          if (!this.handlePUT) {
            return this.errorResponse('Method not allowed', 405);
          }
          if (!user) {
            return this.errorResponse('Authentication required', 401);
          }
          response = await this.handlePUT(req, user);
          break;
        case 'DELETE':
          if (!this.handleDELETE) {
            return this.errorResponse('Method not allowed', 405);
          }
          if (!user) {
            return this.errorResponse('Authentication required', 401);
          }
          response = await this.handleDELETE(req, user);
          break;
        default:
          return this.errorResponse('Method not allowed', 405);
      }

      // Add standard metadata
      response.metadata = {
        timestamp: new Date().toISOString(),
        version: this.version,
        endpoint: this.endpoint,
        executionTime: Date.now() - this.startTime,
        dataSource: 'database'
      };

      return NextResponse.json(response);

    } catch (error) {
      logError(error as Error, { endpoint: this.endpoint, method: req.method });
      return this.errorResponse(
        process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : 'Internal server error',
        500
      );
    }
  }

  // Helper methods
  protected async getUser(req: NextRequest): Promise<any | null> {
    try {
      return await getCurrentUser();
    } catch (error) {
      return null;
    }
  }

  protected checkRole(user: any, requiredRole: UserRole): boolean {
    if (!user) return false;
    const userLevel = ROLE_PERMISSIONS[user.role as UserRole] || 0;
    const requiredLevel = ROLE_PERMISSIONS[requiredRole];
    return userLevel >= requiredLevel;
  }

  protected getSearchParams(req: NextRequest) {
    return new URL(req.url).searchParams;
  }

  protected async getRequestBody(req: NextRequest): Promise<any> {
    try {
      return await req.json();
    } catch (error) {
      return null;
    }
  }

  protected getPaginationParams(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  protected buildPaginationInfo(page: number, limit: number, total: number): PaginationInfo {
    return {
      page,
      limit,
      total,
      hasMore: (page * limit) < total
    };
  }

  protected errorResponse(message: string, status: number = 400): NextResponse {
    const response: ConsolidatedResponse = {
      success: false,
      error: message,
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.version,
        endpoint: this.endpoint,
        executionTime: Date.now() - this.startTime,
        dataSource: 'database'
      }
    };

    return NextResponse.json(response, { status });
  }

  protected successResponse<T>(data: T, pagination?: PaginationInfo): ConsolidatedResponse<T> {
    return {
      success: true,
      data,
      pagination,
    };
  }


  // Database utilities
  protected async executeParallelQueries<T extends Record<string, any>>(
    queries: Record<keyof T, () => Promise<any>>
  ): Promise<T> {
    const pool = await getPool();
    
    const promises = Object.entries(queries).map(async ([key, queryFn]) => {
      try {
        const result = await queryFn();
        return [key, result];
      } catch (error) {
        logError(error as Error, { query: key, endpoint: this.endpoint });
        return [key, null];
      }
    });

    const results = await Promise.all(promises);
    
    return Object.fromEntries(results) as T;
  }

  // Query parameter validation
  protected validateRequiredParams(searchParams: URLSearchParams, required: string[]): { valid: boolean; missing: string[] } {
    const missing = required.filter(param => !searchParams.has(param));
    return {
      valid: missing.length === 0,
      missing
    };
  }

  protected sanitizeStringParam(value: string | null, maxLength: number = 255): string | null {
    if (!value) return null;
    return value.trim().substring(0, maxLength);
  }

  protected sanitizeNumberParam(value: string | null, min?: number, max?: number): number | null {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    return num;
  }

  protected sanitizeBooleanParam(value: string | null): boolean | null {
    if (!value) return null;
    return value.toLowerCase() === 'true';
  }
}

// Utility functions for query building
export const QueryBuilder = {
  // Safe SQL generation with parameter binding
  buildWhereClause(conditions: Array<{ field: string; operator: string; value: any; parameterized?: boolean }>): {
    clause: string;
    params: any[];
  } {
    if (conditions.length === 0) {
      return { clause: '', params: [] };
    }

    const clauses: string[] = [];
    const params: any[] = [];

    conditions.forEach(({ field, operator, value, parameterized = true }) => {
      if (parameterized) {
        clauses.push(`${field} ${operator} ?`);
        params.push(value);
      } else {
        // For safe interpolation (validated integers, predefined values)
        clauses.push(`${field} ${operator} ${value}`);
      }
    });

    return {
      clause: `WHERE ${clauses.join(' AND ')}`,
      params
    };
  },

  // Safe LIMIT/OFFSET generation (using validated integers)
  buildLimitClause(limit: number, offset: number): string {
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
    const safeOffset = Math.max(0, Math.floor(offset));
    return `LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  },

  // Safe ORDER BY generation (predefined columns only)
  buildOrderClause(sortBy?: string, sortOrder?: string, allowedColumns: string[] = []): string {
    if (!sortBy || !allowedColumns.includes(sortBy)) {
      return '';
    }
    
    const direction = sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    return `ORDER BY ${sortBy} ${direction}`;
  }
};

// Migration tracking for API consolidation
interface MigrationStatus {
  endpoint: string;
  oldEndpoints: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'deprecated';
  migrationDate?: string;
  performanceImprovement?: {
    dbConnections: number;
    responseTime: number;
    cacheHitRate: number;
  };
}

export const MigrationTracker = {
  migrations: new Map<string, MigrationStatus>(),

  track(endpoint: string, oldEndpoints: string[], status: MigrationStatus['status'] = 'pending') {
    this.migrations.set(endpoint, {
      endpoint,
      oldEndpoints,
      status,
      migrationDate: status === 'completed' ? new Date().toISOString() : undefined
    });
  },

  updateStatus(endpoint: string, status: MigrationStatus['status'], performance?: MigrationStatus['performanceImprovement']) {
    const existing = this.migrations.get(endpoint);
    if (existing) {
      existing.status = status;
      existing.migrationDate = status === 'completed' ? new Date().toISOString() : existing.migrationDate;
      if (performance) {
        existing.performanceImprovement = performance;
      }
    }
  },

  getStatus(): MigrationStatus[] {
    return Array.from(this.migrations.values());
  },

  getCompletionRate(): number {
    const total = this.migrations.size;
    if (total === 0) return 0;
    
    const completed = Array.from(this.migrations.values())
      .filter(m => m.status === 'completed').length;
    
    return Math.round((completed / total) * 100);
  }
};