/**
 * Order Service for BlindsCommerce
 * Handles all order-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '@/lib/db';
import { parseArrayPrices, parseDecimal, parsePriceFields } from '@/lib/utils/priceUtils';
import { randomBytes } from 'crypto';

interface Order extends RowDataPacket {
  order_id: number;
  order_number: string;
  user_id: number;
  status: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  currency: string;
  payment_method?: string;
  payment_status?: string;
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderItem extends RowDataPacket {
  order_item_id: number;
  order_id: number;
  product_id: number;
  vendor_id: number;
  quantity: number;
  price: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  configuration?: any;
}

interface OrderWithDetails extends Order {
  items: Array<OrderItem & {
    product_name: string;
    product_sku: string;
    product_image: string;
    vendor_name: string;
  }>;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
}

interface OrderCreationData {
  user_id: number;
  items: Array<{
    product_id: number;
    vendor_id: number;
    quantity: number;
    price: number;
    discount_amount?: number;
    tax_amount?: number;
    configuration?: any;
  }>;
  shipping_address: any;
  billing_address: any;
  payment_method: string;
  notes?: string;
  coupon_codes?: string[];
}

export class OrderService extends BaseService {
  constructor() {
    super('orders', 'order_id');
  }

  /**
   * Create a new order with all items in a single transaction
   * For multi-vendor carts, this will create separate orders for each vendor
   */
  async createOrder(data: OrderCreationData): Promise<OrderWithDetails | null> {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Calculate totals
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      for (const item of data.items) {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        totalDiscount += item.discount_amount || 0;
        totalTax += item.tax_amount || 0;
      }

      const shippingAmount = 0; // Calculate based on business rules
      const totalAmount = subtotal - totalDiscount + totalTax + shippingAmount;

      // Generate order number
      const randomSuffix = randomBytes(5).toString('hex').toUpperCase();
      const orderNumber = `ORD-${Date.now()}-${randomSuffix}`;

      // Create shipping address
      const [shippingAddressResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO user_shipping_addresses (
          user_id, address_name, first_name, last_name, address_line_1, address_line_2, 
          city, state_province, postal_code, country, phone, email, is_default, 
          is_billing_address, created_at, updated_at
        ) VALUES (?, 'Order Address', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
        [
          data.user_id,
          data.shipping_address.firstName || '',
          data.shipping_address.lastName || '',
          data.shipping_address.street || data.shipping_address.address,
          data.shipping_address.apt || data.shipping_address.apartment || '',
          data.shipping_address.city,
          data.shipping_address.state,
          data.shipping_address.zipCode || data.shipping_address.postal_code,
          data.shipping_address.country || 'US',
          data.shipping_address.phone || '',
          data.shipping_address.email || ''
        ]
      );

      // Create billing address (if different from shipping)
      let billingAddressId = shippingAddressResult.insertId;
      if (JSON.stringify(data.shipping_address) !== JSON.stringify(data.billing_address)) {
        const [billingAddressResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO user_shipping_addresses (
            user_id, address_name, first_name, last_name, address_line_1, address_line_2, 
            city, state_province, postal_code, country, phone, email, is_default, 
            is_billing_address, created_at, updated_at
          ) VALUES (?, 'Billing Address', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, NOW(), NOW())`,
          [
            data.user_id,
            data.billing_address.firstName || data.shipping_address.firstName || '',
            data.billing_address.lastName || data.shipping_address.lastName || '',
            data.billing_address.street || data.billing_address.address,
            data.billing_address.apt || data.billing_address.apartment || '',
            data.billing_address.city,
            data.billing_address.state,
            data.billing_address.zipCode || data.billing_address.postal_code,
            data.billing_address.country || 'US',
            data.billing_address.phone || data.shipping_address.phone || '',
            data.billing_address.email || data.shipping_address.email || ''
          ]
        );
        billingAddressId = billingAddressResult.insertId;
      }

      // Create order
      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, user_id, status, total_amount, subtotal,
          tax_amount, shipping_amount, discount_amount, currency,
          payment_method, payment_status, shipping_address_id, billing_address_id,
          notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderNumber,
          data.user_id,
          'pending',
          totalAmount,
          subtotal,
          totalTax,
          shippingAmount,
          totalDiscount,
          'USD',
          data.payment_method,
          'pending',
          shippingAddressResult.insertId,
          billingAddressId,
          data.notes || null
        ]
      );

      const orderId = orderResult.insertId;

      // Create order items
      const itemValues = data.items.map(item => [
        orderId,
        item.product_id,
        item.vendor_id,
        item.quantity,
        item.price,
        (item.price * item.quantity),
        item.discount_amount || 0,
        item.tax_amount || 0,
        JSON.stringify(item.configuration || {})
      ]);

      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, vendor_id, quantity, unit_price,
          total_price, discount_amount, tax_amount, product_options
        ) VALUES ?`,
        [itemValues]
      );

      // Update coupon usage if applicable
      if (data.coupon_codes && data.coupon_codes.length > 0) {
        const couponPlaceholders = data.coupon_codes.map(() => '?').join(',');
        await connection.execute(
          `UPDATE vendor_coupons 
           SET usage_count = usage_count + 1 
           WHERE code IN (${couponPlaceholders})`,
          data.coupon_codes
        );
      }

      // TODO: Create vendor commission records after order items are created
      // This requires fetching the order_item_ids after insertion

      await connection.commit();

      // Return the created order with details
      return this.getOrderWithDetails(orderId);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get order with all details in a single optimized query
   */
  async getOrderWithDetails(orderId: number): Promise<OrderWithDetails | null> {
    // Get order and customer info
    const orderQuery = `
      SELECT 
        o.*,
        u.email as customer_email,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone as customer_phone,
        (SELECT COALESCE(SUM(oi2.total_price), 0) 
         FROM order_items oi2 
         WHERE oi2.order_id = o.order_id) as vendor_items_total,
        -- Shipping address details
        sa.first_name as shipping_first_name,
        sa.last_name as shipping_last_name,
        sa.address_line_1 as shipping_address_line_1,
        sa.address_line_2 as shipping_address_line_2,
        sa.city as shipping_city,
        sa.state_province as shipping_state,
        sa.postal_code as shipping_postal_code,
        sa.country as shipping_country,
        sa.phone as shipping_phone,
        sa.email as shipping_email,
        -- Billing address details (for fallback when shipping same as billing)
        ba.first_name as billing_first_name,
        ba.last_name as billing_last_name,
        ba.address_line_1 as billing_address_line_1,
        ba.address_line_2 as billing_address_line_2,
        ba.city as billing_city,
        ba.state_province as billing_state,
        ba.postal_code as billing_postal_code,
        ba.country as billing_country,
        ba.phone as billing_phone,
        ba.email as billing_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN user_shipping_addresses sa ON o.shipping_address_id = sa.address_id
      LEFT JOIN user_shipping_addresses ba ON o.billing_address_id = ba.address_id
      WHERE o.order_id = ?
      LIMIT 1
    `;

    const [rawOrder] = await this.executeQuery<OrderWithDetails>(orderQuery, [orderId]);
    
    if (!rawOrder) return null;
    
    const order = parsePriceFields(rawOrder, [
      'total_amount', 'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount', 'vendor_items_total'
    ]);

    // Get order items with product and vendor details
    const itemsQuery = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku,
        p.primary_image_url as product_image,
        vi.business_name as vendor_name
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN vendor_info vi ON oi.vendor_id = vi.vendor_info_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id
    `;

    const items = await this.executeQuery<any>(itemsQuery, [orderId]);
    
    // Parse price fields for each item
    order.items = parseArrayPrices(items, ['unit_price', 'total_price']);
    
    return order;
  }

  /**
   * Get order with vendor-specific details - only shows items from the specified vendor
   */
  async getVendorOrderWithDetails(orderId: number, vendorId: number): Promise<OrderWithDetails | null> {
    // Get order and customer info with vendor-specific totals
    const orderQuery = `
      SELECT 
        o.*,
        u.email as customer_email,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone as customer_phone,
        (SELECT COALESCE(SUM(oi2.total_price), 0) 
         FROM order_items oi2 
         WHERE oi2.order_id = o.order_id 
         AND oi2.vendor_id = ?) as vendor_items_total,
        -- Shipping address details
        sa.first_name as shipping_first_name,
        sa.last_name as shipping_last_name,
        sa.address_line_1 as shipping_address_line_1,
        sa.address_line_2 as shipping_address_line_2,
        sa.city as shipping_city,
        sa.state_province as shipping_state,
        sa.postal_code as shipping_postal_code,
        sa.country as shipping_country,
        sa.phone as shipping_phone,
        sa.email as shipping_email,
        -- Billing address details (for fallback when shipping same as billing)
        ba.first_name as billing_first_name,
        ba.last_name as billing_last_name,
        ba.address_line_1 as billing_address_line_1,
        ba.address_line_2 as billing_address_line_2,
        ba.city as billing_city,
        ba.state_province as billing_state,
        ba.postal_code as billing_postal_code,
        ba.country as billing_country,
        ba.phone as billing_phone,
        ba.email as billing_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN user_shipping_addresses sa ON o.shipping_address_id = sa.address_id
      LEFT JOIN user_shipping_addresses ba ON o.billing_address_id = ba.address_id
      WHERE o.order_id = ?
      AND EXISTS (
        SELECT 1 FROM order_items oi 
        WHERE oi.order_id = o.order_id 
        AND oi.vendor_id = ?
      )
      LIMIT 1
    `;

    const [rawOrder] = await this.executeQuery<OrderWithDetails>(orderQuery, [vendorId, orderId, vendorId]);
    
    if (!rawOrder) return null;
    
    const order = parsePriceFields(rawOrder, [
      'total_amount', 'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount', 'vendor_items_total'
    ]);

    // Get ONLY vendor-specific order items
    const itemsQuery = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku,
        p.primary_image_url as product_image,
        vi.business_name as vendor_name
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN vendor_info vi ON oi.vendor_id = vi.vendor_info_id
      WHERE oi.order_id = ?
      AND oi.vendor_id = ?
      ORDER BY oi.order_item_id
    `;

    const items = await this.executeQuery<any>(itemsQuery, [orderId, vendorId]);
    
    // Parse price fields for each item
    order.items = parseArrayPrices(items, ['unit_price', 'total_price']);
    
    return order;
  }

  /**
   * Get orders with filtering and pagination
   */
  async getOrders(options: {
    userId?: number;
    vendorId?: number;
    status?: string | string[];
    paymentStatus?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    sortBy?: 'created_at' | 'total_amount' | 'order_number';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderWithDetails[]; total: number }> {
    const {
      userId,
      vendorId,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0
    } = options;

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (userId) {
      whereConditions.push('o.user_id = ?');
      whereParams.push(userId);
    }

    if (vendorId) {
      // Filter orders that contain items from this vendor and are not disabled
      whereConditions.push('EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.order_id AND oi.vendor_id = ?)');
      whereConditions.push('(o.is_disabled IS NULL OR o.is_disabled = FALSE)');
      whereParams.push(vendorId);
    }

    if (status) {
      if (Array.isArray(status)) {
        const statusPlaceholders = status.map(() => '?').join(',');
        whereConditions.push(`o.status IN (${statusPlaceholders})`);
        whereParams.push(...status);
      } else {
        whereConditions.push('o.status = ?');
        whereParams.push(status);
      }
    }

    if (paymentStatus) {
      whereConditions.push('o.payment_status = ?');
      whereParams.push(paymentStatus);
    }

    if (dateFrom) {
      whereConditions.push('o.created_at >= ?');
      whereParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('o.created_at <= ?');
      whereParams.push(dateTo);
    }

    if (search) {
      whereConditions.push('(o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const searchPattern = `%${search}%`;
      whereParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT o.order_id) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ${whereClause}
    `;

    const [countResult] = await this.executeQuery<RowDataPacket>(countQuery, whereParams);
    const total = countResult.total || 0;

    // Get orders with customer info
    // If vendorId is specified, include vendor-specific item counts and totals
    const ordersQuery = vendorId ? `
      SELECT 
        o.*,
        u.email as customer_email,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone as customer_phone,
        COUNT(DISTINCT oi.order_item_id) as item_count,
        COUNT(DISTINCT CASE WHEN oi.vendor_id = ? THEN oi.order_item_id END) as vendor_items_count,
        COALESCE(SUM(CASE WHEN oi.vendor_id = ? THEN oi.total_price ELSE 0 END), 0) as vendor_items_total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    ` : `
      SELECT
        o.*,
        u.email as customer_email,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone as customer_phone,
        COUNT(DISTINCT oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    // Add vendorId params at the beginning if vendor-specific query
    const queryParams = vendorId
      ? [vendorId, vendorId, ...whereParams, limit, offset]
      : [...whereParams, limit, offset];
    
    const rawOrders = await this.executeQuery<OrderWithDetails>(ordersQuery, queryParams);
    const orders = parseArrayPrices(rawOrders, [
      'total_amount', 'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount', 'vendor_items_total'
    ]);

    // Get items for all orders in one query
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.order_id);
      const placeholders = orderIds.map(() => '?').join(',');
      
      // If vendorId is specified, only get items for that vendor
      const itemsQuery = vendorId ? `
        SELECT 
          oi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.primary_image_url as product_image,
          vi.business_name as vendor_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN vendor_info vi ON oi.vendor_id = vi.vendor_info_id
        WHERE oi.order_id IN (${placeholders})
        AND oi.vendor_id = ?
        ORDER BY oi.order_id, oi.order_item_id
      ` : `
        SELECT 
          oi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.primary_image_url as product_image,
          vi.business_name as vendor_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN vendor_info vi ON p.vendor_id = vi.vendor_info_id
        WHERE oi.order_id IN (${placeholders})
        ORDER BY oi.order_id, oi.order_item_id
      `;

      const queryParams = vendorId ? [...orderIds, vendorId] : orderIds;
      const allItems = await this.executeQuery<any>(itemsQuery, queryParams);

      // Group items by order
      const itemsByOrder = allItems.reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(item);
        return acc;
      }, {} as Record<number, any[]>);

      // Assign items to orders
      orders.forEach(order => {
        order.items = itemsByOrder[order.order_id] || [];
      });
    }

    return { orders, total };
  }

  /**
   * Update order status with history tracking
   */
  async updateOrderStatus(
    orderId: number,
    newStatus: string,
    userId: number,
    notes?: string
  ): Promise<boolean> {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current status
      const [currentOrder] = await connection.execute<RowDataPacket[]>(
        'SELECT status FROM orders WHERE order_id = ?',
        [orderId]
      );

      if (!currentOrder[0]) {
        throw new Error('Order not found');
      }

      const oldStatus = currentOrder[0].status;

      // Update order status
      await connection.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        [newStatus, orderId]
      );

      // Add to status history
      await connection.execute(
        `INSERT INTO order_status_log 
         (order_id, status, notes, updated_by, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [orderId, newStatus, notes || `Status changed from ${oldStatus} to ${newStatus}`, userId]
      );

      // Update vendor order status if applicable
      // Update vendor commission status if order is cancelled
      if (newStatus === 'cancelled') {
        await connection.execute(
          'UPDATE vendor_commissions SET commission_status = ? WHERE order_id = ?',
          ['cancelled', orderId]
        );
      }

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get order statistics for a user or vendor
   */
  async getOrderStatistics(options: {
    userId?: number;
    vendorId?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  }> {
    const { userId, vendorId, dateFrom, dateTo } = options;

    const whereConditions: string[] = [];
    const whereParams: any[] = [];

    if (userId) {
      whereConditions.push('o.user_id = ?');
      whereParams.push(userId);
    }

    if (vendorId) {
      // Filter orders that contain items from this vendor and are not disabled
      whereConditions.push('EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.order_id AND oi.vendor_id = ?)');
      whereConditions.push('(o.is_disabled IS NULL OR o.is_disabled = FALSE)');
      whereParams.push(vendorId);
    }

    if (dateFrom) {
      whereConditions.push('o.created_at >= ?');
      whereParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('o.created_at <= ?');
      whereParams.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const baseTable = 'orders o';

    // Get all statistics in parallel
    const results = await this.executeParallel<{
      stats: any[];
      statusBreakdown: any[];
      monthlyRevenue: any[];
    }>({
      stats: {
        query: `
          SELECT 
            COUNT(DISTINCT o.order_id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_revenue,
            COALESCE(AVG(o.total_amount), 0) as avg_order_value
          FROM ${baseTable}
          ${whereClause}
        `,
        params: whereParams
      },
      statusBreakdown: {
        query: `
          SELECT 
            o.status,
            COUNT(DISTINCT o.order_id) as count
          FROM ${baseTable}
          ${whereClause}
          GROUP BY o.status
        `,
        params: whereParams
      },
      monthlyRevenue: {
        query: `
          SELECT 
            DATE_FORMAT(o.created_at, '%Y-%m') as month,
            COALESCE(SUM(o.total_amount), 0) as revenue
          FROM ${baseTable}
          ${whereClause}
          GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
          ORDER BY month DESC
          LIMIT 12
        `,
        params: whereParams
      }
    });

    const { stats, statusBreakdown, monthlyRevenue } = results;

    const ordersByStatus = (statusBreakdown || []).reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders: stats?.[0]?.total_orders || 0,
      totalRevenue: parseDecimal(stats?.[0]?.total_revenue),
      averageOrderValue: parseDecimal(stats?.[0]?.avg_order_value),
      ordersByStatus,
      revenueByMonth: (monthlyRevenue || []).reverse()
    };
  }
}