/**
 * Support Handler for V2 API
 * Handles support tickets, returns, reviews, notifications, preferences, loyalty, and referrals
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Validation schemas
const CreateTicketSchema = z.object({
  subject: z.string().min(5).max(255),
  category: z.enum(['order_issue', 'product_question', 'shipping', 'returns', 'installation', 'billing', 'technical', 'other']),
  message: z.string().min(10),
  orderId: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

const TicketReplySchema = z.object({
  message: z.string().min(1),
});

const CreateReturnSchema = z.object({
  orderId: z.number().positive(),
  items: z.array(z.object({
    orderItemId: z.number().positive(),
    quantity: z.number().positive().default(1),
    conditionDescription: z.string().optional(),
  })).min(1),
  reason: z.enum(['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping', 'other']),
  reasonDetails: z.string().optional(),
  returnType: z.enum(['refund', 'exchange', 'store_credit']).default('refund'),
});

const CreateReviewSchema = z.object({
  productId: z.number().positive(),
  orderId: z.number().optional(),
  orderItemId: z.number().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().max(255).optional(),
  reviewText: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  isRecommended: z.boolean().default(true),
});

const UpdateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().max(255).optional(),
  reviewText: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  isRecommended: z.boolean().optional(),
});

const ReviewVoteSchema = z.object({
  isHelpful: z.boolean(),
});

const UpdatePreferencesSchema = z.object({
  emailOrderUpdates: z.boolean().optional(),
  emailShippingUpdates: z.boolean().optional(),
  emailPromotions: z.boolean().optional(),
  emailNewsletter: z.boolean().optional(),
  emailReviewReminders: z.boolean().optional(),
  emailSupportUpdates: z.boolean().optional(),
  smsOrderUpdates: z.boolean().optional(),
  smsShippingUpdates: z.boolean().optional(),
  smsPromotions: z.boolean().optional(),
  pushOrderUpdates: z.boolean().optional(),
  pushPromotions: z.boolean().optional(),
});

const RedeemPointsSchema = z.object({
  points: z.number().positive(),
  useFor: z.enum(['discount', 'shipping', 'product']),
});

export class SupportHandler extends BaseHandler {
  private tableCache: Map<string, boolean> = new Map();

  /**
   * Check if a required table exists, with caching
   */
  private async ensureTableExists(tableName: string): Promise<void> {
    // Check cache first
    if (this.tableCache.get(tableName)) {
      return;
    }

    const pool = await getPool();
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [tableName]
      );

      if (rows.length === 0) {
        throw new ApiError(
          503,
          `Service temporarily unavailable. The ${tableName.replace(/_/g, ' ')} feature is being set up. Please try again later.`,
          'SERVICE_UNAVAILABLE'
        );
      }

      // Cache the result
      this.tableCache.set(tableName, true);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Database connection error', 'DATABASE_ERROR');
    }
  }

  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes: Record<string, () => Promise<any>> = {
      // Support Tickets
      'tickets': () => this.getTickets(req, user),
      'tickets/:id': () => this.getTicket(action[1], user),

      // Returns
      'returns': () => this.getReturns(req, user),
      'returns/:id': () => this.getReturn(action[1], user),
      'returns/eligible-items': () => this.getEligibleReturnItems(req, user),

      // Reviews
      'reviews': () => this.getUserReviews(req, user),
      'reviews/:id': () => this.getReview(action[1], user),
      'reviews/pending': () => this.getPendingReviewItems(user),
      'product-reviews/:productId': () => this.getProductReviews(action[1], req),

      // Notifications
      'notifications': () => this.getNotifications(req, user),
      'notifications/unread-count': () => this.getUnreadNotificationCount(user),

      // Communication Preferences
      'preferences': () => this.getPreferences(user),

      // Loyalty
      'loyalty': () => this.getLoyaltyInfo(user),
      'loyalty/history': () => this.getLoyaltyHistory(req, user),
      'loyalty/tiers': () => this.getLoyaltyTiers(),

      // Referrals
      'referral': () => this.getReferralInfo(user),
      'referral/history': () => this.getReferralHistory(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes: Record<string, () => Promise<any>> = {
      // Support Tickets
      'tickets': () => this.createTicket(req, user),
      'tickets/:id/reply': () => this.replyToTicket(action[1], req, user),
      'tickets/:id/close': () => this.closeTicket(action[1], user),

      // Returns
      'returns': () => this.createReturn(req, user),
      'returns/:id/cancel': () => this.cancelReturn(action[1], user),

      // Reviews
      'reviews': () => this.createReview(req, user),
      'reviews/:id/vote': () => this.voteReview(action[1], req, user),

      // Notifications
      'notifications/:id/read': () => this.markNotificationRead(action[1], user),
      'notifications/read-all': () => this.markAllNotificationsRead(user),

      // Loyalty
      'loyalty/redeem': () => this.redeemPoints(req, user),

      // Referrals
      'referral/generate-code': () => this.generateReferralCode(user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PUT requests
   */
  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes: Record<string, () => Promise<any>> = {
      'reviews/:id': () => this.updateReview(action[1], req, user),
      'preferences': () => this.updatePreferences(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle DELETE requests
   */
  async handleDELETE(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes: Record<string, () => Promise<any>> = {
      'reviews/:id': () => this.deleteReview(action[1], user),
      'notifications/:id': () => this.deleteNotification(action[1], user),
    };

    return this.routeAction(action, routes);
  }

  // ==================== SUPPORT TICKETS ====================

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  private async getTickets(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('support_tickets');

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const status = searchParams.get('status');

    let query = `
      SELECT
        st.ticket_id, st.ticket_number, st.subject, st.category, st.priority, st.status,
        st.order_id, st.created_at, st.updated_at, st.resolved_at,
        o.order_number,
        (SELECT COUNT(*) FROM support_ticket_messages WHERE ticket_id = st.ticket_id) as message_count,
        (SELECT MAX(created_at) FROM support_ticket_messages WHERE ticket_id = st.ticket_id) as last_message_at
      FROM support_tickets st
      LEFT JOIN orders o ON st.order_id = o.order_id
      WHERE st.user_id = ?
    `;
    const params: any[] = [user.userId];

    if (status) {
      query += ' AND st.status = ?';
      params.push(status);
    }

    query += ` ORDER BY st.updated_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [tickets] = await pool.execute<RowDataPacket[]>(query, params);

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM support_tickets WHERE user_id = ?${status ? ' AND status = ?' : ''}`,
      status ? [user.userId, status] : [user.userId]
    );

    return {
      tickets,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  private async getTicket(ticketId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    // Get ticket details
    const [tickets] = await pool.execute<RowDataPacket[]>(
      `SELECT
        st.*, o.order_number,
        u_assigned.first_name as assigned_first_name, u_assigned.last_name as assigned_last_name
       FROM support_tickets st
       LEFT JOIN orders o ON st.order_id = o.order_id
       LEFT JOIN users u_assigned ON st.assigned_to = u_assigned.user_id
       WHERE st.ticket_id = ? AND st.user_id = ?`,
      [ticketId, user.userId]
    );

    if (tickets.length === 0) {
      throw new ApiError('Ticket not found', 404);
    }

    // Get messages
    const [messages] = await pool.execute<RowDataPacket[]>(
      `SELECT
        stm.message_id, stm.message, stm.created_at, stm.attachments,
        u.first_name, u.last_name, u.role,
        CASE WHEN u.user_id = ? THEN true ELSE false END as is_own_message
       FROM support_ticket_messages stm
       JOIN users u ON stm.user_id = u.user_id
       WHERE stm.ticket_id = ? AND stm.is_internal = false
       ORDER BY stm.created_at ASC`,
      [user.userId, ticketId]
    );

    return {
      ticket: tickets[0],
      messages,
    };
  }

  private async createTicket(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('support_tickets');

    const body = await req.json();
    const data = CreateTicketSchema.parse(body);

    const pool = await getPool();
    const ticketNumber = this.generateTicketNumber();

    // If orderId provided, verify it belongs to user
    if (data.orderId) {
      const [orders] = await pool.execute<RowDataPacket[]>(
        'SELECT order_id FROM orders WHERE order_id = ? AND user_id = ?',
        [data.orderId, user.userId]
      );
      if (orders.length === 0) {
        throw new ApiError('Order not found or does not belong to you', 400);
      }
    }

    // Create ticket
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO support_tickets (ticket_number, user_id, order_id, subject, category, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`,
      [ticketNumber, user.userId, data.orderId || null, data.subject, data.category, data.priority]
    );

    const ticketId = result.insertId;

    // Add initial message
    await pool.execute(
      `INSERT INTO support_ticket_messages (ticket_id, user_id, message)
       VALUES (?, ?, ?)`,
      [ticketId, user.userId, data.message]
    );

    // Create notification for admin (system notification)
    await this.createNotificationForRole(pool, 'admin', 'support_update',
      'New Support Ticket',
      `New ticket #${ticketNumber}: ${data.subject}`,
      `/admin/support/${ticketId}`
    );

    return {
      ticketId,
      ticketNumber,
      message: 'Support ticket created successfully',
    };
  }

  private async replyToTicket(ticketId: string, req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const body = await req.json();
    const data = TicketReplySchema.parse(body);

    const pool = await getPool();

    // Verify ticket belongs to user and is not closed
    const [tickets] = await pool.execute<RowDataPacket[]>(
      'SELECT ticket_id, status, ticket_number FROM support_tickets WHERE ticket_id = ? AND user_id = ?',
      [ticketId, user.userId]
    );

    if (tickets.length === 0) {
      throw new ApiError('Ticket not found', 404);
    }

    if (tickets[0].status === 'closed') {
      throw new ApiError('Cannot reply to a closed ticket', 400);
    }

    // Add message
    await pool.execute(
      `INSERT INTO support_ticket_messages (ticket_id, user_id, message)
       VALUES (?, ?, ?)`,
      [ticketId, user.userId, data.message]
    );

    // Update ticket status to waiting_support
    await pool.execute(
      `UPDATE support_tickets SET status = 'waiting_support', updated_at = NOW() WHERE ticket_id = ?`,
      [ticketId]
    );

    return { message: 'Reply sent successfully' };
  }

  private async closeTicket(ticketId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE support_tickets SET status = 'closed', closed_at = NOW(), updated_at = NOW()
       WHERE ticket_id = ? AND user_id = ? AND status != 'closed'`,
      [ticketId, user.userId]
    );

    if (result.affectedRows === 0) {
      throw new ApiError('Ticket not found or already closed', 404);
    }

    return { message: 'Ticket closed successfully' };
  }

  // ==================== RETURNS ====================

  private generateReturnNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RET-${timestamp}-${random}`;
  }

  private async getReturns(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('return_requests');

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const status = searchParams.get('status');

    let query = `
      SELECT
        rr.return_id, rr.return_number, rr.order_id, rr.status, rr.reason, rr.return_type,
        rr.refund_amount, rr.tracking_number, rr.carrier, rr.created_at, rr.updated_at,
        o.order_number, o.total_amount as order_total
      FROM return_requests rr
      JOIN orders o ON rr.order_id = o.order_id
      WHERE rr.user_id = ?
    `;
    const params: any[] = [user.userId];

    if (status) {
      query += ' AND rr.status = ?';
      params.push(status);
    }

    query += ` ORDER BY rr.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [returns] = await pool.execute<RowDataPacket[]>(query, params);

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM return_requests WHERE user_id = ?${status ? ' AND status = ?' : ''}`,
      status ? [user.userId, status] : [user.userId]
    );

    return {
      returns,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  private async getReturn(returnId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('return_requests');

    const pool = await getPool();

    // Get return request details
    const [returns] = await pool.execute<RowDataPacket[]>(
      `SELECT
        rr.*, o.order_number, o.total_amount as order_total
       FROM return_requests rr
       JOIN orders o ON rr.order_id = o.order_id
       WHERE rr.return_id = ? AND rr.user_id = ?`,
      [returnId, user.userId]
    );

    if (returns.length === 0) {
      throw new ApiError('Return request not found', 404);
    }

    // Get return items
    const [items] = await pool.execute<RowDataPacket[]>(
      `SELECT
        rri.*, oi.product_id, oi.quantity as original_quantity, oi.unit_price, oi.total_price,
        p.product_name, p.sku
       FROM return_request_items rri
       JOIN order_items oi ON rri.order_item_id = oi.order_item_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE rri.return_id = ?`,
      [returnId]
    );

    return {
      return: returns[0],
      items,
    };
  }

  private async getEligibleReturnItems(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const orderId = searchParams.get('orderId');

    // Get orders within return window (30 days) that haven't been fully returned
    let query = `
      SELECT
        o.order_id, o.order_number, o.created_at as order_date, o.status as order_status,
        oi.order_item_id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price,
        p.product_name, p.sku,
        COALESCE(SUM(rri.quantity), 0) as already_returned_quantity
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN return_request_items rri ON oi.order_item_id = rri.order_item_id
      WHERE o.user_id = ?
        AND o.status = 'delivered'
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const params: any[] = [user.userId];

    if (orderId) {
      query += ' AND o.order_id = ?';
      params.push(orderId);
    }

    query += `
      GROUP BY o.order_id, oi.order_item_id
      HAVING oi.quantity > already_returned_quantity
      ORDER BY o.created_at DESC
    `;

    const [items] = await pool.execute<RowDataPacket[]>(query, params);

    return { eligibleItems: items };
  }

  private async createReturn(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('return_requests');

    const body = await req.json();
    const data = CreateReturnSchema.parse(body);

    const pool = await getPool();
    const returnNumber = this.generateReturnNumber();

    // Verify order belongs to user and is delivered
    const [orders] = await pool.execute<RowDataPacket[]>(
      `SELECT order_id, status, created_at FROM orders
       WHERE order_id = ? AND user_id = ? AND status = 'delivered'`,
      [data.orderId, user.userId]
    );

    if (orders.length === 0) {
      throw new ApiError('Order not found or not eligible for return', 400);
    }

    // Check if order is within return window (30 days)
    const orderDate = new Date(orders[0].created_at);
    const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceOrder > 30) {
      throw new ApiError('Order is outside the 30-day return window', 400);
    }

    // Verify all items belong to the order
    const itemIds = data.items.map(i => i.orderItemId);
    const [orderItems] = await pool.execute<RowDataPacket[]>(
      `SELECT order_item_id, quantity, unit_price FROM order_items
       WHERE order_id = ? AND order_item_id IN (${itemIds.map(() => '?').join(',')})`,
      [data.orderId, ...itemIds]
    );

    if (orderItems.length !== data.items.length) {
      throw new ApiError('Some items are not from this order', 400);
    }

    // Calculate refund amount
    const orderItemMap = new Map(orderItems.map((oi: any) => [oi.order_item_id, oi]));
    let refundAmount = 0;
    for (const item of data.items) {
      const orderItem = orderItemMap.get(item.orderItemId);
      if (orderItem && item.quantity <= orderItem.quantity) {
        refundAmount += parseFloat(orderItem.unit_price) * item.quantity;
      }
    }

    // Create return request
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO return_requests
       (return_number, order_id, user_id, status, reason, reason_details, return_type, refund_amount)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [returnNumber, data.orderId, user.userId, data.reason, data.reasonDetails || null, data.returnType, refundAmount]
    );

    const returnId = result.insertId;

    // Add return items
    for (const item of data.items) {
      await pool.execute(
        `INSERT INTO return_request_items (return_id, order_item_id, quantity, condition_description)
         VALUES (?, ?, ?, ?)`,
        [returnId, item.orderItemId, item.quantity, item.conditionDescription || null]
      );
    }

    // Create notification for user
    await this.createNotification(
      pool, user.userId, 'return_update',
      'Return Request Created',
      `Your return request #${returnNumber} has been submitted and is pending review.`,
      `/account/returns/${returnId}`
    );

    return {
      returnId,
      returnNumber,
      refundAmount,
      message: 'Return request created successfully. We will review it within 1-2 business days.',
    };
  }

  private async cancelReturn(returnId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE return_requests SET status = 'cancelled', updated_at = NOW()
       WHERE return_id = ? AND user_id = ? AND status = 'pending'`,
      [returnId, user.userId]
    );

    if (result.affectedRows === 0) {
      throw new ApiError('Return request not found or cannot be cancelled', 404);
    }

    return { message: 'Return request cancelled successfully' };
  }

  // ==================== REVIEWS ====================

  private async getUserReviews(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('product_reviews');

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const [reviews] = await pool.execute<RowDataPacket[]>(
      `SELECT
        pr.review_id, pr.product_id, pr.rating, pr.title, pr.review_text, pr.pros, pr.cons,
        pr.is_verified_purchase, pr.is_recommended, pr.status, pr.helpful_count, pr.not_helpful_count,
        pr.admin_response, pr.admin_response_at, pr.created_at,
        p.product_name, p.sku
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.product_id
       WHERE pr.user_id = ?
       ORDER BY pr.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [user.userId]
    );

    const [countResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM product_reviews WHERE user_id = ?',
      [user.userId]
    );

    return {
      reviews,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  private async getReview(reviewId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    const [reviews] = await pool.execute<RowDataPacket[]>(
      `SELECT
        pr.*, p.product_name, p.sku
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.product_id
       WHERE pr.review_id = ? AND pr.user_id = ?`,
      [reviewId, user.userId]
    );

    if (reviews.length === 0) {
      throw new ApiError('Review not found', 404);
    }

    // Get review images
    const [images] = await pool.execute<RowDataPacket[]>(
      'SELECT image_id, image_url, image_order FROM review_images WHERE review_id = ? ORDER BY image_order',
      [reviewId]
    );

    return {
      review: reviews[0],
      images,
    };
  }

  private async getPendingReviewItems(user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    // Get delivered order items that haven't been reviewed yet
    const [items] = await pool.execute<RowDataPacket[]>(
      `SELECT
        oi.order_item_id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
        o.order_number, o.created_at as order_date,
        p.product_name, p.sku,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       JOIN products p ON oi.product_id = p.product_id
       LEFT JOIN product_reviews pr ON pr.product_id = p.product_id AND pr.user_id = o.user_id
       WHERE o.user_id = ?
         AND o.status = 'delivered'
         AND pr.review_id IS NULL
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [user.userId]
    );

    return { pendingReviews: items };
  }

  private async getProductReviews(productId: string, req: NextRequest) {
    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const sortBy = searchParams.get('sortBy') || 'recent';

    let orderBy = 'pr.created_at DESC';
    if (sortBy === 'helpful') orderBy = 'pr.helpful_count DESC';
    else if (sortBy === 'rating_high') orderBy = 'pr.rating DESC';
    else if (sortBy === 'rating_low') orderBy = 'pr.rating ASC';

    const [reviews] = await pool.execute<RowDataPacket[]>(
      `SELECT
        pr.review_id, pr.rating, pr.title, pr.review_text, pr.pros, pr.cons,
        pr.is_verified_purchase, pr.is_recommended, pr.helpful_count, pr.not_helpful_count,
        pr.admin_response, pr.admin_response_at, pr.created_at,
        u.first_name, SUBSTRING(u.last_name, 1, 1) as last_initial
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.user_id
       WHERE pr.product_id = ? AND pr.status = 'approved'
       ORDER BY ${orderBy}
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [productId]
    );

    // Get review stats
    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
        SUM(CASE WHEN is_recommended = true THEN 1 ELSE 0 END) as recommend_count
       FROM product_reviews
       WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );

    return {
      reviews,
      stats: stats[0],
      pagination: {
        page,
        limit,
        total: stats[0].total_reviews,
        totalPages: Math.ceil(stats[0].total_reviews / limit),
      },
    };
  }

  private async createReview(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('product_reviews');

    const body = await req.json();
    const data = CreateReviewSchema.parse(body);

    const pool = await getPool();

    // Check if user already reviewed this product
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT review_id FROM product_reviews WHERE user_id = ? AND product_id = ?',
      [user.userId, data.productId]
    );

    if (existing.length > 0) {
      throw new ApiError('You have already reviewed this product', 400);
    }

    // Check if this is a verified purchase
    const [purchases] = await pool.execute<RowDataPacket[]>(
      `SELECT oi.order_item_id FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
       LIMIT 1`,
      [user.userId, data.productId]
    );

    const isVerifiedPurchase = purchases.length > 0;

    // Create review (pending approval)
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO product_reviews
       (product_id, user_id, order_id, order_item_id, rating, title, review_text, pros, cons,
        is_verified_purchase, is_recommended, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.productId, user.userId, data.orderId || null, data.orderItemId || null,
        data.rating, data.title || null, data.reviewText || null, data.pros || null, data.cons || null,
        isVerifiedPurchase, data.isRecommended
      ]
    );

    // Award loyalty points for leaving a review
    await this.awardLoyaltyPoints(pool, user.userId, 50, 'review', 'Points earned for leaving a product review', result.insertId);

    return {
      reviewId: result.insertId,
      isVerifiedPurchase,
      message: 'Review submitted successfully. It will be visible after approval.',
    };
  }

  private async updateReview(reviewId: string, req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const body = await req.json();
    const data = UpdateReviewSchema.parse(body);

    const pool = await getPool();

    // Verify ownership
    const [reviews] = await pool.execute<RowDataPacket[]>(
      'SELECT review_id, status FROM product_reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, user.userId]
    );

    if (reviews.length === 0) {
      throw new ApiError('Review not found', 404);
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (data.rating !== undefined) { updates.push('rating = ?'); params.push(data.rating); }
    if (data.title !== undefined) { updates.push('title = ?'); params.push(data.title); }
    if (data.reviewText !== undefined) { updates.push('review_text = ?'); params.push(data.reviewText); }
    if (data.pros !== undefined) { updates.push('pros = ?'); params.push(data.pros); }
    if (data.cons !== undefined) { updates.push('cons = ?'); params.push(data.cons); }
    if (data.isRecommended !== undefined) { updates.push('is_recommended = ?'); params.push(data.isRecommended); }

    if (updates.length > 0) {
      updates.push('status = ?');
      params.push('pending'); // Reset to pending for re-approval
      updates.push('updated_at = NOW()');
      params.push(reviewId);

      await pool.execute(
        `UPDATE product_reviews SET ${updates.join(', ')} WHERE review_id = ?`,
        params
      );
    }

    return { message: 'Review updated successfully. It will be re-reviewed.' };
  }

  private async deleteReview(reviewId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM product_reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, user.userId]
    );

    if (result.affectedRows === 0) {
      throw new ApiError('Review not found', 404);
    }

    return { message: 'Review deleted successfully' };
  }

  private async voteReview(reviewId: string, req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const body = await req.json();
    const data = ReviewVoteSchema.parse(body);

    const pool = await getPool();

    // Check if user already voted
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT vote_id, is_helpful FROM review_votes WHERE review_id = ? AND user_id = ?',
      [reviewId, user.userId]
    );

    if (existing.length > 0) {
      // Update existing vote
      if (existing[0].is_helpful !== data.isHelpful) {
        await pool.execute(
          'UPDATE review_votes SET is_helpful = ? WHERE vote_id = ?',
          [data.isHelpful, existing[0].vote_id]
        );

        // Update counts
        if (data.isHelpful) {
          await pool.execute(
            'UPDATE product_reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE review_id = ?',
            [reviewId]
          );
        } else {
          await pool.execute(
            'UPDATE product_reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE review_id = ?',
            [reviewId]
          );
        }
      }
    } else {
      // Create new vote
      await pool.execute(
        'INSERT INTO review_votes (review_id, user_id, is_helpful) VALUES (?, ?, ?)',
        [reviewId, user.userId, data.isHelpful]
      );

      // Update count
      if (data.isHelpful) {
        await pool.execute('UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE review_id = ?', [reviewId]);
      } else {
        await pool.execute('UPDATE product_reviews SET not_helpful_count = not_helpful_count + 1 WHERE review_id = ?', [reviewId]);
      }
    }

    return { message: 'Vote recorded' };
  }

  // ==================== NOTIFICATIONS ====================

  private async getNotifications(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('user_notifications');

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = `
      SELECT notification_id, type, title, message, link, is_read, read_at, metadata, created_at
      FROM user_notifications
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const params: any[] = [user.userId];

    if (unreadOnly) {
      query += ' AND is_read = false';
    }

    query += ` ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [notifications] = await pool.execute<RowDataPacket[]>(query, params);

    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM user_notifications
       WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())${unreadOnly ? ' AND is_read = false' : ''}`,
      unreadOnly ? [user.userId] : [user.userId]
    );

    return {
      notifications,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  private async getUnreadNotificationCount(user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('user_notifications');

    const pool = await getPool();

    const [result] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM user_notifications
       WHERE user_id = ? AND is_read = false AND (expires_at IS NULL OR expires_at > NOW())`,
      [user.userId]
    );

    return { unreadCount: result[0].count };
  }

  private async markNotificationRead(notificationId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    await pool.execute(
      'UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE notification_id = ? AND user_id = ?',
      [notificationId, user.userId]
    );

    return { message: 'Notification marked as read' };
  }

  private async markAllNotificationsRead(user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    await pool.execute(
      'UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE user_id = ? AND is_read = false',
      [user.userId]
    );

    return { message: 'All notifications marked as read' };
  }

  private async deleteNotification(notificationId: string, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    await pool.execute(
      'DELETE FROM user_notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, user.userId]
    );

    return { message: 'Notification deleted' };
  }

  // Helper method to create notifications
  private async createNotification(
    pool: any, userId: number, type: string, title: string, message: string, link?: string, metadata?: any
  ) {
    await pool.execute(
      `INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, link || null, metadata ? JSON.stringify(metadata) : null]
    );
  }

  private async createNotificationForRole(
    pool: any, role: string, type: string, title: string, message: string, link?: string
  ) {
    const [users] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM users WHERE role = ?',
      [role]
    );

    for (const user of users) {
      await this.createNotification(pool, user.user_id, type, title, message, link);
    }
  }

  // ==================== COMMUNICATION PREFERENCES ====================

  private async getPreferences(user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    const [preferences] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_communication_preferences WHERE user_id = ?',
      [user.userId]
    );

    if (preferences.length === 0) {
      // Return defaults
      return {
        preferences: {
          emailOrderUpdates: true,
          emailShippingUpdates: true,
          emailPromotions: true,
          emailNewsletter: false,
          emailReviewReminders: true,
          emailSupportUpdates: true,
          smsOrderUpdates: false,
          smsShippingUpdates: false,
          smsPromotions: false,
          pushOrderUpdates: true,
          pushPromotions: false,
        },
      };
    }

    // Transform snake_case to camelCase
    const pref = preferences[0];
    return {
      preferences: {
        emailOrderUpdates: pref.email_order_updates,
        emailShippingUpdates: pref.email_shipping_updates,
        emailPromotions: pref.email_promotions,
        emailNewsletter: pref.email_newsletter,
        emailReviewReminders: pref.email_review_reminders,
        emailSupportUpdates: pref.email_support_updates,
        smsOrderUpdates: pref.sms_order_updates,
        smsShippingUpdates: pref.sms_shipping_updates,
        smsPromotions: pref.sms_promotions,
        pushOrderUpdates: pref.push_order_updates,
        pushPromotions: pref.push_promotions,
      },
    };
  }

  private async updatePreferences(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const body = await req.json();
    const data = UpdatePreferencesSchema.parse(body);

    const pool = await getPool();

    // Check if preferences exist
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT preference_id FROM user_communication_preferences WHERE user_id = ?',
      [user.userId]
    );

    if (existing.length === 0) {
      // Insert new preferences
      await pool.execute(
        `INSERT INTO user_communication_preferences (user_id,
          email_order_updates, email_shipping_updates, email_promotions, email_newsletter,
          email_review_reminders, email_support_updates, sms_order_updates, sms_shipping_updates,
          sms_promotions, push_order_updates, push_promotions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.userId,
          data.emailOrderUpdates ?? true, data.emailShippingUpdates ?? true, data.emailPromotions ?? true,
          data.emailNewsletter ?? false, data.emailReviewReminders ?? true, data.emailSupportUpdates ?? true,
          data.smsOrderUpdates ?? false, data.smsShippingUpdates ?? false, data.smsPromotions ?? false,
          data.pushOrderUpdates ?? true, data.pushPromotions ?? false
        ]
      );
    } else {
      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (data.emailOrderUpdates !== undefined) { updates.push('email_order_updates = ?'); params.push(data.emailOrderUpdates); }
      if (data.emailShippingUpdates !== undefined) { updates.push('email_shipping_updates = ?'); params.push(data.emailShippingUpdates); }
      if (data.emailPromotions !== undefined) { updates.push('email_promotions = ?'); params.push(data.emailPromotions); }
      if (data.emailNewsletter !== undefined) { updates.push('email_newsletter = ?'); params.push(data.emailNewsletter); }
      if (data.emailReviewReminders !== undefined) { updates.push('email_review_reminders = ?'); params.push(data.emailReviewReminders); }
      if (data.emailSupportUpdates !== undefined) { updates.push('email_support_updates = ?'); params.push(data.emailSupportUpdates); }
      if (data.smsOrderUpdates !== undefined) { updates.push('sms_order_updates = ?'); params.push(data.smsOrderUpdates); }
      if (data.smsShippingUpdates !== undefined) { updates.push('sms_shipping_updates = ?'); params.push(data.smsShippingUpdates); }
      if (data.smsPromotions !== undefined) { updates.push('sms_promotions = ?'); params.push(data.smsPromotions); }
      if (data.pushOrderUpdates !== undefined) { updates.push('push_order_updates = ?'); params.push(data.pushOrderUpdates); }
      if (data.pushPromotions !== undefined) { updates.push('push_promotions = ?'); params.push(data.pushPromotions); }

      if (updates.length > 0) {
        params.push(user.userId);
        await pool.execute(
          `UPDATE user_communication_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
          params
        );
      }
    }

    return { message: 'Preferences updated successfully' };
  }

  // ==================== LOYALTY PROGRAM ====================

  private async getLoyaltyInfo(user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('loyalty_points');

    const pool = await getPool();

    const [loyalty] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM loyalty_points WHERE user_id = ?',
      [user.userId]
    );

    if (loyalty.length === 0) {
      // Create initial loyalty record
      await pool.execute(
        'INSERT INTO loyalty_points (user_id, points, lifetime_points, tier) VALUES (?, 0, 0, "bronze")',
        [user.userId]
      );

      return {
        points: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        pointsToNextTier: 500,
        nextTier: 'silver',
      };
    }

    const info = loyalty[0];
    const tierThresholds = { bronze: 0, silver: 500, gold: 2000, platinum: 5000 };
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentTierIndex = tierOrder.indexOf(info.tier);
    const nextTier = currentTierIndex < tierOrder.length - 1 ? tierOrder[currentTierIndex + 1] : null;
    const pointsToNextTier = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] - info.lifetime_points : 0;

    return {
      points: info.points,
      lifetimePoints: info.lifetime_points,
      tier: info.tier,
      tierUpdatedAt: info.tier_updated_at,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      nextTier,
    };
  }

  private async getLoyaltyHistory(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const [history] = await pool.execute<RowDataPacket[]>(
      `SELECT history_id, points_change, balance_after, type, description, reference_type, reference_id, expires_at, created_at
       FROM loyalty_points_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [user.userId]
    );

    const [countResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM loyalty_points_history WHERE user_id = ?',
      [user.userId]
    );

    return {
      history,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  private async getLoyaltyTiers() {
    return {
      tiers: [
        {
          name: 'Bronze',
          minPoints: 0,
          benefits: ['1 point per $1 spent', 'Birthday bonus (50 points)', 'Exclusive member offers'],
        },
        {
          name: 'Silver',
          minPoints: 500,
          benefits: ['1.25 points per $1 spent', 'Birthday bonus (100 points)', 'Early access to sales', 'Free shipping on orders $100+'],
        },
        {
          name: 'Gold',
          minPoints: 2000,
          benefits: ['1.5 points per $1 spent', 'Birthday bonus (200 points)', 'Priority customer support', 'Free shipping on all orders', 'Exclusive Gold member discounts'],
        },
        {
          name: 'Platinum',
          minPoints: 5000,
          benefits: ['2 points per $1 spent', 'Birthday bonus (500 points)', 'Dedicated account manager', 'Free express shipping', 'Exclusive Platinum events', '10% off all purchases'],
        },
      ],
    };
  }

  private async redeemPoints(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const body = await req.json();
    const data = RedeemPointsSchema.parse(body);

    const pool = await getPool();

    // Get current points
    const [loyalty] = await pool.execute<RowDataPacket[]>(
      'SELECT points FROM loyalty_points WHERE user_id = ?',
      [user.userId]
    );

    if (loyalty.length === 0 || loyalty[0].points < data.points) {
      throw new ApiError('Insufficient points', 400);
    }

    // Calculate value (100 points = $1)
    const value = data.points / 100;

    // Deduct points
    await pool.execute(
      'UPDATE loyalty_points SET points = points - ? WHERE user_id = ?',
      [data.points, user.userId]
    );

    // Record history
    const [currentPoints] = await pool.execute<RowDataPacket[]>(
      'SELECT points FROM loyalty_points WHERE user_id = ?',
      [user.userId]
    );

    await pool.execute(
      `INSERT INTO loyalty_points_history (user_id, points_change, balance_after, type, description, reference_type)
       VALUES (?, ?, ?, 'redeemed', ?, ?)`,
      [user.userId, -data.points, currentPoints[0].points, `Redeemed ${data.points} points for $${value.toFixed(2)} ${data.useFor}`, data.useFor]
    );

    return {
      pointsRedeemed: data.points,
      dollarValue: value,
      remainingPoints: currentPoints[0].points,
      message: `Successfully redeemed ${data.points} points for $${value.toFixed(2)}`,
    };
  }

  // Helper method to award loyalty points
  private async awardLoyaltyPoints(
    pool: any, userId: number, points: number, referenceType: string, description: string, referenceId?: number
  ) {
    // Ensure loyalty record exists
    await pool.execute(
      `INSERT INTO loyalty_points (user_id, points, lifetime_points, tier)
       VALUES (?, ?, ?, 'bronze')
       ON DUPLICATE KEY UPDATE points = points + ?, lifetime_points = lifetime_points + ?`,
      [userId, points, points, points, points]
    );

    // Get new balance
    const [balance] = await pool.execute<RowDataPacket[]>(
      'SELECT points, lifetime_points FROM loyalty_points WHERE user_id = ?',
      [userId]
    );

    // Record history
    await pool.execute(
      `INSERT INTO loyalty_points_history (user_id, points_change, balance_after, type, description, reference_type, reference_id)
       VALUES (?, ?, ?, 'earned', ?, ?, ?)`,
      [userId, points, balance[0].points, description, referenceType, referenceId || null]
    );

    // Check for tier upgrade
    const lifetimePoints = balance[0].lifetime_points;
    let newTier = 'bronze';
    if (lifetimePoints >= 5000) newTier = 'platinum';
    else if (lifetimePoints >= 2000) newTier = 'gold';
    else if (lifetimePoints >= 500) newTier = 'silver';

    const [current] = await pool.execute<RowDataPacket[]>(
      'SELECT tier FROM loyalty_points WHERE user_id = ?',
      [userId]
    );

    if (current[0].tier !== newTier) {
      await pool.execute(
        'UPDATE loyalty_points SET tier = ?, tier_updated_at = NOW() WHERE user_id = ?',
        [newTier, userId]
      );

      // Notify user of tier upgrade
      await this.createNotification(
        pool, userId, 'system',
        `Congratulations! You're now ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}!`,
        `You've been upgraded to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} tier! Enjoy your new benefits.`,
        '/account/loyalty'
      );
    }
  }

  // ==================== REFERRAL PROGRAM ====================

  private generateReferralCodeString(userId: number): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF${userId}${random}`;
  }

  private async getReferralInfo(user: any) {
    if (!user) throw new ApiError('Authentication required', 401);
    await this.ensureTableExists('referral_codes');

    const pool = await getPool();

    // Get or create referral code
    let [codes] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM referral_codes WHERE user_id = ?',
      [user.userId]
    );

    if (codes.length === 0) {
      // Create referral code
      const code = this.generateReferralCodeString(user.userId);
      await pool.execute(
        `INSERT INTO referral_codes (user_id, code, discount_type, discount_value, is_active)
         VALUES (?, ?, 'percentage', 10.00, true)`,
        [user.userId, code]
      );

      [codes] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM referral_codes WHERE user_id = ?',
        [user.userId]
      );
    }

    // Get referral stats
    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'completed' OR status = 'rewarded' THEN 1 ELSE 0 END) as successful_referrals,
        SUM(CASE WHEN status = 'rewarded' THEN referrer_reward_points ELSE 0 END) as total_points_earned
       FROM referrals WHERE referrer_user_id = ?`,
      [user.userId]
    );

    const codeInfo = codes[0];

    return {
      code: codeInfo.code,
      discountType: codeInfo.discount_type,
      discountValue: parseFloat(codeInfo.discount_value),
      isActive: codeInfo.is_active,
      timesUsed: codeInfo.times_used,
      maxUses: codeInfo.max_uses,
      stats: {
        totalReferrals: parseInt(stats[0].total_referrals) || 0,
        successfulReferrals: parseInt(stats[0].successful_referrals) || 0,
        totalPointsEarned: parseInt(stats[0].total_points_earned) || 0,
      },
      rewardInfo: {
        referrerReward: '500 loyalty points per successful referral',
        referredDiscount: `${codeInfo.discount_value}% off first order`,
      },
    };
  }

  private async getReferralHistory(req: NextRequest, user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);

    const [referrals] = await pool.execute<RowDataPacket[]>(
      `SELECT
        r.referral_id, r.status, r.referrer_reward_points, r.created_at, r.completed_at, r.rewarded_at,
        u.first_name, SUBSTRING(u.last_name, 1, 1) as last_initial
       FROM referrals r
       JOIN users u ON r.referred_user_id = u.user_id
       WHERE r.referrer_user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [user.userId]
    );

    const [countResult] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM referrals WHERE referrer_user_id = ?',
      [user.userId]
    );

    return {
      referrals,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  private async generateReferralCode(user: any) {
    if (!user) throw new ApiError('Authentication required', 401);

    const pool = await getPool();

    // Check if user already has a code
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT code FROM referral_codes WHERE user_id = ?',
      [user.userId]
    );

    if (existing.length > 0) {
      return { code: existing[0].code, message: 'You already have a referral code' };
    }

    // Create new code
    const code = this.generateReferralCodeString(user.userId);
    await pool.execute(
      `INSERT INTO referral_codes (user_id, code, discount_type, discount_value, is_active)
       VALUES (?, ?, 'percentage', 10.00, true)`,
      [user.userId, code]
    );

    return { code, message: 'Referral code generated successfully' };
  }
}
