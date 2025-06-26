/**
 * Admin Users Consolidated Handler
 * Replaces multiple user management endpoints with comprehensive user operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs, ConsolidatedCacheKeys } from '@/lib/api/caching';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';
import { getPool, hashPassword } from '@/lib/db';

interface UserData {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  
  // Extended data for detailed views
  profile?: {
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    company?: string;
    avatar_url?: string;
  };
  
  // Activity and statistics
  stats?: {
    total_orders: number;
    total_spent: number;
    last_order_date?: string;
    account_status: string;
  };
  
  // Vendor-specific data
  vendor_info?: {
    vendor_info_id: number;
    business_name: string;
    commission_rate: number;
    is_approved: boolean;
    products_count: number;
  };
}

interface UsersListResponse {
  users: UserData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
  filters: {
    role?: string;
    status?: string;
    search?: string;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsers24h: number;
    usersByRole: Record<string, number>;
  };
}

export class AdminUsersHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/admin/users');
  }

  async handleGET(req: NextRequest, user: any | null) {
    // Check authentication and authorization
    if (!user) {
      throw APIErrorHandler.createAuthenticationError();
    }

    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPaginationParams(searchParams);
    
    // Extract query parameters
    const role = this.sanitizeStringParam(searchParams.get('role'));
    const status = this.sanitizeStringParam(searchParams.get('status'));
    const search = this.sanitizeStringParam(searchParams.get('search'));
    const include = searchParams.get('include')?.split(',') || [];
    const userId = this.sanitizeNumberParam(searchParams.get('userId'));

    // If requesting specific user
    if (userId) {
      return this.handleGetSingleUser(userId, include);
    }

    // Generate cache key for list
    const cacheKey = ConsolidatedCacheKeys.admin.users(page, limit, role);

    try {
      const result = await GlobalCaches.admin.getOrSet(
        cacheKey,
        () => this.fetchUsersList(page, limit, offset, { role, status, search }, include),
        CacheConfigs.standard // 15 minute TTL
      );

      MigrationTracker.recordEndpointUsage('/api/admin/users', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey,
        cacheAge: result.cacheAge
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        filters: { role, status, search }, 
        pagination: { page, limit } 
      });
    }
  }

  async handlePOST(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body) {
      throw APIErrorHandler.createError(APIErrorCode.INVALID_FORMAT, 'Request body required');
    }

    const action = body.action || 'create';

    switch (action) {
      case 'create':
        return this.handleCreateUser(body, user);
      case 'bulk_update':
        return this.handleBulkUpdate(body, user);
      case 'export':
        return this.handleExportUsers(body, user);
      case 'import':
        return this.handleImportUsers(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  async handlePUT(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body || !body.user_id) {
      throw APIErrorHandler.createValidationError('user_id', 'User ID required for updates');
    }

    return this.handleUpdateUser(body, user);
  }

  async handleDELETE(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const userId = this.sanitizeNumberParam(searchParams.get('user_id'));
    const action = searchParams.get('action') || 'deactivate';

    if (!userId) {
      throw APIErrorHandler.createValidationError('user_id', 'User ID required for deletion');
    }

    return this.handleDeleteUser(userId, action === 'hard_delete', user);
  }

  // Private implementation methods

  private async handleGetSingleUser(userId: number, include: string[]) {
    const cacheKey = `admin:user:${userId}:${include.join(',')}`;
    
    const result = await GlobalCaches.admin.getOrSet(
      cacheKey,
      () => this.fetchSingleUser(userId, include),
      CacheConfigs.fast // 5 minute TTL for single user
    );

    return this.successResponse(result.data, {
      cached: result.fromCache,
      cacheKey
    });
  }

  private async fetchUsersList(
    page: number, 
    limit: number, 
    offset: number,
    filters: { role?: string; status?: string; search?: string },
    include: string[]
  ): Promise<UsersListResponse> {
    
    const pool = await getPool();
    const { role, status, search } = filters;

    // Build WHERE conditions
    const conditions: any[] = [];
    const params: any[] = [];

    if (role && role !== 'all') {
      conditions.push({ field: 'u.role', operator: '=', value: role.toUpperCase() });
    }

    if (status) {
      if (status === 'active') {
        conditions.push({ field: 'u.is_active', operator: '=', value: 1 });
      } else if (status === 'inactive') {
        conditions.push({ field: 'u.is_active', operator: '=', value: 0 });
      } else if (status === 'verified') {
        conditions.push({ field: 'u.is_verified', operator: '=', value: 1 });
      } else if (status === 'unverified') {
        conditions.push({ field: 'u.is_verified', operator: '=', value: 0 });
      }
    }

    if (search) {
      conditions.push({ 
        field: '(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)', 
        operator: '', 
        value: [`%${search}%`, `%${search}%`, `%${search}%`], 
        parameterized: false 
      });
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = this.buildWhereClause(conditions);
    const allParams = [...whereClause.params, ...params];

    // Build SELECT with includes
    let selectFields = `
      u.user_id, u.email, u.first_name, u.last_name, u.phone, u.role,
      u.is_active, u.is_verified, u.created_at, u.updated_at, u.last_login
    `;

    let joinClause = '';
    
    if (include.includes('profile')) {
      selectFields += `, up.address, up.city, up.state, up.zip_code, up.company, up.avatar_url`;
      joinClause += ` LEFT JOIN user_profiles up ON u.user_id = up.user_id`;
    }

    if (include.includes('vendor_info')) {
      selectFields += `, vi.vendor_info_id, vi.business_name, vi.commission_rate, vi.is_approved`;
      joinClause += ` LEFT JOIN vendor_info vi ON u.user_id = vi.user_id`;
    }

    // Execute queries in parallel
    const results = await this.executeParallelQueries({
      users: async () => {
        const [rows] = await pool.execute(
          `SELECT ${selectFields}
           FROM users u
           ${joinClause}
           ${whereClause.clause}
           ORDER BY u.created_at DESC
           ${this.buildLimitClause(limit, offset)}`,
          allParams
        );
        return rows;
      },

      totalCount: async () => {
        const [rows] = await pool.execute(
          `SELECT COUNT(*) as total FROM users u ${whereClause.clause}`,
          whereClause.params
        );
        return (rows as any)[0].total;
      },

      summary: async () => {
        const [rows] = await pool.execute(`
          SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) as new_users_24h,
            SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin_count,
            SUM(CASE WHEN role = 'VENDOR' THEN 1 ELSE 0 END) as vendor_count,
            SUM(CASE WHEN role = 'CUSTOMER' THEN 1 ELSE 0 END) as customer_count,
            SUM(CASE WHEN role = 'INSTALLER' THEN 1 ELSE 0 END) as installer_count,
            SUM(CASE WHEN role = 'SALES_REPRESENTATIVE' THEN 1 ELSE 0 END) as sales_count
          FROM users
        `);
        return (rows as any)[0];
      }
    });

    // Add statistics if requested
    let usersWithStats: UserData[] = results.users || [];
    
    if (include.includes('stats')) {
      usersWithStats = await this.addUserStatistics(usersWithStats);
    }

    const total = results.totalCount || 0;
    const summary = results.summary || {};

    return {
      users: usersWithStats,
      pagination: this.buildPaginationInfo(page, limit, total),
      filters: { role, status, search },
      summary: {
        totalUsers: summary.total_users || 0,
        activeUsers: summary.active_users || 0,
        newUsers24h: summary.new_users_24h || 0,
        usersByRole: {
          admin: summary.admin_count || 0,
          vendor: summary.vendor_count || 0,
          customer: summary.customer_count || 0,
          installer: summary.installer_count || 0,
          sales_representative: summary.sales_count || 0
        }
      }
    };
  }

  private async fetchSingleUser(userId: number, include: string[]): Promise<UserData> {
    const pool = await getPool();
    
    // Get basic user data
    const [userRows] = await pool.execute(
      `SELECT u.*, up.address, up.city, up.state, up.zip_code, up.company, up.avatar_url
       FROM users u
       LEFT JOIN user_profiles up ON u.user_id = up.user_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (!userRows || (userRows as any).length === 0) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'User not found');
    }

    const userData = (userRows as any)[0];

    // Add optional data based on includes
    if (include.includes('vendor_info') && userData.role === 'VENDOR') {
      const [vendorRows] = await pool.execute(
        `SELECT vi.*, COUNT(vp.product_id) as products_count
         FROM vendor_info vi
         LEFT JOIN vendor_products vp ON vi.vendor_info_id = vp.vendor_id
         WHERE vi.user_id = ?
         GROUP BY vi.vendor_info_id`,
        [userId]
      );

      if (vendorRows && (vendorRows as any).length > 0) {
        userData.vendor_info = (vendorRows as any)[0];
      }
    }

    if (include.includes('stats')) {
      const [statsRows] = await pool.execute(
        `SELECT 
           COUNT(o.order_id) as total_orders,
           COALESCE(SUM(o.total_amount), 0) as total_spent,
           MAX(o.created_at) as last_order_date
         FROM orders o
         WHERE o.user_id = ?`,
        [userId]
      );

      if (statsRows && (statsRows as any).length > 0) {
        userData.stats = {
          ...(statsRows as any)[0],
          account_status: userData.is_active ? 'active' : 'inactive'
        };
      }
    }

    return userData;
  }

  private async handleCreateUser(body: any, adminUser: any) {
    // Validate required fields
    ErrorUtils.validateRequiredFields(body, [
      'email', 'first_name', 'last_name', 'role', 'password'
    ]);

    // Validate email format
    ErrorUtils.validateField(
      body.email,
      'email',
      (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      'Invalid email format'
    );

    // Validate role
    const validRoles = ['ADMIN', 'VENDOR', 'CUSTOMER', 'INSTALLER', 'SALES_REPRESENTATIVE', 'TRADE_PROFESSIONAL'];
    ErrorUtils.validateField(
      body.role.toUpperCase(),
      'role',
      (role) => validRoles.includes(role),
      'Invalid role'
    );

    const pool = await getPool();
    
    try {
      // Check if email already exists
      const [existingUsers] = await pool.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [body.email]
      );

      if ((existingUsers as any).length > 0) {
        throw APIErrorHandler.createError(
          APIErrorCode.DUPLICATE_ENTRY,
          'User with this email already exists'
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(body.password);

      // Create user
      const [result] = await pool.execute(
        `INSERT INTO users (
          email, password_hash, first_name, last_name, phone, role,
          is_active, is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          body.email,
          hashedPassword,
          body.first_name,
          body.last_name,
          body.phone || null,
          body.role.toUpperCase(),
          body.is_active !== false, // Default to true
          body.is_verified || false
        ]
      );

      const newUserId = (result as any).insertId;

      // Create profile if provided
      if (body.profile) {
        await pool.execute(
          `INSERT INTO user_profiles (
            user_id, address, city, state, zip_code, company, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            newUserId,
            body.profile.address || null,
            body.profile.city || null,
            body.profile.state || null,
            body.profile.zip_code || null,
            body.profile.company || null
          ]
        );
      }

      // If creating vendor, create vendor_info
      if (body.role.toUpperCase() === 'VENDOR' && body.vendor_info) {
        await pool.execute(
          `INSERT INTO vendor_info (
            user_id, business_name, commission_rate, is_approved, created_at
          ) VALUES (?, ?, ?, ?, NOW())`,
          [
            newUserId,
            body.vendor_info.business_name,
            body.vendor_info.commission_rate || 10,
            body.vendor_info.is_approved || false
          ]
        );
      }

      // Invalidate relevant caches
      GlobalCaches.admin.invalidateByTag('users');

      // Get the created user data
      const userData = await this.fetchSingleUser(newUserId, ['profile', 'vendor_info']);

      return this.successResponse({
        user: userData,
        created: true,
        message: 'User created successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'create_user',
        email: body.email 
      });
    }
  }

  private async handleUpdateUser(body: any, adminUser: any) {
    const userId = body.user_id;
    const pool = await getPool();

    try {
      // Check if user exists
      const existingUser = await this.fetchSingleUser(userId, []);

      // Build update query for users table
      const userUpdates: string[] = [];
      const userValues: any[] = [];

      if (body.first_name !== undefined) {
        userUpdates.push('first_name = ?');
        userValues.push(body.first_name);
      }
      if (body.last_name !== undefined) {
        userUpdates.push('last_name = ?');
        userValues.push(body.last_name);
      }
      if (body.phone !== undefined) {
        userUpdates.push('phone = ?');
        userValues.push(body.phone);
      }
      if (body.role !== undefined) {
        userUpdates.push('role = ?');
        userValues.push(body.role.toUpperCase());
      }
      if (body.is_active !== undefined) {
        userUpdates.push('is_active = ?');
        userValues.push(body.is_active);
      }
      if (body.is_verified !== undefined) {
        userUpdates.push('is_verified = ?');
        userValues.push(body.is_verified);
      }

      if (userUpdates.length > 0) {
        userUpdates.push('updated_at = NOW()');
        userValues.push(userId);

        await pool.execute(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE user_id = ?`,
          userValues
        );
      }

      // Update profile if provided
      if (body.profile) {
        const profileUpdates: string[] = [];
        const profileValues: any[] = [];

        Object.entries(body.profile).forEach(([key, value]) => {
          if (value !== undefined) {
            profileUpdates.push(`${key} = ?`);
            profileValues.push(value);
          }
        });

        if (profileUpdates.length > 0) {
          profileValues.push(userId);
          
          await pool.execute(
            `INSERT INTO user_profiles (user_id, ${Object.keys(body.profile).join(', ')}, created_at)
             VALUES (?, ${Object.keys(body.profile).map(() => '?').join(', ')}, NOW())
             ON DUPLICATE KEY UPDATE ${profileUpdates.join(', ')}`,
            [userId, ...Object.values(body.profile), ...profileValues.slice(0, -1)]
          );
        }
      }

      // Update vendor info if provided and user is vendor
      if (body.vendor_info && existingUser.role === 'VENDOR') {
        const vendorUpdates: string[] = [];
        const vendorValues: any[] = [];

        Object.entries(body.vendor_info).forEach(([key, value]) => {
          if (value !== undefined) {
            vendorUpdates.push(`${key} = ?`);
            vendorValues.push(value);
          }
        });

        if (vendorUpdates.length > 0) {
          vendorValues.push(userId);
          
          await pool.execute(
            `UPDATE vendor_info SET ${vendorUpdates.join(', ')} WHERE user_id = ?`,
            vendorValues
          );
        }
      }

      // Invalidate caches
      GlobalCaches.admin.invalidateByTag('users');
      GlobalCaches.admin.invalidate(`admin:user:${userId}`);

      // Get updated user data
      const updatedUser = await this.fetchSingleUser(userId, ['profile', 'vendor_info']);

      return this.successResponse({
        user: updatedUser,
        updated: true,
        message: 'User updated successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_user',
        user_id: userId 
      });
    }
  }

  private async handleDeleteUser(userId: number, hardDelete: boolean, adminUser: any) {
    const pool = await getPool();

    try {
      if (hardDelete) {
        // Hard delete - remove from database
        await pool.execute('DELETE FROM users WHERE user_id = ?', [userId]);
      } else {
        // Soft delete - deactivate user
        await pool.execute(
          'UPDATE users SET is_active = 0, updated_at = NOW() WHERE user_id = ?',
          [userId]
        );
      }

      // Invalidate caches
      GlobalCaches.admin.invalidateByTag('users');
      GlobalCaches.admin.invalidate(`admin:user:${userId}`);

      return this.successResponse({
        user_id: userId,
        deleted: hardDelete,
        deactivated: !hardDelete,
        message: hardDelete ? 'User permanently deleted' : 'User deactivated'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: hardDelete ? 'hard_delete_user' : 'deactivate_user',
        user_id: userId 
      });
    }
  }

  private async handleBulkUpdate(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['user_ids', 'updates']);

    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const results = [];
      
      for (const userId of body.user_ids) {
        try {
          // Apply updates to each user
          const result = await this.handleUpdateUser(
            { user_id: userId, ...body.updates }, 
            adminUser
          );
          results.push({ user_id: userId, success: true, data: result });
        } catch (error) {
          results.push({ 
            user_id: userId, 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      await connection.commit();

      return this.successResponse({
        results,
        total: body.user_ids.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });

    } catch (error) {
      await connection.rollback();
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'bulk_update_users',
        user_count: body.user_ids.length 
      });
    } finally {
      connection.release();
    }
  }

  private async handleExportUsers(body: any, adminUser: any) {
    const format = body.format || 'csv';
    const filters = body.filters || {};
    
    // Generate export data (simplified)
    const exportId = `users_export_${Date.now()}`;
    
    return this.successResponse({
      export_id: exportId,
      format,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
      download_url: `/api/admin/users/export/${exportId}`
    });
  }

  private async handleImportUsers(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['users']);
    
    // Validate import data structure
    if (!Array.isArray(body.users)) {
      throw APIErrorHandler.createValidationError('users', 'Users must be an array');
    }

    const results = [];
    
    for (const userData of body.users) {
      try {
        const result = await this.handleCreateUser(userData, adminUser);
        results.push({ email: userData.email, success: true, data: result });
      } catch (error) {
        results.push({ 
          email: userData.email, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return this.successResponse({
      results,
      total: body.users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  }

  private async addUserStatistics(users: UserData[]): Promise<UserData[]> {
    const pool = await getPool();
    const userIds = users.map(u => u.user_id);
    
    if (userIds.length === 0) return users;

    const [statsRows] = await pool.execute(
      `SELECT 
         user_id,
         COUNT(order_id) as total_orders,
         COALESCE(SUM(total_amount), 0) as total_spent,
         MAX(created_at) as last_order_date
       FROM orders
       WHERE user_id IN (${userIds.map(() => '?').join(',')})
       GROUP BY user_id`,
      userIds
    );

    const statsMap = new Map();
    (statsRows as any[]).forEach(stat => {
      statsMap.set(stat.user_id, {
        total_orders: stat.total_orders || 0,
        total_spent: parseFloat(stat.total_spent) || 0,
        last_order_date: stat.last_order_date,
        account_status: 'active' // Will be updated based on user status
      });
    });

    return users.map(user => ({
      ...user,
      stats: statsMap.get(user.user_id) || {
        total_orders: 0,
        total_spent: 0,
        last_order_date: null,
        account_status: user.is_active ? 'active' : 'inactive'
      }
    }));
  }

  private buildWhereClause(conditions: any[]): { clause: string; params: any[] } {
    if (conditions.length === 0) {
      return { clause: '', params: [] };
    }

    const clauses: string[] = [];
    const params: any[] = [];

    conditions.forEach(({ field, operator, value, parameterized = true }) => {
      if (parameterized) {
        if (Array.isArray(value)) {
          params.push(...value);
        } else {
          clauses.push(`${field} ${operator} ?`);
          params.push(value);
        }
      } else {
        if (Array.isArray(value)) {
          clauses.push(field); // For complex WHERE clauses like LIKE
        } else {
          clauses.push(`${field} ${operator} ${value}`);
        }
      }
    });

    return {
      clause: `WHERE ${clauses.join(' AND ')}`,
      params
    };
  }

  private buildLimitClause(limit: number, offset: number): string {
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
    const safeOffset = Math.max(0, Math.floor(offset));
    return `LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  }
}