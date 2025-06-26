/**
 * Vendor Dashboard Consolidated Handler
 * Replaces multiple vendor dashboard endpoints with comprehensive vendor portal
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs, ConsolidatedCacheKeys } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

interface VendorDashboardData {
  vendor_info: {
    vendor_info_id: number;
    business_name: string;
    business_email: string;
    commission_rate: number;
    is_active: boolean;
    is_approved: boolean;
    rating: number;
    total_reviews: number;
    created_at: string;
  };
  
  // Sales metrics
  sales_metrics: {
    total_revenue: number;
    monthly_revenue: number;
    weekly_revenue: number;
    total_orders: number;
    monthly_orders: number;
    avg_order_value: number;
    commission_earned: number;
    pending_commission: number;
    last_payout_date?: string;
    next_payout_estimate: number;
  };
  
  // Product metrics
  product_metrics: {
    total_products: number;
    active_products: number;
    pending_approval: number;
    low_stock_count: number;
    out_of_stock_count: number;
    best_selling_product?: {
      product_id: number;
      name: string;
      units_sold: number;
      revenue: number;
    };
  };
  
  // Recent activity
  recent_activity: Array<{
    activity_id: number;
    type: 'order' | 'product' | 'review' | 'payout' | 'inquiry';
    title: string;
    description: string;
    amount?: number;
    status?: string;
    created_at: string;
    metadata?: any;
  }>;
  
  // Order summary
  order_summary: {
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    return_rate: number;
    avg_fulfillment_time: number; // in hours
  };
  
  // Sales team (if applicable)
  sales_team?: Array<{
    sales_rep_id: number;
    first_name: string;
    last_name: string;
    email: string;
    total_sales: number;
    commission_earned: number;
    active_leads: number;
    conversion_rate: number;
  }>;
  
  // Performance analytics
  performance: {
    monthly_growth: number; // percentage
    customer_satisfaction: number; // rating out of 5
    return_rate: number; // percentage
    on_time_delivery_rate: number; // percentage
    inventory_turnover: number;
    profit_margin: number; // percentage
  };
  
  // Financial summary
  financial: {
    gross_revenue: number;
    net_revenue: number; // after commissions
    outstanding_balance: number;
    last_payout_amount: number;
    next_payout_date?: string;
    payment_method?: string;
  };
  
  // Alerts and notifications
  alerts: Array<{
    alert_id: number;
    type: 'warning' | 'info' | 'success' | 'error';
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    action_required: boolean;
    created_at: string;
  }>;
  
  // Quick actions available
  quick_actions: string[];
}

export class VendorDashboardHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/vendor/dashboard');
  }

  async handleGET(req: NextRequest, user: any | null) {
    if (!user) {
      throw APIErrorHandler.createAuthenticationError();
    }

    if (!this.checkRole(user, 'VENDOR')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const include = searchParams.get('include')?.split(',') || ['all'];
    const dateRange = this.sanitizeStringParam(searchParams.get('date_range')) || '30d';
    const refresh = this.sanitizeBooleanParam(searchParams.get('refresh')) || false;

    try {
      const cacheKey = `vendor:dashboard:${user.vendor_info_id}:${dateRange}:${include.join(',')}`;
      
      const result = await GlobalCaches.vendor.getOrSet(
        cacheKey,
        () => this.fetchVendorDashboard(user.vendor_info_id, include, dateRange),
        refresh ? { ttl: 0 } : CacheConfigs.realtime
      );

      MigrationTracker.recordEndpointUsage('/api/vendor/dashboard', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache && !refresh,
        cacheKey,
        cacheAge: result.cacheAge,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        vendor_id: user.vendor_info_id,
        include,
        date_range: dateRange
      });
    }
  }

  async handlePOST(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'VENDOR')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body) {
      throw APIErrorHandler.createError(APIErrorCode.INVALID_FORMAT, 'Request body required');
    }

    const action = body.action || 'update_settings';

    switch (action) {
      case 'update_settings':
        return this.handleUpdateSettings(body, user);
      case 'dismiss_alert':
        return this.handleDismissAlert(body, user);
      case 'request_payout':
        return this.handleRequestPayout(body, user);
      case 'export_data':
        return this.handleExportData(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  // Private implementation methods

  private async fetchVendorDashboard(
    vendorId: number,
    include: string[],
    dateRange: string
  ): Promise<VendorDashboardData> {
    const pool = await getPool();
    
    // Get date range boundaries
    const { startDate, endDate } = this.parseDateRange(dateRange);
    
    // Execute parallel queries for different dashboard sections
    const results = await this.executeParallelQueries({
      // Vendor basic info
      vendorInfo: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            vi.*,
            vi.payment_method,
            vi.payment_terms,
            AVG(vr.rating) as rating,
            COUNT(vr.review_id) as total_reviews
           FROM vendor_info vi
           LEFT JOIN vendor_reviews vr ON vi.vendor_info_id = vr.vendor_id
           WHERE vi.vendor_info_id = ?
           GROUP BY vi.vendor_info_id`,
          [vendorId]
        );
        return (rows as any[])[0];
      },

      // Sales metrics
      salesMetrics: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            COUNT(DISTINCT o.order_id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.created_at >= ? THEN o.order_id END) as monthly_orders,
            COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN o.created_at >= ? THEN oi.price * oi.quantity ELSE 0 END), 0) as monthly_revenue,
            COALESCE(SUM(CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN oi.price * oi.quantity ELSE 0 END), 0) as weekly_revenue,
            AVG(oi.price * oi.quantity) as avg_order_value
           FROM vendor_products vp
           JOIN order_items oi ON vp.product_id = oi.product_id
           JOIN orders o ON oi.order_id = o.order_id
           WHERE vp.vendor_id = ? AND o.status = 'completed'`,
          [startDate, startDate, vendorId]
        );
        return (rows as any[])[0];
      },

      // Product metrics
      productMetrics: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            COUNT(DISTINCT p.product_id) as total_products,
            COUNT(DISTINCT CASE WHEN p.is_active = 1 THEN p.product_id END) as active_products,
            COUNT(DISTINCT CASE WHEN p.approval_status = 'pending' THEN p.product_id END) as pending_approval,
            COUNT(DISTINCT CASE WHEN p.stock_quantity <= p.low_stock_threshold THEN p.product_id END) as low_stock_count,
            COUNT(DISTINCT CASE WHEN p.stock_quantity = 0 THEN p.product_id END) as out_of_stock_count
           FROM vendor_products vp
           JOIN products p ON vp.product_id = p.product_id
           WHERE vp.vendor_id = ?`,
          [vendorId]
        );
        return (rows as any[])[0];
      },

      // Best selling product
      bestSellingProduct: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            p.product_id, p.name,
            SUM(oi.quantity) as units_sold,
            SUM(oi.price * oi.quantity) as revenue
           FROM vendor_products vp
           JOIN products p ON vp.product_id = p.product_id
           JOIN order_items oi ON p.product_id = oi.product_id
           JOIN orders o ON oi.order_id = o.order_id
           WHERE vp.vendor_id = ? AND o.status = 'completed'
           GROUP BY p.product_id, p.name
           ORDER BY revenue DESC
           LIMIT 1`,
          [vendorId]
        );
        return (rows as any[])[0];
      },

      // Recent activity
      recentActivity: async () => {
        const [rows] = await pool.execute(
          `(SELECT 
            o.order_id as activity_id,
            'order' as type,
            CONCAT('New Order #', o.order_number) as title,
            CONCAT('Order from ', u.first_name, ' ', u.last_name) as description,
            o.total_amount as amount,
            o.status as status,
            o.created_at,
            JSON_OBJECT('order_id', o.order_id, 'customer_name', CONCAT(u.first_name, ' ', u.last_name)) as metadata
           FROM orders o
           JOIN users u ON o.user_id = u.user_id
           JOIN order_items oi ON o.order_id = oi.order_id
           JOIN vendor_products vp ON oi.product_id = vp.product_id
           WHERE vp.vendor_id = ?
           ORDER BY o.created_at DESC
           LIMIT 5)
          UNION ALL
          (SELECT 
            p.product_id as activity_id,
            'product' as type,
            CONCAT('Product Updated: ', p.name) as title,
            'Product information was updated' as description,
            p.base_price as amount,
            CASE WHEN p.is_active = 1 THEN 'active' ELSE 'inactive' END as status,
            p.updated_at as created_at,
            JSON_OBJECT('product_id', p.product_id, 'product_name', p.name) as metadata
           FROM products p
           JOIN vendor_products vp ON p.product_id = vp.product_id
           WHERE vp.vendor_id = ?
           ORDER BY p.updated_at DESC
           LIMIT 5)
          ORDER BY created_at DESC
          LIMIT 10`,
          [vendorId, vendorId]
        );
        return rows;
      },

      // Order summary
      orderSummary: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.order_id END) as pending_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'processing' THEN o.order_id END) as processing_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.order_id END) as shipped_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as completed_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.order_id END) as cancelled_orders,
            AVG(TIMESTAMPDIFF(HOUR, o.created_at, COALESCE(o.shipped_at, NOW()))) as avg_fulfillment_time
           FROM orders o
           JOIN order_items oi ON o.order_id = oi.order_id
           JOIN vendor_products vp ON oi.product_id = vp.product_id
           WHERE vp.vendor_id = ?`,
          [vendorId]
        );
        return (rows as any[])[0];
      },

      // Sales team (if exists)
      salesTeam: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            ss.sales_staff_id as sales_rep_id,
            u.first_name, u.last_name, u.email,
            ss.total_sales,
            COALESCE(ss.total_sales * ss.commission_rate / 100, 0) as commission_earned,
            COUNT(DISTINCT l.lead_id) as active_leads,
            CASE 
              WHEN COUNT(DISTINCT l.lead_id) > 0 
              THEN (COUNT(DISTINCT CASE WHEN l.status = 'converted' THEN l.lead_id END) / COUNT(DISTINCT l.lead_id) * 100)
              ELSE 0 
            END as conversion_rate
           FROM sales_staff ss
           JOIN users u ON ss.user_id = u.user_id
           LEFT JOIN leads l ON ss.sales_staff_id = l.assigned_to
           WHERE ss.vendor_id = ?
           GROUP BY ss.sales_staff_id, u.first_name, u.last_name, u.email`,
          [vendorId]
        );
        return rows;
      },

      // Commission data
      commissionData: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            vi.commission_rate,
            COALESCE(SUM(oi.price * oi.quantity * vi.commission_rate / 100), 0) as commission_earned,
            COALESCE(SUM(CASE WHEN vp.payout_status = 'pending' THEN oi.price * oi.quantity * vi.commission_rate / 100 ELSE 0 END), 0) as pending_commission,
            MAX(vp.payout_date) as last_payout_date,
            COALESCE(MAX(vp.payout_amount), 0) as last_payout_amount
           FROM vendor_info vi
           LEFT JOIN vendor_products vpr ON vi.vendor_info_id = vpr.vendor_id
           LEFT JOIN order_items oi ON vpr.product_id = oi.product_id
           LEFT JOIN orders o ON oi.order_id = o.order_id
           LEFT JOIN vendor_payouts vp ON vi.vendor_info_id = vp.vendor_id
           WHERE vi.vendor_info_id = ? AND o.status = 'completed'
           GROUP BY vi.vendor_info_id, vi.commission_rate`,
          [vendorId]
        );
        return (rows as any[])[0];
      }
    });

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(results);
    
    // Generate alerts
    const alerts = this.generateVendorAlerts(results, vendorId);
    
    // Calculate financial summary
    const financial = this.calculateFinancialSummary(results);

    return {
      vendor_info: {
        vendor_info_id: results.vendorInfo.vendor_info_id,
        business_name: results.vendorInfo.business_name,
        business_email: results.vendorInfo.business_email,
        commission_rate: results.vendorInfo.commission_rate,
        is_active: !!results.vendorInfo.is_active,
        is_approved: !!results.vendorInfo.is_approved,
        rating: parseFloat(results.vendorInfo.rating) || 0,
        total_reviews: results.vendorInfo.total_reviews || 0,
        created_at: results.vendorInfo.created_at
      },
      
      sales_metrics: {
        total_revenue: parseFloat(results.salesMetrics.total_revenue) || 0,
        monthly_revenue: parseFloat(results.salesMetrics.monthly_revenue) || 0,
        weekly_revenue: parseFloat(results.salesMetrics.weekly_revenue) || 0,
        total_orders: results.salesMetrics.total_orders || 0,
        monthly_orders: results.salesMetrics.monthly_orders || 0,
        avg_order_value: parseFloat(results.salesMetrics.avg_order_value) || 0,
        commission_earned: parseFloat(results.commissionData?.commission_earned) || 0,
        pending_commission: parseFloat(results.commissionData?.pending_commission) || 0,
        last_payout_date: results.commissionData?.last_payout_date,
        next_payout_estimate: parseFloat(results.commissionData?.pending_commission) || 0
      },
      
      product_metrics: {
        total_products: results.productMetrics.total_products || 0,
        active_products: results.productMetrics.active_products || 0,
        pending_approval: results.productMetrics.pending_approval || 0,
        low_stock_count: results.productMetrics.low_stock_count || 0,
        out_of_stock_count: results.productMetrics.out_of_stock_count || 0,
        best_selling_product: results.bestSellingProduct ? {
          product_id: results.bestSellingProduct.product_id,
          name: results.bestSellingProduct.name,
          units_sold: results.bestSellingProduct.units_sold,
          revenue: parseFloat(results.bestSellingProduct.revenue)
        } : undefined
      },
      
      recent_activity: (results.recentActivity as any[]).map(activity => ({
        activity_id: activity.activity_id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        amount: activity.amount ? parseFloat(activity.amount) : undefined,
        status: activity.status,
        created_at: activity.created_at,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : undefined
      })),
      
      order_summary: {
        pending_orders: results.orderSummary.pending_orders || 0,
        processing_orders: results.orderSummary.processing_orders || 0,
        shipped_orders: results.orderSummary.shipped_orders || 0,
        completed_orders: results.orderSummary.completed_orders || 0,
        cancelled_orders: results.orderSummary.cancelled_orders || 0,
        return_rate: results.orderSummary.cancelled_orders > 0 ? 
          (results.orderSummary.cancelled_orders / results.salesMetrics.total_orders * 100) : 0,
        avg_fulfillment_time: parseFloat(results.orderSummary.avg_fulfillment_time) || 0
      },
      
      sales_team: results.salesTeam?.length > 0 ? (results.salesTeam as any[]).map(rep => ({
        sales_rep_id: rep.sales_rep_id,
        first_name: rep.first_name,
        last_name: rep.last_name,
        email: rep.email,
        total_sales: parseFloat(rep.total_sales) || 0,
        commission_earned: parseFloat(rep.commission_earned) || 0,
        active_leads: rep.active_leads || 0,
        conversion_rate: parseFloat(rep.conversion_rate) || 0
      })) : undefined,
      
      performance,
      financial,
      alerts,
      
      quick_actions: [
        'add_product',
        'view_orders',
        'update_inventory',
        'manage_sales_team',
        'request_payout',
        'view_analytics'
      ]
    };
  }

  private parseDateRange(dateRange: string): { startDate: string; endDate: string } {
    const endDate = new Date().toISOString().split('T')[0];
    let startDate: string;
    
    switch (dateRange) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    return { startDate, endDate };
  }

  private calculatePerformanceMetrics(data: any): VendorDashboardData['performance'] {
    // Calculate monthly growth from sales data
    const currentMonthRevenue = parseFloat(data.salesMetrics?.monthly_revenue) || 0;
    const totalRevenue = parseFloat(data.salesMetrics?.total_revenue) || 0;
    const avgMonthlyRevenue = data.salesMetrics?.total_orders > 0 ? 
      (totalRevenue / Math.max(3, data.salesMetrics.total_orders / 10)) : 0;
    const monthlyGrowth = avgMonthlyRevenue > 0 ? 
      ((currentMonthRevenue - avgMonthlyRevenue) / avgMonthlyRevenue * 100) : 0;

    // Calculate on-time delivery rate from order summary
    const shippedOrders = data.orderSummary?.shipped_orders || 0;
    const completedOrders = data.orderSummary?.completed_orders || 0;
    const avgFulfillmentTime = parseFloat(data.orderSummary?.avg_fulfillment_time) || 0;
    const onTimeDeliveryRate = shippedOrders + completedOrders > 0 ? 
      (avgFulfillmentTime <= 48 ? 95 : avgFulfillmentTime <= 72 ? 85 : 75) : 0;

    // Calculate inventory turnover from product metrics
    const soldProducts = data.bestSellingProduct?.units_sold || 0;
    const totalProducts = data.productMetrics?.total_products || 1;
    const activeProducts = data.productMetrics?.active_products || 1;
    const inventoryTurnover = activeProducts > 0 ? 
      (soldProducts / activeProducts * 12) : 0; // Annualized

    // Calculate profit margin from commission and revenue
    const grossRevenue = parseFloat(data.salesMetrics?.total_revenue) || 0;
    const commission = parseFloat(data.commissionData?.commission_earned) || 0;
    const netRevenue = grossRevenue - commission;
    const profitMargin = grossRevenue > 0 ? 
      (netRevenue / grossRevenue * 100) : 0;

    return {
      monthly_growth: Math.round(monthlyGrowth * 10) / 10,
      customer_satisfaction: parseFloat(data.vendorInfo?.rating) || 0,
      return_rate: data.orderSummary?.cancelled_orders > 0 ? 
        Math.round(data.orderSummary.cancelled_orders / data.salesMetrics.total_orders * 1000) / 10 : 0,
      on_time_delivery_rate: Math.round(onTimeDeliveryRate * 10) / 10,
      inventory_turnover: Math.round(inventoryTurnover * 10) / 10,
      profit_margin: Math.round(profitMargin * 10) / 10
    };
  }

  private generateVendorAlerts(data: any, vendorId: number): VendorDashboardData['alerts'] {
    const alerts: VendorDashboardData['alerts'] = [];
    
    // Low stock alert
    if (data.productMetrics?.low_stock_count > 0) {
      alerts.push({
        alert_id: 1,
        type: 'warning',
        priority: 'medium',
        title: 'Low Stock Alert',
        message: `${data.productMetrics.low_stock_count} products are running low on stock`,
        action_required: true,
        created_at: new Date().toISOString()
      });
    }
    
    // Pending approval alert
    if (data.productMetrics?.pending_approval > 0) {
      alerts.push({
        alert_id: 2,
        type: 'info',
        priority: 'medium',
        title: 'Products Pending Approval',
        message: `${data.productMetrics.pending_approval} products are waiting for admin approval`,
        action_required: false,
        created_at: new Date().toISOString()
      });
    }
    
    // Payout available alert
    if (data.commissionData?.pending_commission > 100) {
      alerts.push({
        alert_id: 3,
        type: 'success',
        priority: 'high',
        title: 'Payout Available',
        message: `$${data.commissionData.pending_commission.toFixed(2)} commission is ready for payout`,
        action_required: true,
        created_at: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  private calculateFinancialSummary(data: any): VendorDashboardData['financial'] {
    const grossRevenue = parseFloat(data.salesMetrics?.total_revenue) || 0;
    const commissionRate = parseFloat(data.vendorInfo?.commission_rate) || 0;
    const netRevenue = grossRevenue * (commissionRate / 100);
    
    return {
      gross_revenue: grossRevenue,
      net_revenue: netRevenue,
      outstanding_balance: parseFloat(data.commissionData?.pending_commission) || 0,
      last_payout_amount: parseFloat(data.commissionData?.last_payout_amount) || 0,
      next_payout_date: this.calculateNextPayoutDate(),
      payment_method: this.formatPaymentMethod(data.vendorInfo?.payment_method || 'bank_transfer')
    };
  }

  private calculateNextPayoutDate(): string {
    // Calculate next monthly payout (typically 1st of next month)
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    return next.toISOString().split('T')[0];
  }

  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'bank_transfer': 'Bank Transfer',
      'paypal': 'PayPal',
      'check': 'Check',
      'stripe': 'Stripe Connect'
    };
    return methods[method] || 'Bank Transfer';
  }

  private async handleUpdateSettings(body: any, user: any) {
    const pool = await getPool();
    
    try {
      const updates: string[] = [];
      const values: any[] = [];

      const allowedFields = ['business_email', 'business_phone', 'business_website', 'notification_preferences'];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(field === 'notification_preferences' ? JSON.stringify(body[field]) : body[field]);
        }
      });

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(user.vendor_info_id);

        await pool.execute(
          `UPDATE vendor_info SET ${updates.join(', ')} WHERE vendor_info_id = ?`,
          values
        );
      }

      // Invalidate cache
      GlobalCaches.vendor.invalidateByPattern(`vendor:dashboard:${user.vendor_info_id}:*`);

      return this.successResponse({
        updated: true,
        message: 'Settings updated successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_vendor_settings',
        vendor_id: user.vendor_info_id 
      });
    }
  }

  private async handleDismissAlert(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['alert_id']);

    return this.successResponse({
      alert_id: body.alert_id,
      dismissed: true,
      message: 'Alert dismissed'
    });
  }

  private async handleRequestPayout(body: any, user: any) {
    const pool = await getPool();
    
    try {
      // Create payout request
      const [result] = await pool.execute(
        `INSERT INTO payout_requests (vendor_id, requested_amount, status, created_at)
         VALUES (?, ?, 'pending', NOW())`,
        [user.vendor_info_id, body.amount || 0]
      );

      return this.successResponse({
        payout_request_id: (result as any).insertId,
        requested: true,
        message: 'Payout request submitted successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'request_payout',
        vendor_id: user.vendor_info_id 
      });
    }
  }

  private async handleExportData(body: any, user: any) {
    const exportType = body.export_type || 'sales_report';
    const format = body.format || 'csv';
    const exportId = `vendor_export_${Date.now()}`;
    
    return this.successResponse({
      export_id: exportId,
      export_type: exportType,
      format,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
      download_url: `/api/vendor/exports/${exportId}`
    });
  }
}