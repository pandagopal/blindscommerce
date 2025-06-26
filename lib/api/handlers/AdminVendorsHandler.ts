/**
 * Admin Vendors Consolidated Handler
 * Replaces multiple vendor management endpoints with comprehensive vendor operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs, ConsolidatedCacheKeys } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

interface VendorData {
  vendor_info_id: number;
  user_id: number;
  business_name: string;
  business_email: string;
  business_phone?: string;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;
  business_website?: string;
  commission_rate: number;
  is_active: boolean;
  is_approved: boolean;
  approval_status: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
  
  // User data
  user: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    last_login?: string;
  };
  
  // Business statistics
  stats?: {
    total_products: number;
    active_products: number;
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    last_order_date?: string;
    commission_earned: number;
    performance_rating: number;
  };
  
  // Product categories
  categories?: string[];
  
  // Recent activity
  recent_activity?: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

interface VendorsListResponse {
  vendors: VendorData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
  filters: {
    status?: string;
    approval?: string;
    search?: string;
  };
  summary: {
    totalVendors: number;
    activeVendors: number;
    approvedVendors: number;
    pendingApproval: number;
    avgCommissionRate: number;
    totalRevenue: number;
  };
}

export class AdminVendorsHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/admin/vendors');
  }

  async handleGET(req: NextRequest, user: any | null) {
    if (!user) {
      throw APIErrorHandler.createAuthenticationError();
    }

    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPaginationParams(searchParams);
    
    const status = this.sanitizeStringParam(searchParams.get('status'));
    const approval = this.sanitizeStringParam(searchParams.get('approval'));
    const search = this.sanitizeStringParam(searchParams.get('search'));
    const include = searchParams.get('include')?.split(',') || [];
    const vendorId = this.sanitizeNumberParam(searchParams.get('vendor_id'));

    // If requesting specific vendor
    if (vendorId) {
      return this.handleGetSingleVendor(vendorId, include);
    }

    // Generate cache key for list
    const cacheKey = ConsolidatedCacheKeys.admin.vendors(page, limit, status);

    try {
      const result = await GlobalCaches.admin.getOrSet(
        cacheKey,
        () => this.fetchVendorsList(page, limit, offset, { status, approval, search }, include),
        CacheConfigs.standard
      );

      MigrationTracker.recordEndpointUsage('/api/admin/vendors', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey,
        cacheAge: result.cacheAge
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        filters: { status, approval, search }, 
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

    const action = body.action || 'approve';

    switch (action) {
      case 'approve':
        return this.handleApproveVendor(body, user);
      case 'reject':
        return this.handleRejectVendor(body, user);
      case 'update_commission':
        return this.handleUpdateCommission(body, user);
      case 'bulk_update':
        return this.handleBulkUpdate(body, user);
      case 'export':
        return this.handleExportVendors(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  async handlePUT(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body || !body.vendor_info_id) {
      throw APIErrorHandler.createValidationError('vendor_info_id', 'Vendor ID required for updates');
    }

    return this.handleUpdateVendor(body, user);
  }

  async handleDELETE(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const vendorId = this.sanitizeNumberParam(searchParams.get('vendor_id'));
    const action = searchParams.get('action') || 'deactivate';

    if (!vendorId) {
      throw APIErrorHandler.createValidationError('vendor_id', 'Vendor ID required');
    }

    return this.handleDeleteVendor(vendorId, action === 'permanent', user);
  }

  // Private implementation methods

  private async handleGetSingleVendor(vendorId: number, include: string[]) {
    const cacheKey = `admin:vendor:${vendorId}:${include.join(',')}`;
    
    const result = await GlobalCaches.admin.getOrSet(
      cacheKey,
      () => this.fetchSingleVendor(vendorId, include),
      CacheConfigs.fast
    );

    return this.successResponse(result.data, {
      cached: result.fromCache,
      cacheKey
    });
  }

  private async fetchVendorsList(
    page: number, 
    limit: number, 
    offset: number,
    filters: { status?: string; approval?: string; search?: string },
    include: string[]
  ): Promise<VendorsListResponse> {
    
    const pool = await getPool();
    const { status, approval, search } = filters;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      if (status === 'active') {
        conditions.push('vi.is_active = ?');
        params.push(1);
      } else if (status === 'inactive') {
        conditions.push('vi.is_active = ?');
        params.push(0);
      }
    }

    if (approval) {
      if (approval === 'approved') {
        conditions.push('vi.is_approved = ?');
        params.push(1);
      } else if (approval === 'pending') {
        conditions.push('vi.approval_status = ?');
        params.push('pending');
      } else if (approval === 'rejected') {
        conditions.push('vi.approval_status = ?');
        params.push('rejected');
      }
    }

    if (search) {
      conditions.push(`(
        vi.business_name LIKE ? OR 
        vi.business_email LIKE ? OR 
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR
        u.email LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Execute queries in parallel
    const results = await this.executeParallelQueries({
      vendors: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            vi.*,
            u.email, u.first_name, u.last_name, u.phone, u.last_login
           FROM vendor_info vi
           JOIN users u ON vi.user_id = u.user_id
           ${whereClause}
           ORDER BY vi.created_at DESC
           LIMIT ${limit} OFFSET ${offset}`,
          params
        );
        return rows;
      },

      totalCount: async () => {
        const [rows] = await pool.execute(
          `SELECT COUNT(*) as total 
           FROM vendor_info vi 
           JOIN users u ON vi.user_id = u.user_id 
           ${whereClause}`,
          params
        );
        return (rows as any)[0].total;
      },

      summary: async () => {
        const [rows] = await pool.execute(`
          SELECT 
            COUNT(*) as total_vendors,
            SUM(CASE WHEN vi.is_active = 1 THEN 1 ELSE 0 END) as active_vendors,
            SUM(CASE WHEN vi.is_approved = 1 THEN 1 ELSE 0 END) as approved_vendors,
            SUM(CASE WHEN vi.approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approval,
            AVG(vi.commission_rate) as avg_commission_rate,
            COALESCE(SUM(vendor_revenue.total_revenue), 0) as total_revenue
          FROM vendor_info vi
          LEFT JOIN (
            SELECT 
              vp.vendor_id,
              SUM(oi.price * oi.quantity) as total_revenue
            FROM vendor_products vp
            JOIN order_items oi ON vp.product_id = oi.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status = 'completed'
            GROUP BY vp.vendor_id
          ) vendor_revenue ON vi.vendor_info_id = vendor_revenue.vendor_id
        `);
        return (rows as any)[0];
      }
    });

    let vendorsWithStats: VendorData[] = results.vendors || [];
    
    // Add statistics if requested
    if (include.includes('stats')) {
      vendorsWithStats = await this.addVendorStatistics(vendorsWithStats);
    }

    // Add categories if requested
    if (include.includes('categories')) {
      vendorsWithStats = await this.addVendorCategories(vendorsWithStats);
    }

    // Add recent activity if requested
    if (include.includes('activity')) {
      vendorsWithStats = await this.addRecentActivity(vendorsWithStats);
    }

    const total = results.totalCount || 0;
    const summary = results.summary || {};

    return {
      vendors: vendorsWithStats.map(vendor => ({
        ...vendor,
        user: {
          email: vendor.user?.email || '',
          first_name: vendor.user?.first_name || '',
          last_name: vendor.user?.last_name || '',
          phone: vendor.user?.phone,
          last_login: vendor.user?.last_login
        }
      })),
      pagination: this.buildPaginationInfo(page, limit, total),
      filters: { status, approval, search },
      summary: {
        totalVendors: summary.total_vendors || 0,
        activeVendors: summary.active_vendors || 0,
        approvedVendors: summary.approved_vendors || 0,
        pendingApproval: summary.pending_approval || 0,
        avgCommissionRate: parseFloat(summary.avg_commission_rate) || 0,
        totalRevenue: parseFloat(summary.total_revenue) || 0
      }
    };
  }

  private async fetchSingleVendor(vendorId: number, include: string[]): Promise<VendorData> {
    const pool = await getPool();
    
    const [vendorRows] = await pool.execute(
      `SELECT 
        vi.*,
        u.email, u.first_name, u.last_name, u.phone, u.last_login
       FROM vendor_info vi
       JOIN users u ON vi.user_id = u.user_id
       WHERE vi.vendor_info_id = ?`,
      [vendorId]
    );

    if (!vendorRows || (vendorRows as any).length === 0) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Vendor not found');
    }

    const vendorData = (vendorRows as any)[0];

    // Add optional data based on includes
    if (include.includes('stats')) {
      const [statsRows] = await pool.execute(
        `SELECT 
           COUNT(DISTINCT vp.product_id) as total_products,
           COUNT(DISTINCT CASE WHEN p.is_active = 1 THEN vp.product_id END) as active_products,
           COUNT(DISTINCT o.order_id) as total_orders,
           COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
           AVG(oi.price * oi.quantity) as avg_order_value,
           MAX(o.created_at) as last_order_date,
           COALESCE(SUM(oi.price * oi.quantity * vi.commission_rate / 100), 0) as commission_earned
         FROM vendor_info vi
         LEFT JOIN vendor_products vp ON vi.vendor_info_id = vp.vendor_id
         LEFT JOIN products p ON vp.product_id = p.product_id
         LEFT JOIN order_items oi ON vp.product_id = oi.product_id
         LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status = 'completed'
         WHERE vi.vendor_info_id = ?
         GROUP BY vi.vendor_info_id`,
        [vendorId]
      );

      if (statsRows && (statsRows as any).length > 0) {
        const stats = (statsRows as any)[0];
        vendorData.stats = {
          ...stats,
          total_revenue: parseFloat(stats.total_revenue) || 0,
          avg_order_value: parseFloat(stats.avg_order_value) || 0,
          commission_earned: parseFloat(stats.commission_earned) || 0,
          performance_rating: this.calculatePerformanceRating(stats)
        };
      }
    }

    if (include.includes('categories')) {
      const [categoriesRows] = await pool.execute(
        `SELECT DISTINCT c.name
         FROM vendor_products vp
         JOIN products p ON vp.product_id = p.product_id
         JOIN categories c ON p.category_id = c.category_id
         WHERE vp.vendor_id = ?`,
        [vendorId]
      );

      vendorData.categories = (categoriesRows as any[]).map(row => row.name);
    }

    if (include.includes('activity')) {
      const [activityRows] = await pool.execute(
        `(SELECT 'order' as type, CONCAT('New order #', o.order_number) as description, o.created_at as date
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          JOIN vendor_products vp ON oi.product_id = vp.product_id
          WHERE vp.vendor_id = ?
          ORDER BY o.created_at DESC
          LIMIT 5)
         UNION ALL
         (SELECT 'product' as type, CONCAT('Added product: ', p.name) as description, p.created_at as date
          FROM products p
          JOIN vendor_products vp ON p.product_id = vp.product_id
          WHERE vp.vendor_id = ?
          ORDER BY p.created_at DESC
          LIMIT 5)
         ORDER BY date DESC
         LIMIT 10`,
        [vendorId, vendorId]
      );

      vendorData.recent_activity = (activityRows as any[]);
    }

    return vendorData;
  }

  private async handleApproveVendor(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['vendor_id']);

    const pool = await getPool();
    
    try {
      await pool.execute(
        `UPDATE vendor_info 
         SET is_approved = 1, approval_status = 'approved', approval_date = NOW(), updated_at = NOW()
         WHERE vendor_info_id = ?`,
        [body.vendor_id]
      );

      // Also activate the vendor if they weren't active
      await pool.execute(
        `UPDATE vendor_info 
         SET is_active = 1
         WHERE vendor_info_id = ? AND is_active = 0`,
        [body.vendor_id]
      );

      // Invalidate caches
      GlobalCaches.admin.invalidateByTag('vendors');

      const vendorData = await this.fetchSingleVendor(body.vendor_id, ['stats']);

      return this.successResponse({
        vendor: vendorData,
        approved: true,
        message: 'Vendor approved successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'approve_vendor',
        vendor_id: body.vendor_id 
      });
    }
  }

  private async handleRejectVendor(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['vendor_id']);

    const pool = await getPool();
    const reason = body.reason || 'Not specified';
    
    try {
      await pool.execute(
        `UPDATE vendor_info 
         SET is_approved = 0, approval_status = 'rejected', updated_at = NOW()
         WHERE vendor_info_id = ?`,
        [body.vendor_id]
      );

      // Log rejection reason
      await pool.execute(
        `INSERT INTO vendor_approval_log (vendor_id, action, reason, admin_user_id, created_at)
         VALUES (?, 'rejected', ?, ?, NOW())`,
        [body.vendor_id, reason, adminUser.user_id]
      );

      GlobalCaches.admin.invalidateByTag('vendors');

      return this.successResponse({
        vendor_id: body.vendor_id,
        rejected: true,
        reason,
        message: 'Vendor rejected'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'reject_vendor',
        vendor_id: body.vendor_id 
      });
    }
  }

  private async handleUpdateCommission(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['vendor_id', 'commission_rate']);

    const commissionRate = this.sanitizeNumberParam(body.commission_rate?.toString());
    
    if (!commissionRate || commissionRate < 0 || commissionRate > 100) {
      throw APIErrorHandler.createValidationError('commission_rate', 'Commission rate must be between 0 and 100');
    }

    const pool = await getPool();
    
    try {
      await pool.execute(
        `UPDATE vendor_info 
         SET commission_rate = ?, updated_at = NOW()
         WHERE vendor_info_id = ?`,
        [commissionRate, body.vendor_id]
      );

      GlobalCaches.admin.invalidateByTag('vendors');

      return this.successResponse({
        vendor_id: body.vendor_id,
        commission_rate: commissionRate,
        updated: true,
        message: 'Commission rate updated successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_commission',
        vendor_id: body.vendor_id 
      });
    }
  }

  private async handleUpdateVendor(body: any, adminUser: any) {
    const vendorId = body.vendor_info_id;
    const pool = await getPool();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      const allowedFields = [
        'business_name', 'business_email', 'business_phone', 'business_address',
        'business_city', 'business_state', 'business_zip', 'business_website',
        'commission_rate', 'is_active', 'is_approved'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      });

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(vendorId);

        await pool.execute(
          `UPDATE vendor_info SET ${updates.join(', ')} WHERE vendor_info_id = ?`,
          values
        );
      }

      GlobalCaches.admin.invalidateByTag('vendors');
      GlobalCaches.admin.invalidate(`admin:vendor:${vendorId}`);

      const updatedVendor = await this.fetchSingleVendor(vendorId, ['stats']);

      return this.successResponse({
        vendor: updatedVendor,
        updated: true,
        message: 'Vendor updated successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_vendor',
        vendor_id: vendorId 
      });
    }
  }

  private async handleDeleteVendor(vendorId: number, permanent: boolean, adminUser: any) {
    const pool = await getPool();

    try {
      if (permanent) {
        // Check if vendor has orders
        const [orderCheck] = await pool.execute(
          `SELECT COUNT(*) as order_count 
           FROM orders o
           JOIN order_items oi ON o.order_id = oi.order_id
           JOIN vendor_products vp ON oi.product_id = vp.product_id
           WHERE vp.vendor_id = ?`,
          [vendorId]
        );

        if ((orderCheck as any)[0].order_count > 0) {
          throw APIErrorHandler.createError(
            APIErrorCode.CONSTRAINT_VIOLATION,
            'Cannot delete vendor with existing orders'
          );
        }

        // Permanent deletion
        await pool.execute('DELETE FROM vendor_info WHERE vendor_info_id = ?', [vendorId]);
      } else {
        // Soft delete - deactivate
        await pool.execute(
          'UPDATE vendor_info SET is_active = 0, updated_at = NOW() WHERE vendor_info_id = ?',
          [vendorId]
        );
      }

      GlobalCaches.admin.invalidateByTag('vendors');

      return this.successResponse({
        vendor_id: vendorId,
        deleted: permanent,
        deactivated: !permanent,
        message: permanent ? 'Vendor permanently deleted' : 'Vendor deactivated'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: permanent ? 'delete_vendor' : 'deactivate_vendor',
        vendor_id: vendorId 
      });
    }
  }

  private async handleBulkUpdate(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['vendor_ids', 'updates']);

    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const results = [];
      
      for (const vendorId of body.vendor_ids) {
        try {
          const result = await this.handleUpdateVendor(
            { vendor_info_id: vendorId, ...body.updates }, 
            adminUser
          );
          results.push({ vendor_id: vendorId, success: true, data: result });
        } catch (error) {
          results.push({ 
            vendor_id: vendorId, 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      await connection.commit();

      return this.successResponse({
        results,
        total: body.vendor_ids.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });

    } catch (error) {
      await connection.rollback();
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'bulk_update_vendors',
        vendor_count: body.vendor_ids.length 
      });
    } finally {
      connection.release();
    }
  }

  private async handleExportVendors(body: any, adminUser: any) {
    const format = body.format || 'csv';
    const filters = body.filters || {};
    
    const exportId = `vendors_export_${Date.now()}`;
    
    return this.successResponse({
      export_id: exportId,
      format,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
      download_url: `/api/admin/vendors/export/${exportId}`
    });
  }

  private async addVendorStatistics(vendors: VendorData[]): Promise<VendorData[]> {
    const pool = await getPool();
    const vendorIds = vendors.map(v => v.vendor_info_id);
    
    if (vendorIds.length === 0) return vendors;

    const [statsRows] = await pool.execute(
      `SELECT 
         vp.vendor_id,
         COUNT(DISTINCT vp.product_id) as total_products,
         COUNT(DISTINCT CASE WHEN p.is_active = 1 THEN vp.product_id END) as active_products,
         COUNT(DISTINCT o.order_id) as total_orders,
         COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
         AVG(oi.price * oi.quantity) as avg_order_value,
         MAX(o.created_at) as last_order_date
       FROM vendor_products vp
       LEFT JOIN products p ON vp.product_id = p.product_id
       LEFT JOIN order_items oi ON vp.product_id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status = 'completed'
       WHERE vp.vendor_id IN (${vendorIds.map(() => '?').join(',')})
       GROUP BY vp.vendor_id`,
      vendorIds
    );

    const statsMap = new Map();
    (statsRows as any[]).forEach(stat => {
      statsMap.set(stat.vendor_id, {
        total_products: stat.total_products || 0,
        active_products: stat.active_products || 0,
        total_orders: stat.total_orders || 0,
        total_revenue: parseFloat(stat.total_revenue) || 0,
        avg_order_value: parseFloat(stat.avg_order_value) || 0,
        last_order_date: stat.last_order_date,
        commission_earned: 0, // Will be calculated
        performance_rating: 0 // Will be calculated
      });
    });

    return vendors.map(vendor => {
      const stats = statsMap.get(vendor.vendor_info_id);
      if (stats) {
        stats.commission_earned = stats.total_revenue * vendor.commission_rate / 100;
        stats.performance_rating = this.calculatePerformanceRating(stats);
      }
      
      return {
        ...vendor,
        stats: stats || {
          total_products: 0,
          active_products: 0,
          total_orders: 0,
          total_revenue: 0,
          avg_order_value: 0,
          last_order_date: null,
          commission_earned: 0,
          performance_rating: 0
        }
      };
    });
  }

  private async addVendorCategories(vendors: VendorData[]): Promise<VendorData[]> {
    const pool = await getPool();
    const vendorIds = vendors.map(v => v.vendor_info_id);
    
    if (vendorIds.length === 0) return vendors;

    const [categoriesRows] = await pool.execute(
      `SELECT 
         vp.vendor_id,
         GROUP_CONCAT(DISTINCT c.name) as categories
       FROM vendor_products vp
       JOIN products p ON vp.product_id = p.product_id
       JOIN categories c ON p.category_id = c.category_id
       WHERE vp.vendor_id IN (${vendorIds.map(() => '?').join(',')})
       GROUP BY vp.vendor_id`,
      vendorIds
    );

    const categoriesMap = new Map();
    (categoriesRows as any[]).forEach(row => {
      categoriesMap.set(row.vendor_id, row.categories ? row.categories.split(',') : []);
    });

    return vendors.map(vendor => ({
      ...vendor,
      categories: categoriesMap.get(vendor.vendor_info_id) || []
    }));
  }

  private async addRecentActivity(vendors: VendorData[]): Promise<VendorData[]> {
    // Simplified - in real implementation, this would fetch actual activity data
    return vendors.map(vendor => ({
      ...vendor,
      recent_activity: [
        {
          type: 'order',
          description: 'Recent order activity',
          date: new Date().toISOString()
        }
      ]
    }));
  }

  private calculatePerformanceRating(stats: any): number {
    // Simple performance rating calculation
    let rating = 0;
    
    // Base on revenue
    if (stats.total_revenue > 10000) rating += 30;
    else if (stats.total_revenue > 5000) rating += 20;
    else if (stats.total_revenue > 1000) rating += 10;
    
    // Base on order count
    if (stats.total_orders > 100) rating += 25;
    else if (stats.total_orders > 50) rating += 15;
    else if (stats.total_orders > 10) rating += 10;
    
    // Base on product count
    if (stats.total_products > 50) rating += 20;
    else if (stats.total_products > 20) rating += 15;
    else if (stats.total_products > 5) rating += 10;
    
    // Base on average order value
    if (stats.avg_order_value > 500) rating += 25;
    else if (stats.avg_order_value > 200) rating += 15;
    else if (stats.avg_order_value > 100) rating += 10;
    
    return Math.min(100, rating);
  }
}