/**
 * Offline Order Handler for V2 API
 * Handles Local orders created by Sales Staff and Admin
 * Implements vendor splitting logic for multi-vendor orders
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { randomBytes } from 'crypto';

// Validation schemas
const CreateOfflineOrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerPassword: z.string().optional(),
  items: z.array(z.object({
    productName: z.string(),
    productType: z.string(),
    roomLocation: z.string().optional(),
    widthInches: z.number().positive(),
    heightInches: z.number().positive(),
    fabric: z.string().optional(),
    color: z.string().optional(),
    mountType: z.string().optional(),
    controlType: z.string().optional(),
    valanceType: z.string().optional(),
    quantity: z.number().positive().default(1),
    unitPrice: z.number().positive(),
    vendorId: z.number().positive().optional(),
    notes: z.string().optional(),
  })),
  notes: z.string().optional(),
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'quote_requested',
    'order_paid',
    'order_placed',
    'order_in_production',
    'order_finished',
    'sent_to_shipping',
    'shipping_paid',
    'sent_to_customer',
    'order_received',
    'order_damaged',
    'missing_blind'
  ]),
  reason: z.string().optional(),
});

export class OfflineOrderHandler extends BaseHandler {
  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'orders': () => this.getOfflineOrders(req, user),
      'orders/:id': () => this.getOfflineOrder(action[1], user),
      'dashboard': () => this.getDashboard(req, user),
      'vendor-orders': () => this.getVendorOrders(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'create': () => this.createOfflineOrder(req, user),
      'orders/:id/status': () => this.updateOrderStatus(action[1], req, user),
      'orders/:id/items/:itemId/status': () => this.updateItemStatus(action[1], action[3], req, user),
      'orders/:id/notes': () => this.addOrderNote(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Create offline order with vendor splitting
   */
  private async createOfflineOrder(req: NextRequest, user: any) {
    // Only sales staff and admin can create Local orders
    if (!['sales', 'admin', 'super_admin'].includes(user.role)) {
      throw new ApiError('Unauthorized to create Local orders', 403);
    }

    const data = await this.getValidatedBody(req, CreateOfflineOrderSchema);
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Generate order number with cryptographically secure random string
      const randomSuffix = randomBytes(3).toString('hex').toUpperCase();
      const orderNumber = `OFF-${Date.now()}-${randomSuffix}`;

      // Group items by vendor
      const itemsByVendor = new Map<number, typeof data.items>();
      let unassignedItems: typeof data.items = [];

      for (const item of data.items) {
        if (item.vendorId) {
          if (!itemsByVendor.has(item.vendorId)) {
            itemsByVendor.set(item.vendorId, []);
          }
          itemsByVendor.get(item.vendorId)!.push(item);
        } else {
          unassignedItems.push(item);
        }
      }

      // Calculate totals
      let totalAmount = 0;
      for (const item of data.items) {
        totalAmount += item.unitPrice * item.quantity;
      }

      // Check if customer exists or create new customer user
      let customerId = null;
      if (data.customerEmail) {
        // Check if user with this email exists
        const [existingUsers] = await connection.execute<RowDataPacket[]>(
          'SELECT user_id FROM users WHERE email = ? AND role = "customer"',
          [data.customerEmail]
        );

        if (existingUsers.length > 0) {
          customerId = existingUsers[0].user_id;
          
          // Update customer info if provided
          await connection.execute(
            `UPDATE users SET 
              first_name = COALESCE(?, first_name),
              last_name = COALESCE(?, last_name),
              phone = COALESCE(?, phone),
              updated_at = NOW()
            WHERE user_id = ?`,
            [
              data.customerName.split(' ')[0] || null,
              data.customerName.split(' ').slice(1).join(' ') || null,
              data.customerPhone || null,
              customerId
            ]
          );
        } else {
          // Create new customer user
          const bcrypt = require('bcryptjs');
          let passwordToUse: string;
          let passwordMessage: string;
          
          if (data.customerPassword) {
            // Use provided password
            passwordToUse = data.customerPassword;
            passwordMessage = 'with the password you provided';
          } else {
            // Generate cryptographically secure temporary password
            passwordToUse = randomBytes(6).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
            passwordMessage = `with temporary password: ${passwordToUse}`;
          }
          
          const hashedPassword = await bcrypt.hash(passwordToUse, 10);
          
          const [userResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO users (
              email, password_hash, first_name, last_name, phone,
              role, is_active, is_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'customer', 1, 0, NOW(), NOW())`,
            [
              data.customerEmail,
              hashedPassword,
              data.customerName.split(' ')[0] || null,
              data.customerName.split(' ').slice(1).join(' ') || null,
              data.customerPhone || null
            ]
          );
          
          customerId = userResult.insertId;
          
          // Store password message to add to order notes later
          data.customerAccountNote = `Customer account created for ${data.customerEmail} ${passwordMessage}`;
          
          // TODO: Send welcome email with login credentials
        }
      }

      // Create main order
      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO offline_orders (
          order_number, customer_name, customer_email, customer_phone, 
          customer_address, user_id, total_amount, status, created_by, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'quote_requested', ?, NOW(), NOW())`,
        [
          orderNumber,
          data.customerName,
          data.customerEmail || null,
          data.customerPhone || null,
          data.customerAddress || null,
          customerId,
          totalAmount,
          user.user_id
        ]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of data.items) {
        // Convert inches to cm
        const widthCm = item.widthInches * 2.54;
        const heightCm = item.heightInches * 2.54;
        const squareMeters = (widthCm * heightCm) / 10000;
        const pricePerSqm = item.unitPrice / squareMeters;

        await connection.execute(
          `INSERT INTO offline_order_items (
            order_id, vendor_id, product_name, product_type, room_location,
            width_inches, height_inches, width_cm, height_cm,
            fabric, color, mount_type, control_type, valance_type,
            quantity, unit_price, total_price, square_meters, price_per_sqm,
            item_status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'quote_requested', ?, NOW(), NOW())`,
          [
            orderId,
            item.vendorId || null,
            item.productName,
            item.productType,
            item.roomLocation || null,
            item.widthInches,
            item.heightInches,
            widthCm.toFixed(2),
            heightCm.toFixed(2),
            item.fabric || null,
            item.color || null,
            item.mountType || null,
            item.controlType || null,
            item.valanceType || null,
            item.quantity,
            item.unitPrice,
            item.unitPrice * item.quantity,
            squareMeters.toFixed(4),
            pricePerSqm.toFixed(2),
            item.notes || null
          ]
        );
      }

      // Add creation note
      if (data.notes) {
        await connection.execute(
          `INSERT INTO offline_order_notes (
            order_id, note_text, note_type, created_by, created_at
          ) VALUES (?, ?, 'internal', ?, NOW())`,
          [orderId, data.notes, user.user_id]
        );
      }
      
      // Add customer account creation note if applicable
      if ((data as any).customerAccountNote) {
        await connection.execute(
          `INSERT INTO offline_order_notes (
            order_id, note_text, note_type, created_by, created_at
          ) VALUES (?, ?, 'system', ?, NOW())`,
          [orderId, (data as any).customerAccountNote, user.user_id]
        );
      }

      // Log status history
      await connection.execute(
        `INSERT INTO offline_order_status_history (
          order_id, new_status, changed_by, change_reason, created_at
        ) VALUES (?, 'quote_requested', ?, 'Order created', NOW())`,
        [orderId, user.user_id]
      );

      await connection.commit();

      // Return the created order with details
      return await this.getOfflineOrderDetails(orderId, connection);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get Local orders based on user role
   */
  private async getOfflineOrders(req: NextRequest, user: any) {
    const pool = await getPool();
    const searchParams = new URL(req.url).searchParams;
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT DISTINCT
        o.order_id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name,
        COUNT(DISTINCT oi.vendor_id) as vendor_count,
        COUNT(oi.item_id) as item_count
      FROM offline_orders o
      LEFT JOIN offline_order_items oi ON o.order_id = oi.order_id
      LEFT JOIN users u ON o.created_by = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-based filtering
    if (user.role === 'vendor') {
      // Vendors only see orders with their items
      query += ` AND oi.vendor_id = ?`;
      params.push(user.vendor_id);
    } else if (user.role === 'sales') {
      // Sales staff see orders they created
      query += ` AND o.created_by = ?`;
      params.push(user.user_id);
    } else if (user.role === 'customer') {
      // Customers see their own orders
      query += ` AND o.user_id = ?`;
      params.push(user.user_id);
    }
    // Admin and super_admin see all orders

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    if (vendorId && ['admin', 'super_admin'].includes(user.role)) {
      query += ` AND oi.vendor_id = ?`;
      params.push(parseInt(vendorId));
    }

    query += ` GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT ${Math.floor(limit)} OFFSET ${Math.floor(offset)}`;

    const [orders] = await pool.execute(query, params);

    // Get total count (use same params since LIMIT/OFFSET are in query string now)
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(DISTINCT o.order_id) as total FROM')
      .replace(/ORDER BY[\s\S]*$/, '');
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult as any[])[0]?.total || 0;

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single offline order details
   */
  private async getOfflineOrder(orderId: string, user: any) {
    const pool = await getPool();
    const id = parseInt(orderId);
    
    if (isNaN(id)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const connection = await pool.getConnection();
    try {
      return await this.getOfflineOrderDetails(id, connection, user);
    } finally {
      connection.release();
    }
  }

  /**
   * Get vendor-specific orders
   */
  private async getVendorOrders(req: NextRequest, user: any) {
    if (user.role !== 'vendor') {
      throw new ApiError('This endpoint is for vendors only', 403);
    }

    // Use vendorId (camelCase) as returned by auth.ts
    const vendorId = user.vendorId;
    if (!vendorId) {
      throw new ApiError('Vendor ID not found for user', 400);
    }

    const pool = await getPool();
    const searchParams = new URL(req.url).searchParams;
    const status = searchParams.get('status');

    const query = `
      SELECT
        o.order_id,
        o.order_number,
        o.customer_name,
        o.status as order_status,
        oi.item_id,
        oi.product_name,
        oi.product_type,
        oi.room_location,
        oi.width_inches,
        oi.height_inches,
        oi.quantity,
        oi.total_price,
        oi.item_status,
        oi.created_at
      FROM offline_order_items oi
      JOIN offline_orders o ON oi.order_id = o.order_id
      WHERE oi.vendor_id = ?
      ${status ? 'AND oi.item_status = ?' : ''}
      ORDER BY oi.created_at DESC
    `;

    const params: (number | string)[] = [vendorId];
    if (status) params.push(status);

    const [items] = await pool.execute(query, params);

    return { items };
  }

  /**
   * Update order status
   */
  private async updateOrderStatus(orderId: string, req: NextRequest, user: any) {
    const id = parseInt(orderId);
    if (isNaN(id)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const data = await this.getValidatedBody(req, UpdateOrderStatusSchema);
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current status
      const [currentOrder] = await connection.execute<RowDataPacket[]>(
        'SELECT status FROM offline_orders WHERE order_id = ?',
        [id]
      );

      if (!currentOrder.length) {
        throw new ApiError('Order not found', 404);
      }

      const oldStatus = currentOrder[0].status;

      // Update order status
      await connection.execute(
        'UPDATE offline_orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        [data.status, id]
      );

      // Log status change
      await connection.execute(
        `INSERT INTO offline_order_status_history (
          order_id, old_status, new_status, changed_by, change_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, oldStatus, data.status, user.user_id, data.reason || null]
      );

      // If order status is updated, update all items to the same status
      if (['order_paid', 'order_placed', 'order_in_production', 'order_finished'].includes(data.status)) {
        await connection.execute(
          'UPDATE offline_order_items SET item_status = ?, updated_at = NOW() WHERE order_id = ?',
          [data.status, id]
        );
      }

      await connection.commit();

      return { success: true, message: 'Order status updated successfully' };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update individual item status
   */
  private async updateItemStatus(orderId: string, itemId: string, req: NextRequest, user: any) {
    const oId = parseInt(orderId);
    const iId = parseInt(itemId);
    
    if (isNaN(oId) || isNaN(iId)) {
      throw new ApiError('Invalid ID', 400);
    }

    const data = await this.getValidatedBody(req, UpdateOrderStatusSchema);
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify item belongs to order and check permissions
      const [item] = await connection.execute<RowDataPacket[]>(
        'SELECT vendor_id, item_status FROM offline_order_items WHERE item_id = ? AND order_id = ?',
        [iId, oId]
      );

      if (!item.length) {
        throw new ApiError('Item not found', 404);
      }

      // Check permissions
      if (user.role === 'vendor' && item[0].vendor_id !== user.vendor_id) {
        throw new ApiError('Unauthorized to update this item', 403);
      }

      const oldStatus = item[0].item_status;

      // Update item status
      await connection.execute(
        'UPDATE offline_order_items SET item_status = ?, updated_at = NOW() WHERE item_id = ?',
        [data.status, iId]
      );

      // Log status change
      await connection.execute(
        `INSERT INTO offline_order_status_history (
          order_id, item_id, old_status, new_status, changed_by, change_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [oId, iId, oldStatus, data.status, user.user_id, data.reason || null]
      );

      await connection.commit();

      return { success: true, message: 'Item status updated successfully' };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Add note to order
   */
  private async addOrderNote(orderId: string, req: NextRequest, user: any) {
    const id = parseInt(orderId);
    if (isNaN(id)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const body = await this.getBody(req);
    const { noteText, noteType = 'internal', itemId } = body;

    if (!noteText) {
      throw new ApiError('Note text is required', 400);
    }

    const pool = await getPool();
    await pool.execute(
      `INSERT INTO offline_order_notes (
        order_id, item_id, note_text, note_type, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, itemId || null, noteText, noteType, user.user_id]
    );

    return { success: true, message: 'Note added successfully' };
  }

  /**
   * Get dashboard statistics
   */
  private async getDashboard(req: NextRequest, user: any) {
    const pool = await getPool();
    const searchParams = new URL(req.url).searchParams;
    const dateFrom = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('to') || new Date().toISOString().split('T')[0];

    let baseQuery = '';
    const params: any[] = [dateFrom, dateTo];

    if (user.role === 'vendor') {
      baseQuery = 'AND oi.vendor_id = ?';
      params.push(user.vendor_id);
    } else if (user.role === 'sales') {
      baseQuery = 'AND o.created_by = ?';
      params.push(user.user_id);
    }

    // Get order statistics
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as average_order_value,
        COUNT(DISTINCT o.customer_name) as unique_customers
      FROM offline_orders o
      LEFT JOIN offline_order_items oi ON o.order_id = oi.order_id
      WHERE DATE(o.created_at) BETWEEN ? AND ? ${baseQuery}
    `, params);

    // Get status breakdown
    const [statusBreakdown] = await pool.execute(`
      SELECT 
        o.status,
        COUNT(*) as count,
        SUM(o.total_amount) as total_amount
      FROM offline_orders o
      LEFT JOIN offline_order_items oi ON o.order_id = oi.order_id
      WHERE DATE(o.created_at) BETWEEN ? AND ? ${baseQuery}
      GROUP BY o.status
    `, params);

    // Get recent orders
    const [recentOrders] = await pool.execute(`
      SELECT DISTINCT
        o.order_id,
        o.order_number,
        o.customer_name,
        o.total_amount,
        o.status,
        o.created_at
      FROM offline_orders o
      LEFT JOIN offline_order_items oi ON o.order_id = oi.order_id
      WHERE 1=1 ${baseQuery}
      ORDER BY o.created_at DESC
      LIMIT 10
    `, baseQuery ? params.slice(2) : []);

    return {
      stats: stats[0] || {},
      statusBreakdown,
      recentOrders
    };
  }

  /**
   * Helper method to get complete order details
   */
  private async getOfflineOrderDetails(orderId: number, connection: any, user?: any): Promise<any> {
    // Get order details
    const [orderRows] = await connection.execute<RowDataPacket[]>(`
      SELECT 
        o.*,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name,
        u.email as created_by_email
      FROM offline_orders o
      LEFT JOIN users u ON o.created_by = u.user_id
      WHERE o.order_id = ?
    `, [orderId]);

    if (!orderRows.length) {
      throw new ApiError('Order not found', 404);
    }

    const order = orderRows[0];

    // Get order items
    const [items] = await connection.execute(`
      SELECT
        oi.*,
        vi.business_name as vendor_name
      FROM offline_order_items oi
      LEFT JOIN vendor_info vi ON oi.vendor_id = vi.user_id
      WHERE oi.order_id = ?
      ORDER BY oi.item_id
    `, [orderId]);

    // Get notes
    const [notes] = await connection.execute(`
      SELECT 
        n.*,
        u.first_name,
        u.last_name
      FROM offline_order_notes n
      LEFT JOIN users u ON n.created_by = u.user_id
      WHERE n.order_id = ?
      ORDER BY n.created_at DESC
    `, [orderId]);

    // Get status history
    const [statusHistory] = await connection.execute(`
      SELECT 
        h.*,
        u.first_name,
        u.last_name
      FROM offline_order_status_history h
      LEFT JOIN users u ON h.changed_by = u.user_id
      WHERE h.order_id = ?
      ORDER BY h.created_at DESC
    `, [orderId]);

    return {
      ...order,
      items,
      notes,
      statusHistory
    };
  }
}