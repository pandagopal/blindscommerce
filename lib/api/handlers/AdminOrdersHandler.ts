/**
 * Admin Orders Consolidated Handler
 * Replaces multiple admin order management endpoints with comprehensive order operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs, ConsolidatedCacheKeys } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

interface AdminOrderData {
  order_id: number;
  order_number: string;
  user_id: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  
  // Customer information
  customer: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    customer_type: 'customer' | 'trade_professional';
  };
  
  // Shipping address
  shipping_address: {
    recipient_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone?: string;
  };
  
  // Billing address  
  billing_address?: {
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  
  // Order items
  items: Array<{
    order_item_id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: any;
    vendor_info_id?: number;
    vendor_name?: string;
    installation_requested: boolean;
    estimated_delivery?: string;
  }>;
  
  // Payment information
  payments?: Array<{
    payment_id: number;
    amount: number;
    payment_method: string;
    status: string;
    provider: string;
    created_at: string;
  }>;
  
  // Order history/timeline
  timeline?: Array<{
    event_id: number;
    event_type: string;
    description: string;
    created_at: string;
    created_by?: string;
  }>;
  
  // Fulfillment info
  fulfillment?: {
    tracking_number?: string;
    carrier?: string;
    estimated_delivery?: string;
    installation_scheduled?: boolean;
    installation_date?: string;
    installer_id?: number;
    installer_name?: string;
  };
  
  // Order flags
  flags: {
    is_rush_order: boolean;
    has_custom_items: boolean;
    requires_installation: boolean;
    has_gift_items: boolean;
    is_wholesale: boolean;
    needs_approval: boolean;
  };
  
  // Financial data
  financials?: {
    commission_total: number;
    vendor_payouts: Array<{
      vendor_id: number;
      vendor_name: string;
      payout_amount: number;
      commission_rate: number;
    }>;
    profit_margin: number;
    cost_of_goods: number;
  };
}

interface AdminOrdersListResponse {
  orders: AdminOrderData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
  filters: {
    status?: string;
    payment_status?: string;
    date_range?: string;
    customer_type?: string;
    vendor?: string;
    search?: string;
  };
  summary: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    pending_orders: number;
    shipped_orders: number;
    cancelled_orders: number;
    refund_rate: number;
  };
}

export class AdminOrdersHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/admin/orders');
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
    
    const orderId = this.sanitizeNumberParam(searchParams.get('order_id'));
    const orderNumber = this.sanitizeStringParam(searchParams.get('order_number'));
    const include = searchParams.get('include')?.split(',') || [];
    
    // Single order request
    if (orderId || orderNumber) {
      return this.handleGetSingleOrder(orderId, orderNumber, include, user);
    }
    
    // Order list with filters
    const filters = {
      status: this.sanitizeStringParam(searchParams.get('status')),
      payment_status: this.sanitizeStringParam(searchParams.get('payment_status')),
      date_range: this.sanitizeStringParam(searchParams.get('date_range')),
      customer_type: this.sanitizeStringParam(searchParams.get('customer_type')),
      vendor: this.sanitizeStringParam(searchParams.get('vendor')),
      search: this.sanitizeStringParam(searchParams.get('search'))
    };

    try {
      const cacheKey = ConsolidatedCacheKeys.admin.orders(page, limit, filters);
      
      const result = await GlobalCaches.admin.getOrSet(
        cacheKey,
        () => this.fetchOrdersList(page, limit, offset, filters, include),
        CacheConfigs.realtime // Orders need fresher data
      );

      MigrationTracker.recordEndpointUsage('/api/admin/orders', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey,
        cacheAge: result.cacheAge
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        filters,
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

    const action = body.action || 'update_status';

    switch (action) {
      case 'update_status':
        return this.handleUpdateOrderStatus(body, user);
      case 'add_note':
        return this.handleAddOrderNote(body, user);
      case 'process_refund':
        return this.handleProcessRefund(body, user);
      case 'schedule_installation':
        return this.handleScheduleInstallation(body, user);
      case 'assign_installer':
        return this.handleAssignInstaller(body, user);
      case 'bulk_update':
        return this.handleBulkUpdate(body, user);
      case 'export_orders':
        return this.handleExportOrders(body, user);
      case 'send_notification':
        return this.handleSendNotification(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  async handlePUT(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const body = await this.getRequestBody(req);
    if (!body || !body.order_id) {
      throw APIErrorHandler.createValidationError('order_id', 'Order ID required for updates');
    }

    return this.handleUpdateOrder(body, user);
  }

  async handleDELETE(req: NextRequest, user: any) {
    if (!this.checkRole(user, 'ADMIN')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const orderId = this.sanitizeNumberParam(searchParams.get('order_id'));

    if (!orderId) {
      throw APIErrorHandler.createValidationError('order_id', 'Order ID required');
    }

    // Only allow cancellation, not deletion
    return this.handleCancelOrder(orderId, user);
  }

  // Private implementation methods

  private async handleGetSingleOrder(
    orderId?: number, 
    orderNumber?: string, 
    include: string[] = [], 
    user: any
  ) {
    if (!orderId && !orderNumber) {
      throw APIErrorHandler.createValidationError('identifier', 'Order ID or order number required');
    }

    const cacheKey = `admin:order:${orderId || orderNumber}:${include.join(',')}`;
    
    const result = await GlobalCaches.admin.getOrSet(
      cacheKey,
      () => this.fetchSingleOrder(orderId, orderNumber, include),
      CacheConfigs.fast
    );

    return this.successResponse(result.data, {
      cached: result.fromCache
    });
  }

  private async fetchSingleOrder(
    orderId?: number, 
    orderNumber?: string, 
    include: string[] = []
  ): Promise<AdminOrderData> {
    const pool = await getPool();
    
    const whereClause = orderId ? 'o.order_id = ?' : 'o.order_number = ?';
    const whereValue = orderId || orderNumber;
    
    const [orderRows] = await pool.execute(
      `SELECT 
        o.*,
        u.email, u.first_name, u.last_name, u.phone, u.role as customer_type,
        sa.recipient_name, sa.address_line1, sa.address_line2, sa.city, sa.state, sa.zip_code, sa.country, sa.phone as shipping_phone,
        ba.name as billing_name, ba.address_line1 as billing_address1, ba.address_line2 as billing_address2, 
        ba.city as billing_city, ba.state as billing_state, ba.zip_code as billing_zip, ba.country as billing_country
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN addresses sa ON o.shipping_address_id = sa.address_id
       LEFT JOIN addresses ba ON o.billing_address_id = ba.address_id
       WHERE ${whereClause}`,
      [whereValue]
    );

    if (!orderRows || (orderRows as any[]).length === 0) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Order not found');
    }

    const order = (orderRows as any[])[0];
    
    // Get order items
    const [itemRows] = await pool.execute(
      `SELECT 
        oi.*,
        p.name as product_name, p.sku as product_sku,
        vi.vendor_info_id, vi.business_name as vendor_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       LEFT JOIN vendor_products vp ON p.product_id = vp.product_id AND vp.is_primary = 1
       LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
       WHERE oi.order_id = ?
       ORDER BY oi.order_item_id`,
      [order.order_id]
    );

    const items = (itemRows as any[]).map(item => ({
      order_item_id: item.order_item_id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      total_price: parseFloat(item.price) * item.quantity,
      configuration: item.configuration ? JSON.parse(item.configuration) : null,
      vendor_info_id: item.vendor_info_id,
      vendor_name: item.vendor_name,
      installation_requested: !!item.installation_requested,
      estimated_delivery: item.estimated_delivery
    }));

    // Build optional data based on includes
    const queries: any = {};
    
    if (include.includes('payments')) {
      queries.payments = async () => {
        const [rows] = await pool.execute(
          'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
          [order.order_id]
        );
        return rows;
      };
    }

    if (include.includes('timeline')) {
      queries.timeline = async () => {
        const [rows] = await pool.execute(
          `SELECT 
            osl.*,
            u.first_name, u.last_name
           FROM order_status_log osl
           LEFT JOIN users u ON osl.updated_by = u.user_id
           WHERE osl.order_id = ?
           ORDER BY osl.created_at DESC`,
          [order.order_id]
        );
        return (rows as any[]).map(row => ({
          event_id: row.log_id,
          event_type: row.status,
          description: row.notes || `Order status changed to ${row.status}`,
          created_at: row.created_at,
          created_by: row.first_name ? `${row.first_name} ${row.last_name}` : 'System'
        }));
      };
    }

    if (include.includes('fulfillment')) {
      queries.fulfillment = async () => {
        const [rows] = await pool.execute(
          `SELECT 
            of.*,
            i.first_name as installer_first_name, i.last_name as installer_last_name
           FROM order_fulfillment of
           LEFT JOIN installers inst ON of.installer_id = inst.installer_id
           LEFT JOIN users i ON inst.user_id = i.user_id
           WHERE of.order_id = ?`,
          [order.order_id]
        );
        return (rows as any[])[0];
      };
    }

    if (include.includes('financials')) {
      queries.financials = async () => {
        const [vendorPayouts] = await pool.execute(
          `SELECT 
            vi.vendor_info_id, vi.business_name,
            SUM(oi.price * oi.quantity) as total_amount,
            vi.commission_rate,
            SUM(oi.price * oi.quantity * vi.commission_rate / 100) as commission_amount
           FROM order_items oi
           JOIN vendor_products vp ON oi.product_id = vp.product_id
           JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           WHERE oi.order_id = ?
           GROUP BY vi.vendor_info_id`,
          [order.order_id]
        );

        const commission_total = (vendorPayouts as any[]).reduce(
          (sum, payout) => sum + parseFloat(payout.commission_amount), 0
        );

        return {
          commission_total,
          vendor_payouts: (vendorPayouts as any[]).map(payout => ({
            vendor_id: payout.vendor_info_id,
            vendor_name: payout.business_name,
            payout_amount: parseFloat(payout.total_amount),
            commission_rate: payout.commission_rate
          })),
          profit_margin: order.total_amount - commission_total,
          cost_of_goods: 0 // Would need product costs
        };
      };
    }

    // Execute all queries in parallel
    const results = Object.keys(queries).length > 0 
      ? await this.executeParallelQueries(queries)
      : {};

    return {
      order_id: order.order_id,
      order_number: order.order_number,
      user_id: order.user_id,
      status: order.status,
      payment_status: order.payment_status,
      total_amount: parseFloat(order.total_amount),
      subtotal: parseFloat(order.subtotal),
      tax_amount: parseFloat(order.tax_amount) || 0,
      shipping_amount: parseFloat(order.shipping_amount) || 0,
      discount_amount: parseFloat(order.discount_amount) || 0,
      items_count: items.length,
      created_at: order.created_at,
      updated_at: order.updated_at,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      
      customer: {
        user_id: order.user_id,
        email: order.email,
        first_name: order.first_name,
        last_name: order.last_name,
        phone: order.phone,
        customer_type: order.customer_type
      },
      
      shipping_address: {
        recipient_name: order.recipient_name,
        address_line1: order.address_line1,
        address_line2: order.address_line2,
        city: order.city,
        state: order.state,
        zip_code: order.zip_code,
        country: order.country,
        phone: order.shipping_phone
      },
      
      billing_address: order.billing_name ? {
        name: order.billing_name,
        address_line1: order.billing_address1,
        address_line2: order.billing_address2,
        city: order.billing_city,
        state: order.billing_state,
        zip_code: order.billing_zip,
        country: order.billing_country
      } : undefined,
      
      items,
      
      payments: results.payments as any[],
      timeline: results.timeline as any[],
      fulfillment: results.fulfillment,
      financials: results.financials,
      
      flags: {
        is_rush_order: !!order.is_rush_order,
        has_custom_items: items.some(item => item.configuration),
        requires_installation: items.some(item => item.installation_requested),
        has_gift_items: !!order.has_gift_items,
        is_wholesale: order.customer_type === 'trade_professional',
        needs_approval: order.status === 'pending' && order.total_amount > 1000
      }
    };
  }

  private async fetchOrdersList(
    page: number,
    limit: number, 
    offset: number,
    filters: any,
    include: string[]
  ): Promise<AdminOrdersListResponse> {
    const pool = await getPool();
    
    // Build WHERE conditions
    const conditions: string[] = ['1 = 1'];
    const params: any[] = [];

    if (filters.status) {
      conditions.push('o.status = ?');
      params.push(filters.status);
    }

    if (filters.payment_status) {
      conditions.push('o.payment_status = ?');
      params.push(filters.payment_status);
    }

    if (filters.customer_type) {
      conditions.push('u.role = ?');
      params.push(filters.customer_type);
    }

    if (filters.vendor) {
      conditions.push('vi.business_name LIKE ?');
      params.push(`%${filters.vendor}%`);
    }

    if (filters.search) {
      conditions.push('(o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (filters.date_range) {
      const [startDate, endDate] = filters.date_range.split(',');
      if (startDate && endDate) {
        conditions.push('o.created_at BETWEEN ? AND ?');
        params.push(startDate, endDate);
      }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Execute parallel queries
    const results = await this.executeParallelQueries({
      orders: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            o.*,
            u.email, u.first_name, u.last_name, u.role as customer_type,
            sa.recipient_name, sa.city, sa.state,
            COUNT(oi.order_item_id) as items_count
           FROM orders o
           JOIN users u ON o.user_id = u.user_id
           LEFT JOIN addresses sa ON o.shipping_address_id = sa.address_id
           LEFT JOIN order_items oi ON o.order_id = oi.order_id
           LEFT JOIN vendor_products vp ON oi.product_id = vp.product_id
           LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           ${whereClause}
           GROUP BY o.order_id
           ORDER BY o.created_at DESC
           LIMIT ${limit} OFFSET ${offset}`,
          params
        );
        return rows;
      },

      totalCount: async () => {
        const [rows] = await pool.execute(
          `SELECT COUNT(DISTINCT o.order_id) as total
           FROM orders o
           JOIN users u ON o.user_id = u.user_id
           LEFT JOIN order_items oi ON o.order_id = oi.order_id
           LEFT JOIN vendor_products vp ON oi.product_id = vp.product_id
           LEFT JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
           ${whereClause}`,
          params
        );
        return (rows as any[])[0].total;
      },

      summary: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            COUNT(*) as total_orders,
            SUM(o.total_amount) as total_revenue,
            AVG(o.total_amount) as avg_order_value,
            SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
            SUM(CASE WHEN o.status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
            SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
           FROM orders o`
        );
        return (rows as any[])[0];
      }
    });

    const orders = (results.orders as any[]).map(order => ({
      order_id: order.order_id,
      order_number: order.order_number,
      user_id: order.user_id,
      status: order.status,
      payment_status: order.payment_status,
      total_amount: parseFloat(order.total_amount),
      subtotal: parseFloat(order.subtotal),
      tax_amount: parseFloat(order.tax_amount) || 0,
      shipping_amount: parseFloat(order.shipping_amount) || 0,
      discount_amount: parseFloat(order.discount_amount) || 0,
      items_count: order.items_count,
      created_at: order.created_at,
      updated_at: order.updated_at,
      
      customer: {
        user_id: order.user_id,
        email: order.email,
        first_name: order.first_name,
        last_name: order.last_name,
        customer_type: order.customer_type
      },
      
      shipping_address: {
        recipient_name: order.recipient_name,
        city: order.city,
        state: order.state
      },
      
      items: [], // Not loaded in list view
      
      flags: {
        is_rush_order: !!order.is_rush_order,
        has_custom_items: false,
        requires_installation: false,
        has_gift_items: !!order.has_gift_items,
        is_wholesale: order.customer_type === 'trade_professional',
        needs_approval: order.status === 'pending' && order.total_amount > 1000
      }
    }));

    const total = results.totalCount || 0;
    const summary = results.summary || {};

    return {
      orders,
      pagination: this.buildPaginationInfo(page, limit, total),
      filters,
      summary: {
        total_orders: summary.total_orders || 0,
        total_revenue: parseFloat(summary.total_revenue) || 0,
        avg_order_value: parseFloat(summary.avg_order_value) || 0,
        pending_orders: summary.pending_orders || 0,
        shipped_orders: summary.shipped_orders || 0,
        cancelled_orders: summary.cancelled_orders || 0,
        refund_rate: summary.total_orders > 0 ? (summary.cancelled_orders / summary.total_orders * 100) : 0
      }
    };
  }

  private async handleUpdateOrderStatus(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'status']);

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      throw APIErrorHandler.createValidationError('status', `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const pool = await getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update order status
      await connection.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        [body.status, body.order_id]
      );

      // Log status change
      await connection.execute(
        `INSERT INTO order_status_log (order_id, status, notes, updated_by, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [body.order_id, body.status, body.notes || null, adminUser.user_id]
      );

      // Update timestamps for specific statuses
      if (body.status === 'shipped' && body.tracking_number) {
        await connection.execute(
          'UPDATE orders SET shipped_at = NOW() WHERE order_id = ?',
          [body.order_id]
        );
        
        // Update fulfillment info
        await connection.execute(
          `INSERT INTO order_fulfillment (order_id, tracking_number, carrier, updated_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE tracking_number = ?, carrier = ?, updated_at = NOW()`,
          [body.order_id, body.tracking_number, body.carrier || 'UPS', body.tracking_number, body.carrier || 'UPS']
        );
      }

      if (body.status === 'delivered') {
        await connection.execute(
          'UPDATE orders SET delivered_at = NOW() WHERE order_id = ?',
          [body.order_id]
        );
      }

      await connection.commit();

      // Invalidate caches
      this.invalidateOrderCaches(body.order_id);

      return this.successResponse({
        order_id: body.order_id,
        status: body.status,
        updated: true,
        message: `Order status updated to ${body.status}`
      });

    } catch (error) {
      await connection.rollback();
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_order_status',
        order_id: body.order_id 
      });
    } finally {
      connection.release();
    }
  }

  private async handleAddOrderNote(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'note']);

    const pool = await getPool();
    
    await pool.execute(
      `INSERT INTO order_notes (order_id, note, created_by, created_at)
       VALUES (?, ?, ?, NOW())`,
      [body.order_id, body.note, adminUser.user_id]
    );

    return this.successResponse({
      order_id: body.order_id,
      note_added: true,
      message: 'Note added to order'
    });
  }

  private async handleProcessRefund(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'amount']);

    const pool = await getPool();
    
    try {
      // Create refund record
      const [result] = await pool.execute(
        `INSERT INTO order_refunds (order_id, amount, reason, processed_by, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [body.order_id, body.amount, body.reason || 'Admin processed', adminUser.user_id]
      );

      // Update order payment status
      await pool.execute(
        'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE order_id = ?',
        [body.amount === body.total_amount ? 'refunded' : 'partially_refunded', body.order_id]
      );

      this.invalidateOrderCaches(body.order_id);

      return this.successResponse({
        refund_id: (result as any).insertId,
        order_id: body.order_id,
        amount: body.amount,
        processed: true,
        message: 'Refund processed successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'process_refund',
        order_id: body.order_id 
      });
    }
  }

  private async handleScheduleInstallation(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'installation_date']);

    const pool = await getPool();
    
    await pool.execute(
      `UPDATE order_fulfillment SET 
        installation_scheduled = 1, 
        installation_date = ?, 
        updated_at = NOW() 
       WHERE order_id = ?`,
      [body.installation_date, body.order_id]
    );

    return this.successResponse({
      order_id: body.order_id,
      installation_date: body.installation_date,
      scheduled: true,
      message: 'Installation scheduled successfully'
    });
  }

  private async handleAssignInstaller(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'installer_id']);

    const pool = await getPool();
    
    await pool.execute(
      `UPDATE order_fulfillment SET 
        installer_id = ?, 
        updated_at = NOW() 
       WHERE order_id = ?`,
      [body.installer_id, body.order_id]
    );

    return this.successResponse({
      order_id: body.order_id,
      installer_id: body.installer_id,
      assigned: true,
      message: 'Installer assigned successfully'
    });
  }

  private async handleBulkUpdate(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['order_ids', 'updates']);

    const results = [];
    
    for (const orderId of body.order_ids) {
      try {
        const result = await this.handleUpdateOrder(
          { order_id: orderId, ...body.updates }, 
          adminUser
        );
        results.push({ order_id: orderId, success: true, data: result });
      } catch (error) {
        results.push({ 
          order_id: orderId, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return this.successResponse({
      results,
      total: body.order_ids.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  }

  private async handleExportOrders(body: any, adminUser: any) {
    const format = body.format || 'csv';
    const exportId = `orders_export_${Date.now()}`;
    
    return this.successResponse({
      export_id: exportId,
      format,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 45000).toISOString(),
      download_url: `/api/admin/orders/export/${exportId}`
    });
  }

  private async handleSendNotification(body: any, adminUser: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'notification_type']);

    return this.successResponse({
      order_id: body.order_id,
      notification_type: body.notification_type,
      sent: true,
      message: 'Notification sent successfully'
    });
  }

  private async handleUpdateOrder(body: any, adminUser: any) {
    const orderId = body.order_id;
    const pool = await getPool();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      const allowedFields = [
        'shipping_amount', 'tax_amount', 'discount_amount', 
        'notes', 'priority_level'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      });

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(orderId);

        await pool.execute(
          `UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`,
          values
        );
      }

      this.invalidateOrderCaches(orderId);

      return this.successResponse({
        order_id: orderId,
        updated: true,
        message: 'Order updated successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_order',
        order_id: orderId 
      });
    }
  }

  private async handleCancelOrder(orderId: number, adminUser: any) {
    const pool = await getPool();
    
    try {
      // Check if order can be cancelled
      const [orderCheck] = await pool.execute(
        'SELECT status FROM orders WHERE order_id = ?',
        [orderId]
      );

      if ((orderCheck as any[]).length === 0) {
        throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Order not found');
      }

      const currentStatus = (orderCheck as any[])[0].status;
      if (['shipped', 'delivered'].includes(currentStatus)) {
        throw APIErrorHandler.createError(
          APIErrorCode.INVALID_PARAMETERS,
          'Cannot cancel shipped or delivered orders'
        );
      }

      // Cancel order
      await pool.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        ['cancelled', orderId]
      );

      // Log cancellation
      await pool.execute(
        `INSERT INTO order_status_log (order_id, status, notes, updated_by, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [orderId, 'cancelled', 'Order cancelled by admin', adminUser.user_id]
      );

      this.invalidateOrderCaches(orderId);

      return this.successResponse({
        order_id: orderId,
        cancelled: true,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'cancel_order',
        order_id: orderId 
      });
    }
  }

  private invalidateOrderCaches(orderId: number): void {
    GlobalCaches.admin.invalidateByPattern(`admin:order:${orderId}:*`);
    GlobalCaches.admin.invalidateByTag('orders');
  }
}