/**
 * Order Service for BlindsCommerce
 * Handles all order-related database operations with optimized queries
 */

import { BaseService } from './BaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '@/lib/db';
import { parseArrayPrices, parseDecimal, parsePriceFields } from '@/lib/utils/priceUtils';

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
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, user_id, status, total_amount, subtotal,
          tax_amount, shipping_amount, discount_amount, currency,
          payment_method, payment_status, shipping_address, billing_address,
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
          JSON.stringify(data.shipping_address),
          JSON.stringify(data.billing_address),
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
        item.discount_amount || 0,
        item.tax_amount || 0,
        (item.price * item.quantity) - (item.discount_amount || 0) + (item.tax_amount || 0),
        JSON.stringify(item.configuration || {})
      ]);

      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, vendor_id, quantity, price,
          discount_amount, tax_amount, total, configuration
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

      // Create vendor orders (split order by vendor)
      const vendorGroups = data.items.reduce((acc, item) => {
        if (!acc[item.vendor_id]) {
          acc[item.vendor_id] = [];
        }
        acc[item.vendor_id].push(item);
        return acc;
      }, {} as Record<number, typeof data.items>);

      for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
        const vendorSubtotal = vendorItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        const vendorDiscount = vendorItems.reduce((sum, item) => 
          sum + (item.discount_amount || 0), 0
        );
        const vendorTax = vendorItems.reduce((sum, item) => 
          sum + (item.tax_amount || 0), 0
        );

        await connection.execute(
          `INSERT INTO vendor_orders (
            order_id, vendor_id, status, subtotal, discount_amount,
            tax_amount, total_amount, commission_rate, commission_amount,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            orderId,
            vendorId,
            'pending',
            vendorSubtotal,
            vendorDiscount,
            vendorTax,
            vendorSubtotal - vendorDiscount + vendorTax,
            10, // Default commission rate, should come from vendor settings
            (vendorSubtotal - vendorDiscount) * 0.10 // 10% commission
          ]
        );
      }

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
        u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
      LIMIT 1
    `;

    const [rawOrder] = await this.executeQuery<OrderWithDetails>(orderQuery, [orderId]);
    
    if (!rawOrder) return null;
    
    const order = parsePriceFields(rawOrder, [
      'total_amount', 'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount'
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
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN vendor_info vi ON oi.vendor_id = vi.vendor_info_id
      WHERE oi.order_id = ?
      ORDER BY oi.order_item_id
    `;

    const items = await this.executeQuery<any>(itemsQuery, [orderId]);
    
    order.items = items;
    
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
      whereConditions.push('EXISTS (SELECT 1 FROM vendor_orders vo WHERE vo.order_id = o.order_id AND vo.vendor_id = ?)');
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
    const ordersQuery = `
      SELECT 
        o.*,
        u.email as customer_email,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone as customer_phone,
        COUNT(DISTINCT oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.${sortBy} ${sortOrder}
      LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}
    `;

    const rawOrders = await this.executeQuery<OrderWithDetails>(ordersQuery, whereParams);
    const orders = parseArrayPrices(rawOrders, [
      'total_amount', 'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount'
    ]);

    // Get items for all orders in one query
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.order_id);
      const placeholders = orderIds.map(() => '?').join(',');
      
      const itemsQuery = `
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
        ORDER BY oi.order_id, oi.order_item_id
      `;

      const allItems = await this.executeQuery<any>(itemsQuery, orderIds);

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
        `INSERT INTO order_status_history 
         (order_id, old_status, new_status, changed_by, notes, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [orderId, oldStatus, newStatus, userId, notes]
      );

      // Update vendor order status if applicable
      await connection.execute(
        'UPDATE vendor_orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        [newStatus, orderId]
      );

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
      whereConditions.push('vo.vendor_id = ?');
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

    const baseTable = vendorId ? 'vendor_orders vo JOIN orders o ON vo.order_id = o.order_id' : 'orders o';

    // Get all statistics in parallel
    const [stats, statusBreakdown, monthlyRevenue] = await this.executeParallel<{
      stats: any[];
      statusBreakdown: any[];
      monthlyRevenue: any[];
    }>({
      stats: {
        query: `
          SELECT 
            COUNT(DISTINCT o.order_id) as total_orders,
            COALESCE(SUM(${vendorId ? 'vo.total_amount' : 'o.total_amount'}), 0) as total_revenue,
            COALESCE(AVG(${vendorId ? 'vo.total_amount' : 'o.total_amount'}), 0) as avg_order_value
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
            COALESCE(SUM(${vendorId ? 'vo.total_amount' : 'o.total_amount'}), 0) as revenue
          FROM ${baseTable}
          ${whereClause}
          GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
          ORDER BY month DESC
          LIMIT 12
        `,
        params: whereParams
      }
    });

    const ordersByStatus = statusBreakdown.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders: stats[0]?.total_orders || 0,
      totalRevenue: parseDecimal(stats[0]?.total_revenue),
      averageOrderValue: parseDecimal(stats[0]?.avg_order_value),
      ordersByStatus,
      revenueByMonth: monthlyRevenue.reverse()
    };
  }
}