/**
 * Vendor Orders Consolidated Handler
 * Replaces multiple vendor order management endpoints with comprehensive order operations
 */

import { NextRequest } from 'next/server';
import { ConsolidatedAPIHandler } from '@/lib/api/consolidation';
import { APIErrorHandler, APIErrorCode, ErrorUtils } from '@/lib/api/errorHandling';
import { GlobalCaches, CacheConfigs } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { getPool } from '@/lib/db';

export class VendorOrdersHandler extends ConsolidatedAPIHandler {
  constructor() {
    super('/api/vendor/orders');
  }

  async handleGET(req: NextRequest, user: any | null) {
    if (!user || !this.checkRole(user, 'VENDOR')) {
      throw APIErrorHandler.createAuthenticationError('forbidden');
    }

    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPaginationParams(searchParams);
    const orderId = this.sanitizeNumberParam(searchParams.get('order_id'));
    const include = searchParams.get('include')?.split(',') || [];
    
    if (orderId) {
      return this.handleGetSingleOrder(orderId, include, user);
    }
    
    const filters = {
      status: this.sanitizeStringParam(searchParams.get('status')),
      date_range: this.sanitizeStringParam(searchParams.get('date_range')),
      search: this.sanitizeStringParam(searchParams.get('search'))
    };

    try {
      const cacheKey = `vendor:orders:${user.vendor_info_id}:${page}:${limit}:${JSON.stringify(filters)}`;
      
      const result = await GlobalCaches.vendor.getOrSet(
        cacheKey,
        () => this.fetchVendorOrders(user.vendor_info_id, page, limit, offset, filters, include),
        CacheConfigs.realtime
      );

      MigrationTracker.recordEndpointUsage('/api/vendor/orders', 1);

      return this.successResponse(result.data, {
        cached: result.fromCache,
        cacheKey
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        vendor_id: user.vendor_info_id,
        filters
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

    const action = body.action || 'update_status';

    switch (action) {
      case 'update_status':
        return this.handleUpdateOrderStatus(body, user);
      case 'add_tracking':
        return this.handleAddTracking(body, user);
      case 'request_cancellation':
        return this.handleRequestCancellation(body, user);
      case 'export_orders':
        return this.handleExportOrders(body, user);
      default:
        throw APIErrorHandler.createValidationError('action', 'Invalid action type');
    }
  }

  // Private implementation methods

  private async handleGetSingleOrder(orderId: number, include: string[], user: any) {
    const cacheKey = `vendor:order:${orderId}:${user.vendor_info_id}:${include.join(',')}`;
    
    const result = await GlobalCaches.vendor.getOrSet(
      cacheKey,
      () => this.fetchSingleOrder(orderId, user.vendor_info_id, include),
      CacheConfigs.fast
    );

    return this.successResponse(result.data, {
      cached: result.fromCache
    });
  }

  private async fetchSingleOrder(orderId: number, vendorId: number, include: string[]) {
    const pool = await getPool();
    
    // Get vendor commission rate
    const [vendorInfo] = await pool.execute(
      'SELECT commission_rate FROM vendor_info WHERE vendor_info_id = ?',
      [vendorId]
    );
    const commissionRate = vendorInfo && (vendorInfo as any[])[0] ? 
      parseFloat((vendorInfo as any[])[0].commission_rate) / 100 : 0.15;
    
    const [orderRows] = await pool.execute(
      `SELECT 
        o.*,
        u.first_name, u.last_name, u.email, u.phone,
        sa.recipient_name, sa.address_line1, sa.city, sa.state, sa.zip_code
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN addresses sa ON o.shipping_address_id = sa.address_id
       WHERE o.order_id = ? AND EXISTS (
         SELECT 1 FROM order_items oi 
         JOIN vendor_products vp ON oi.product_id = vp.product_id 
         WHERE oi.order_id = o.order_id AND vp.vendor_id = ?
       )`,
      [orderId, vendorId]
    );

    if (!orderRows || (orderRows as any[]).length === 0) {
      throw APIErrorHandler.createError(APIErrorCode.RECORD_NOT_FOUND, 'Order not found');
    }

    const order = (orderRows as any[])[0];
    
    // Get vendor-specific order items
    const [itemRows] = await pool.execute(
      `SELECT 
        oi.*,
        p.name as product_name, p.sku as product_sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN vendor_products vp ON p.product_id = vp.product_id
       WHERE oi.order_id = ? AND vp.vendor_id = ?`,
      [orderId, vendorId]
    );

    const vendorItems = (itemRows as any[]).map(item => ({
      order_item_id: item.order_item_id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      total_price: parseFloat(item.price) * item.quantity,
      configuration: item.configuration ? JSON.parse(item.configuration) : null
    }));

    // Calculate vendor-specific totals
    const vendorSubtotal = vendorItems.reduce((sum, item) => sum + item.total_price, 0);

    return {
      order_id: order.order_id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      
      customer: {
        first_name: order.first_name,
        last_name: order.last_name,
        email: order.email,
        phone: order.phone
      },
      
      shipping_address: {
        recipient_name: order.recipient_name,
        address_line1: order.address_line1,
        city: order.city,
        state: order.state,
        zip_code: order.zip_code
      },
      
      vendor_items: vendorItems,
      vendor_subtotal: vendorSubtotal,
      vendor_commission: vendorSubtotal * commissionRate,
      
      fulfillment_status: order.fulfillment_status || 'pending',
      tracking_number: order.tracking_number,
      estimated_ship_date: order.estimated_ship_date
    };
  }

  private async fetchVendorOrders(
    vendorId: number,
    page: number,
    limit: number,
    offset: number,
    filters: any,
    include: string[]
  ) {
    const pool = await getPool();
    
    // Get vendor commission rate
    const [vendorInfo] = await pool.execute(
      'SELECT commission_rate FROM vendor_info WHERE vendor_info_id = ?',
      [vendorId]
    );
    const commissionRate = vendorInfo && (vendorInfo as any[])[0] ? 
      parseFloat((vendorInfo as any[])[0].commission_rate) / 100 : 0.15;
    
    const conditions: string[] = ['vp.vendor_id = ?'];
    const params: any[] = [vendorId];

    if (filters.status) {
      conditions.push('o.status = ?');
      params.push(filters.status);
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

    const results = await this.executeParallelQueries({
      orders: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            o.order_id, o.order_number, o.status, o.payment_status,
            o.total_amount, o.created_at, o.updated_at,
            u.first_name, u.last_name, u.email,
            COUNT(DISTINCT oi2.order_item_id) as vendor_items_count,
            SUM(oi2.price * oi2.quantity) as vendor_subtotal
           FROM orders o
           JOIN users u ON o.user_id = u.user_id
           JOIN order_items oi ON o.order_id = oi.order_id
           JOIN vendor_products vp ON oi.product_id = vp.product_id
           JOIN order_items oi2 ON o.order_id = oi2.order_id
           JOIN vendor_products vp2 ON oi2.product_id = vp2.product_id AND vp2.vendor_id = vp.vendor_id
           ${whereClause}
           GROUP BY o.order_id, o.order_number, o.status, o.payment_status,
                    o.total_amount, o.created_at, o.updated_at,
                    u.first_name, u.last_name, u.email
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
           JOIN order_items oi ON o.order_id = oi.order_id
           JOIN vendor_products vp ON oi.product_id = vp.product_id
           ${whereClause}`,
          params
        );
        return (rows as any[])[0].total;
      },

      summary: async () => {
        const [rows] = await pool.execute(
          `SELECT 
            COUNT(DISTINCT o.order_id) as total_orders,
            SUM(oi.price * oi.quantity) as total_revenue,
            COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.order_id END) as pending_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.order_id END) as shipped_orders
           FROM orders o
           JOIN order_items oi ON o.order_id = oi.order_id
           JOIN vendor_products vp ON oi.product_id = vp.product_id
           WHERE vp.vendor_id = ?`,
          [vendorId]
        );
        return (rows as any[])[0];
      }
    });

    const orders = (results.orders as any[]).map(order => ({
      order_id: order.order_id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      
      customer: {
        first_name: order.first_name,
        last_name: order.last_name,
        email: order.email
      },
      
      vendor_items_count: order.vendor_items_count,
      vendor_subtotal: parseFloat(order.vendor_subtotal) || 0,
      vendor_commission: (parseFloat(order.vendor_subtotal) || 0) * commissionRate
    }));

    const summary = results.summary || {};

    return {
      orders,
      pagination: this.buildPaginationInfo(page, limit, results.totalCount || 0),
      summary: {
        total_orders: summary.total_orders || 0,
        total_revenue: parseFloat(summary.total_revenue) || 0,
        pending_orders: summary.pending_orders || 0,
        shipped_orders: summary.shipped_orders || 0
      }
    };
  }

  private async handleUpdateOrderStatus(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'status']);

    const validStatuses = ['processing', 'shipped', 'delivered'];
    if (!validStatuses.includes(body.status)) {
      throw APIErrorHandler.createValidationError('status', `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const pool = await getPool();
    
    try {
      // Verify vendor has items in this order
      const [ownershipCheck] = await pool.execute(
        `SELECT o.order_id 
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN vendor_products vp ON oi.product_id = vp.product_id
         WHERE o.order_id = ? AND vp.vendor_id = ?`,
        [body.order_id, user.vendor_info_id]
      );

      if ((ownershipCheck as any[]).length === 0) {
        throw APIErrorHandler.createAuthenticationError('forbidden');
      }

      // Update order status
      await pool.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        [body.status, body.order_id]
      );

      // Invalidate caches
      this.invalidateOrderCaches(body.order_id, user.vendor_info_id);

      return this.successResponse({
        order_id: body.order_id,
        status: body.status,
        updated: true,
        message: `Order status updated to ${body.status}`
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'update_order_status',
        order_id: body.order_id
      });
    }
  }

  private async handleAddTracking(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'tracking_number']);

    const pool = await getPool();
    
    try {
      // Verify ownership and add tracking
      await pool.execute(
        `UPDATE orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         JOIN vendor_products vp ON oi.product_id = vp.product_id
         SET o.tracking_number = ?, o.status = 'shipped', o.shipped_at = NOW(), o.updated_at = NOW()
         WHERE o.order_id = ? AND vp.vendor_id = ?`,
        [body.tracking_number, body.order_id, user.vendor_info_id]
      );

      this.invalidateOrderCaches(body.order_id, user.vendor_info_id);

      return this.successResponse({
        order_id: body.order_id,
        tracking_number: body.tracking_number,
        status: 'shipped',
        message: 'Tracking number added and order marked as shipped'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'add_tracking',
        order_id: body.order_id
      });
    }
  }

  private async handleRequestCancellation(body: any, user: any) {
    ErrorUtils.validateRequiredFields(body, ['order_id', 'reason']);

    const pool = await getPool();
    
    try {
      // Create cancellation request
      const [result] = await pool.execute(
        `INSERT INTO order_cancellation_requests (order_id, vendor_id, reason, status, created_at)
         VALUES (?, ?, ?, 'pending', NOW())`,
        [body.order_id, user.vendor_info_id, body.reason]
      );

      return this.successResponse({
        cancellation_request_id: (result as any).insertId,
        order_id: body.order_id,
        requested: true,
        message: 'Cancellation request submitted for admin review'
      });

    } catch (error) {
      throw APIErrorHandler.createDatabaseError(error as Error, { 
        action: 'request_cancellation',
        order_id: body.order_id
      });
    }
  }

  private async handleExportOrders(body: any, user: any) {
    const format = body.format || 'csv';
    const exportId = `vendor_orders_export_${Date.now()}`;
    
    return this.successResponse({
      export_id: exportId,
      format,
      status: 'processing',
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
      download_url: `/api/vendor/exports/${exportId}`
    });
  }

  private invalidateOrderCaches(orderId: number, vendorId: number): void {
    GlobalCaches.vendor.invalidateByPattern(`vendor:order:${orderId}:${vendorId}:*`);
    GlobalCaches.vendor.invalidateByPattern(`vendor:orders:${vendorId}:*`);
  }
}