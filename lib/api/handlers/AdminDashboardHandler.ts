/**
 * Enhanced Admin Dashboard Handler using Consolidation Infrastructure
 * Replaces multiple admin endpoints with comprehensive caching and error handling
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs, ConsolidatedCacheKeys } from '@/lib/api/caching';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

interface DashboardData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenue7d: number;
    revenue1d: number;
    totalCustomers: number;
    activeCustomers: number;
    newCustomers7d: number;
    newCustomers1d: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    ordersToday: number;
    totalProducts: number;
    activeProducts: number;
    stockAlerts: number;
    outOfStock: number;
    totalVendors: number;
    activeVendors: number;
    newVendors30d: number;
  };
  charts: {
    salesTrend: Array<{
      date: string;
      amount: number;
      orderCount: number;
    }>;
    customerGrowth: Array<{
      date: string;
      newCustomers: number;
      totalCustomers: number;
    }>;
  };
  insights: {
    topProducts: Array<{
      productId: number;
      name: string;
      basePrice: number;
      totalSold: number;
      totalRevenue: number;
    }>;
    recentOrders: Array<{
      orderId: number;
      orderNumber: string;
      totalAmount: number;
      status: string;
      createdAt: string;
      customerName: string;
      customerEmail: string;
    }>;
  };
  alerts: Array<{
    type: string;
    message: string;
    value: number;
    severity: string;
  }>;
  performance?: {
    apiConsolidation: any;
    databaseConnections: number;
    cacheStats: any;
  };
}

export class AdminDashboardHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/admin/dashboard-consolidated');
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
    const dateRange = this.sanitizeStringParam(searchParams.get('dateRange')) || '30d';
    const includeExport = this.sanitizeBooleanParam(searchParams.get('export')) || false;
    const includePerformance = this.sanitizeBooleanParam(searchParams.get('performance')) || false;

    // Validate date range
    const validRanges = ['7d', '30d', '90d', '1y'];
    if (!validRanges.includes(dateRange)) {
      throw APIErrorHandler.createValidationError('dateRange', 'Invalid date range');
    }

    // Generate cache key
    const cacheKey = ConsolidatedCacheKeys.admin.dashboard(dateRange, includeExport);

    try {
      // Use smart caching
      const result = await GlobalCaches.admin.getOrSet(
        cacheKey,
        () => this.fetchDashboardData(dateRange, includeExport, includePerformance),
        CacheConfigs.slow // 1 hour TTL for admin dashboard
      );

      // Record migration metrics
      if (!result.fromCache) {
        MigrationTracker.recordEndpointUsage('/api/admin/dashboard-consolidated', 1);
      }

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey,
        cacheAge: result.cacheAge
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('Database')) {
        throw APIErrorHandler.createDatabaseError(error, { dateRange, includeExport });
      }
      throw error;
    }
  }

  async handlePOST(req: NextRequest, user: any) {
    // Handle export requests
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body) {
      throw APIErrorHandler.createError(APIErrorCode.INVALID_FORMAT, 'Request body required');
    }

    const { format, dateRange, sections } = body;

    // Validate export parameters
    if (!format || !['csv', 'pdf', 'excel'].includes(format)) {
      throw APIErrorHandler.createValidationError('format', 'Invalid export format');
    }

    // Create export job (simplified implementation)
    const exportJobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return this.successResponse({
      exportJobId,
      format,
      sections: sections || ['overview', 'charts', 'insights'],
      estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
      downloadUrl: `/api/admin/dashboard-consolidated/export/${exportJobId}`
    });
  }

  private async fetchDashboardData(
    dateRange: string, 
    includeExport: boolean, 
    includePerformance: boolean
  ): Promise<DashboardData> {
    
    const pool = await getPool();
    
    // Convert dateRange to SQL interval
    const intervalMap: Record<string, string> = {
      '7d': '7 DAY',
      '30d': '30 DAY',
      '90d': '90 DAY',
      '1y': '1 YEAR'
    };
    const interval = intervalMap[dateRange];

    // Execute all queries in parallel for optimal performance
    const results = await this.executeParallelQueries({
      revenue: () => this.fetchRevenueMetrics(pool, interval),
      customers: () => this.fetchCustomerMetrics(pool),
      orders: () => this.fetchOrderMetrics(pool),
      products: () => this.fetchProductMetrics(pool),
      vendors: () => this.fetchVendorMetrics(pool),
      salesTrend: () => this.fetchSalesTrend(pool, interval),
      customerGrowth: () => this.fetchCustomerGrowth(pool, interval),
      topProducts: () => this.fetchTopProducts(pool, interval),
      recentOrders: () => this.fetchRecentOrders(pool),
      alerts: () => this.fetchSystemAlerts(pool)
    });

    // Transform and structure the data
    const dashboardData: DashboardData = {
      overview: {
        // Revenue metrics
        totalRevenue: parseFloat(results.revenue?.total_revenue || 0),
        totalOrders: results.revenue?.total_orders || 0,
        averageOrderValue: parseFloat(results.revenue?.average_order_value || 0),
        revenue7d: parseFloat(results.revenue?.revenue_7d || 0),
        revenue1d: parseFloat(results.revenue?.revenue_1d || 0),
        
        // Customer metrics
        totalCustomers: results.customers?.total_customers || 0,
        activeCustomers: results.customers?.active_customers || 0,
        newCustomers7d: results.customers?.new_customers_7d || 0,
        newCustomers1d: results.customers?.new_customers_1d || 0,
        
        // Order metrics
        pendingOrders: results.orders?.pending_orders || 0,
        completedOrders: results.orders?.completed_orders || 0,
        cancelledOrders: results.orders?.cancelled_orders || 0,
        ordersToday: results.orders?.orders_today || 0,
        
        // Product metrics
        totalProducts: results.products?.total_products || 0,
        activeProducts: results.products?.active_products || 0,
        stockAlerts: results.products?.stock_alerts || 0,
        outOfStock: results.products?.out_of_stock || 0,
        
        // Vendor metrics
        totalVendors: results.vendors?.total_vendors || 0,
        activeVendors: results.vendors?.active_vendors || 0,
        newVendors30d: results.vendors?.new_vendors_30d || 0
      },
      
      charts: {
        salesTrend: (results.salesTrend || []).map((row: any) => ({
          date: row.date,
          amount: parseFloat(row.amount || 0),
          orderCount: row.order_count || 0
        })),
        customerGrowth: (results.customerGrowth || []).map((row: any) => ({
          date: row.date,
          newCustomers: row.new_customers || 0,
          totalCustomers: row.total || 0
        }))
      },
      
      insights: {
        topProducts: (results.topProducts || []).map((product: any) => ({
          productId: product.product_id,
          name: product.name,
          basePrice: parseFloat(product.base_price || 0),
          totalSold: product.total_sold || 0,
          totalRevenue: parseFloat(product.total_revenue || 0)
        })),
        recentOrders: (results.recentOrders || []).map((order: any) => ({
          orderId: order.order_id,
          orderNumber: order.order_number,
          totalAmount: parseFloat(order.total_amount || 0),
          status: order.status,
          createdAt: order.created_at,
          customerName: `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Guest',
          customerEmail: order.email
        }))
      },
      
      alerts: (results.alerts || []).map((alert: any) => ({
        type: alert.type,
        message: alert.message,
        value: parseFloat(alert.value || 0),
        severity: alert.severity
      }))
    };

    // Add performance data if requested
    if (includePerformance) {
      dashboardData.performance = {
        apiConsolidation: MigrationTracker.getProgressSummary(),
        databaseConnections: await this.getDatabaseConnectionCount(),
        cacheStats: GlobalCaches.admin.getMetrics()
      };
    }

    return dashboardData;
  }

  // Individual query methods for better organization and testing
  private async fetchRevenueMetrics(pool: any, interval: string) {
    const [rows] = await pool.execute(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_orders,
        AVG(total_amount) as average_order_value,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN total_amount ELSE 0 END) as revenue_7d,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN total_amount ELSE 0 END) as revenue_1d
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
    `);
    return rows[0];
  }

  private async fetchCustomerMetrics(pool: any) {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT user_id) as total_customers,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_customers,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_customers_7d,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) as new_customers_1d
      FROM users
      WHERE role = 'CUSTOMER'
    `);
    return rows[0];
  }

  private async fetchOrderMetrics(pool: any) {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as orders_today
      FROM orders
    `);
    return rows[0];
  }

  private async fetchProductMetrics(pool: any) {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_products,
        COUNT(CASE WHEN stock_quantity <= reorder_point THEN 1 END) as stock_alerts,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock
      FROM products
    `);
    return rows[0];
  }

  private async fetchVendorMetrics(pool: any) {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_vendors,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_vendors_30d
      FROM vendor_info
    `);
    return rows[0];
  }

  private async fetchSalesTrend(pool: any, interval: string) {
    const [rows] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as amount,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    return rows;
  }

  private async fetchCustomerGrowth(pool: any, interval: string) {
    const [rows] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total
      FROM users
      WHERE 
        role = 'CUSTOMER'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    return rows;
  }

  private async fetchTopProducts(pool: any, interval: string) {
    const [rows] = await pool.execute(`
      SELECT 
        p.product_id,
        p.name,
        p.base_price,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM products p
      JOIN order_items oi ON p.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
      GROUP BY p.product_id, p.name, p.base_price
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    return rows;
  }

  private async fetchRecentOrders(pool: any) {
    const [rows] = await pool.execute(`
      SELECT 
        o.order_id,
        o.order_number,
        o.total_amount,
        o.status,
        o.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    return rows;
  }

  private async fetchSystemAlerts(pool: any) {
    const [rows] = await pool.execute(`
      SELECT 
        'stock_alert' as type,
        CONCAT('Low stock: ', name) as message,
        stock_quantity as value,
        'warning' as severity
      FROM products
      WHERE stock_quantity <= reorder_point AND stock_quantity > 0
      UNION ALL
      SELECT 
        'out_of_stock' as type,
        CONCAT('Out of stock: ', name) as message,
        0 as value,
        'error' as severity
      FROM products
      WHERE stock_quantity = 0
      UNION ALL
      SELECT 
        'pending_orders' as type,
        CONCAT('Pending order: #', order_number) as message,
        total_amount as value,
        'info' as severity
      FROM orders
      WHERE status IN ('pending', 'processing')
      ORDER BY severity DESC, value DESC
      LIMIT 20
    `);
    return rows;
  }

  private async getDatabaseConnectionCount(): Promise<number> {
    try {
      const pool = await getPool();
      const [rows] = await pool.execute('SHOW STATUS LIKE "Threads_connected"');
      return parseInt((rows as any)[0]?.Value || '0');
    } catch {
      return 0;
    }
  }
}