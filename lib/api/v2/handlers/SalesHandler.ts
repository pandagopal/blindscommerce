/**
 * Sales Handler for V2 API
 * Handles sales-related endpoints: leads, orders, quotes
 */

import { NextRequest } from 'next/server';
import { BaseHandler, ApiError } from '@/lib/api/v2/BaseHandler';
import { getPool } from '@/lib/db';

export class SalesHandler extends BaseHandler {
  /**
   * Handle GET requests
   */
  async handleGET(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'leads': () => this.getLeads(req, user),
      'leads/:id': () => this.getLead(action[1], user),
      'orders': () => this.getOrders(req, user),
      'orders/:id': () => this.getOrder(action[1], user),
      'orders/export': () => this.exportOrders(req, user),
      'dashboard': () => this.getDashboard(user),
      'analytics': () => this.getAnalytics(req, user),
      'status': () => this.getSalesStatus(user),
      'assistance/cart': () => this.getAssistanceCart(req, user),
      'profile': () => this.getSalesProfile(user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'leads': () => this.createLead(req, user),
      'auto-online': () => this.setAutoOnline(user),
      'assistance/accept': () => this.acceptAssistanceRequest(req, user),
      'assistance/cart': () => this.modifyAssistanceCart(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PATCH requests
   */
  async handlePATCH(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'leads/:id': () => this.updateLead(action[1], req, user),
      'orders/:id': () => this.updateOrder(action[1], req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle PUT requests
   */
  async handlePUT(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'status': () => this.updateSalesStatus(req, user),
      'profile': () => this.updateSalesProfile(req, user),
    };

    return this.routeAction(action, routes);
  }

  /**
   * Get all leads with stats
   */
  private async getLeads(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    let whereClause = '1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      whereClause += ' AND l.status = ?';
      params.push(status);
    }

    if (source && source !== 'all') {
      whereClause += ' AND l.source = ?';
      params.push(source);
    }

    // Only show leads assigned to this user, unless admin
    if (user.role !== 'admin') {
      whereClause += ' AND l.assigned_to = ?';
      params.push(user.user_id);
    }

    // Get leads - use query() instead of execute() for LIMIT/OFFSET with dynamic values
    const [leads] = await pool.query(
      `SELECT
        l.lead_id as id,
        l.name,
        l.email,
        l.phone,
        l.company as product_interest,
        l.source,
        CASE l.status
          WHEN 'negotiating' THEN 'negotiation'
          ELSE l.status
        END as status,
        l.priority,
        l.notes,
        l.created_at,
        l.updated_at,
        l.last_contact,
        COALESCE(l.next_follow_up, DATE_ADD(l.created_at, INTERVAL 7 DAY)) as next_follow_up,
        COALESCE(l.estimated_value, 0) as estimated_value,
        CONCAT(up.first_name, ' ', up.last_name) as assigned_to
      FROM leads l
      LEFT JOIN user_profiles up ON l.assigned_to = up.user_id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM leads l WHERE ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Get stats
    const [statsResult] = await pool.execute(
      `SELECT
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
        SUM(CASE WHEN status IN ('qualified', 'proposal', 'negotiating') THEN 1 ELSE 0 END) as qualified_leads,
        ROUND(SUM(CASE WHEN status = 'closed_won' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as conversion_rate,
        ROUND(AVG(CASE WHEN estimated_value > 0 THEN estimated_value ELSE NULL END), 2) as avg_deal_value,
        SUM(CASE WHEN status NOT IN ('closed_won', 'closed_lost') THEN COALESCE(estimated_value, 0) ELSE 0 END) as pipeline_value
      FROM leads l
      WHERE ${user.role === 'admin' ? '1=1' : 'l.assigned_to = ?'}`,
      user.role === 'admin' ? [] : [user.user_id]
    );

    const statsRow = (statsResult as any[])[0];
    const stats = {
      total_leads: statsRow.total_leads || 0,
      new_leads: statsRow.new_leads || 0,
      qualified_leads: statsRow.qualified_leads || 0,
      conversion_rate: parseFloat(statsRow.conversion_rate) || 0,
      avg_deal_value: parseFloat(statsRow.avg_deal_value) || 0,
      pipeline_value: parseFloat(statsRow.pipeline_value) || 0
    };

    return {
      leads: leads || [],
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get single lead
   */
  private async getLead(id: string, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const leadId = parseInt(id);
    if (isNaN(leadId)) {
      throw new ApiError('Invalid lead ID', 400);
    }

    const pool = await getPool();

    const [leads] = await pool.execute(
      `SELECT
        l.*,
        CONCAT(up.first_name, ' ', up.last_name) as assigned_to_name
      FROM leads l
      LEFT JOIN user_profiles up ON l.assigned_to = up.user_id
      WHERE l.lead_id = ?`,
      [leadId]
    );

    if ((leads as any[]).length === 0) {
      throw new ApiError('Lead not found', 404);
    }

    return (leads as any[])[0];
  }

  /**
   * Create new lead
   */
  private async createLead(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const body = await this.getBody(req);
    const { name, email, phone, source, status, priority, product_interest, notes, estimated_value } = body;

    if (!name || !email) {
      throw new ApiError('Name and email are required', 400);
    }

    const pool = await getPool();

    const [result] = await pool.execute(
      `INSERT INTO leads (name, email, phone, source, status, priority, company, notes, estimated_value, assigned_to, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        email,
        phone || null,
        source || 'website',
        status || 'new',
        priority || 'medium',
        product_interest || null,
        notes || null,
        estimated_value || 0,
        user.user_id
      ]
    );

    return {
      message: 'Lead created successfully',
      lead_id: (result as any).insertId
    };
  }

  /**
   * Update lead
   */
  private async updateLead(id: string, req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const leadId = parseInt(id);
    if (isNaN(leadId)) {
      throw new ApiError('Invalid lead ID', 400);
    }

    const body = await this.getBody(req);
    const { status, notes, priority, last_contact } = body;

    const pool = await getPool();

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      // Map frontend status to database status
      const dbStatus = status === 'negotiation' ? 'negotiating' : status;
      updates.push('status = ?');
      params.push(dbStatus);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (last_contact !== undefined) {
      updates.push('last_contact = ?');
      params.push(last_contact);
    }

    if (updates.length === 0) {
      throw new ApiError('No fields to update', 400);
    }

    params.push(leadId);

    await pool.execute(
      `UPDATE leads SET ${updates.join(', ')} WHERE lead_id = ?`,
      params
    );

    return { message: 'Lead updated successfully' };
  }

  /**
   * Get sales orders
   */
  private async getOrders(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const { page, limit, offset } = this.getPagination(searchParams);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let whereClause = '1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // Get orders (all orders for sales reps, not just their own)
    const [orders] = await pool.execute(
      `SELECT
        o.order_id as id,
        o.order_number,
        CONCAT(usa.first_name, ' ', usa.last_name) as customer_name,
        usa.email as customer_email,
        usa.phone as customer_phone,
        o.status,
        'medium' as priority,
        o.total_amount,
        ROUND(o.total_amount * 0.05, 2) as commission_amount,
        5.0 as commission_rate,
        o.created_at as order_date,
        DATE_ADD(o.created_at, INTERVAL 14 DAY) as expected_delivery,
        CONCAT(usa.address_line_1, ', ', usa.city, ', ', usa.state_province, ' ', usa.postal_code) as shipping_address,
        'Sales Team' as sales_rep,
        COALESCE(
          (SELECT vi.business_name
           FROM order_items oi
           LEFT JOIN vendor_info vi ON oi.vendor_id = vi.vendor_info_id
           WHERE oi.order_id = o.order_id
           LIMIT 1),
          'Smart Blinds Hub'
        ) as vendor,
        o.notes,
        NULL as tracking_number
      FROM orders o
      LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    // Get order items for each order
    for (const order of orders as any[]) {
      const [items] = await pool.execute(
        `SELECT
          oi.order_item_id as id,
          p.name as product_name,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          p.sku,
          oi.product_options as customizations
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items || [];
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(DISTINCT o.order_id) as total FROM orders o WHERE ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // Get stats
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const [statsResult] = await pool.execute(
      `SELECT
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.created_at >= ? THEN o.total_amount ELSE 0 END) as monthly_revenue,
        ROUND(SUM(CASE WHEN o.created_at >= ? THEN o.total_amount * 0.05 ELSE 0 END), 2) as commission_earned,
        ROUND(AVG(o.total_amount), 2) as avg_order_value,
        ROUND(SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as conversion_rate
      FROM orders o`,
      [firstDayOfMonth.toISOString(), firstDayOfMonth.toISOString()]
    );

    const statsRow = (statsResult as any[])[0];
    const stats = {
      total_orders: statsRow.total_orders || 0,
      pending_orders: statsRow.pending_orders || 0,
      monthly_revenue: parseFloat(statsRow.monthly_revenue) || 0,
      commission_earned: parseFloat(statsRow.commission_earned) || 0,
      avg_order_value: parseFloat(statsRow.avg_order_value) || 0,
      conversion_rate: parseFloat(statsRow.conversion_rate) || 0
    };

    return {
      orders: orders || [],
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get single order
   */
  private async getOrder(id: string, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const pool = await getPool();

    const [orders] = await pool.execute(
      `SELECT
        o.*,
        CONCAT(usa.first_name, ' ', usa.last_name) as customer_name,
        usa.email as customer_email,
        usa.phone as customer_phone,
        CONCAT(usa.address_line_1, ', ', usa.city, ', ', usa.state_province, ' ', usa.postal_code) as shipping_address
      FROM orders o
      LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
      WHERE o.order_id = ?`,
      [orderId]
    );

    if ((orders as any[]).length === 0) {
      throw new ApiError('Order not found', 404);
    }

    const order = (orders as any[])[0];

    // Get items
    const [items] = await pool.execute(
      `SELECT
        oi.order_item_id as id,
        p.name as product_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.sku,
        oi.product_options as customizations
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    order.items = items;

    return order;
  }

  /**
   * Update order status
   */
  private async updateOrder(id: string, req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      throw new ApiError('Invalid order ID', 400);
    }

    const body = await this.getBody(req);
    const { status, notes, tracking_number } = body;

    const pool = await getPool();

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (tracking_number !== undefined) {
      updates.push('tracking_number = ?');
      params.push(tracking_number);
    }

    if (updates.length === 0) {
      throw new ApiError('No fields to update', 400);
    }

    params.push(orderId);

    await pool.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`,
      params
    );

    return { message: 'Order updated successfully' };
  }

  /**
   * Export orders
   */
  private async exportOrders(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const searchParams = this.getSearchParams(req);
    const type = searchParams.get('type') || 'all';

    const pool = await getPool();

    let whereClause = '1=1';
    if (type === 'pending') {
      whereClause = "o.status = 'pending'";
    } else if (type === 'completed') {
      whereClause = "o.status = 'delivered'";
    }

    const [orders] = await pool.execute(
      `SELECT
        o.order_number,
        CONCAT(usa.first_name, ' ', usa.last_name) as customer_name,
        usa.email as customer_email,
        o.status,
        o.total_amount,
        o.created_at as order_date
      FROM orders o
      LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.address_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC`
    );

    // Generate CSV
    const headers = ['Order Number', 'Customer Name', 'Email', 'Status', 'Total', 'Order Date'];
    const rows = (orders as any[]).map(o => [
      o.order_number,
      o.customer_name,
      o.customer_email,
      o.status,
      o.total_amount,
      o.order_date
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=sales-orders-${type}-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  }

  /**
   * Get sales dashboard data
   */
  private async getDashboard(user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const pool = await getPool();

    // Get summary stats
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const [orderStats] = await pool.execute(
      `SELECT
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        ROUND(SUM(o.total_amount * 0.05), 2) as total_commission,
        ROUND(AVG(o.total_amount), 2) as avg_order_value
      FROM orders o
      WHERE o.created_at >= ?`,
      [firstDayOfMonth.toISOString()]
    );

    const [leadStats] = await pool.execute(
      `SELECT
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
        SUM(CASE WHEN status = 'closed_won' THEN 1 ELSE 0 END) as won_leads
      FROM leads
      WHERE created_at >= ?`,
      [firstDayOfMonth.toISOString()]
    );

    return {
      orders: (orderStats as any[])[0],
      leads: (leadStats as any[])[0]
    };
  }

  /**
   * Get sales analytics data
   */
  private async getAnalytics(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const pool = await getPool();
    const searchParams = this.getSearchParams(req);
    const timeframe = searchParams.get('timeframe') || 'month';

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Revenue over time (daily breakdown)
    const [revenueData] = await pool.execute(
      `SELECT
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [startDate.toISOString()]
    );

    // Sales by category
    const [categoryData] = await pool.execute(
      `SELECT
        COALESCE(c.name, 'Uncategorized') as category,
        SUM(oi.total_price) as revenue,
        COUNT(DISTINCT o.order_id) as orders
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE o.created_at >= ?
      GROUP BY c.category_id, c.name
      ORDER BY revenue DESC
      LIMIT 10`,
      [startDate.toISOString()]
    );

    // Top products
    const [topProducts] = await pool.execute(
      `SELECT
        p.name as product,
        SUM(oi.quantity) as quantity,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE o.created_at >= ?
      GROUP BY p.product_id, p.name
      ORDER BY revenue DESC
      LIMIT 10`,
      [startDate.toISOString()]
    );

    // Lead conversion funnel
    const [leadFunnel] = await pool.execute(
      `SELECT
        status,
        COUNT(*) as count
      FROM leads
      WHERE created_at >= ?
      GROUP BY status`,
      [startDate.toISOString()]
    );

    // Summary statistics
    const [summary] = await pool.execute(
      `SELECT
        COUNT(DISTINCT o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        ROUND(COALESCE(SUM(o.total_amount), 0) * 0.05, 2) as total_commission
      FROM orders o
      WHERE o.created_at >= ?`,
      [startDate.toISOString()]
    );

    const [leadSummary] = await pool.execute(
      `SELECT
        COUNT(*) as total_leads,
        SUM(CASE WHEN status = 'closed_won' THEN 1 ELSE 0 END) as converted_leads,
        ROUND(SUM(CASE WHEN status = 'closed_won' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as conversion_rate
      FROM leads
      WHERE created_at >= ?`,
      [startDate.toISOString()]
    );

    const summaryRow = (summary as any[])[0];
    const leadSummaryRow = (leadSummary as any[])[0];

    return {
      timeframe,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      summary: {
        totalOrders: summaryRow.total_orders || 0,
        totalRevenue: parseFloat(summaryRow.total_revenue) || 0,
        avgOrderValue: parseFloat(summaryRow.avg_order_value) || 0,
        totalCommission: parseFloat(summaryRow.total_commission) || 0,
        totalLeads: leadSummaryRow.total_leads || 0,
        convertedLeads: leadSummaryRow.converted_leads || 0,
        conversionRate: parseFloat(leadSummaryRow.conversion_rate) || 0
      },
      revenueOverTime: revenueData || [],
      salesByCategory: categoryData || [],
      topProducts: topProducts || [],
      leadFunnel: leadFunnel || []
    };
  }

  /**
   * Get sales status for assistance dashboard
   */
  private async getSalesStatus(user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const pool = await getPool();

    // Get sales_staff_id for this user
    const [staffRows] = await pool.execute(
      `SELECT sales_staff_id FROM sales_staff WHERE user_id = ?`,
      [user.user_id]
    );

    let salesStaffId = null;
    if ((staffRows as any[]).length > 0) {
      salesStaffId = (staffRows as any[])[0].sales_staff_id;
    }

    // Get or create sales status for this user
    let status = {
      isOnline: false,
      isAvailableForAssistance: false,
      currentActiveSessions: 0,
      maxConcurrentSessions: 5,
      notificationPreferences: {}
    };

    if (salesStaffId) {
      const [existingStatus] = await pool.execute(
        `SELECT * FROM sales_staff_online_status WHERE sales_staff_id = ?`,
        [salesStaffId]
      );

      if ((existingStatus as any[]).length > 0) {
        const row = (existingStatus as any[])[0];
        status = {
          isOnline: row.is_online === 1,
          isAvailableForAssistance: row.is_available_for_assistance === 1,
          currentActiveSessions: row.current_active_sessions || 0,
          maxConcurrentSessions: row.max_concurrent_sessions || 5,
          notificationPreferences: row.notification_preferences ? (typeof row.notification_preferences === 'string' ? JSON.parse(row.notification_preferences) : row.notification_preferences) : {}
        };
      }
    }

    // Get active assistance sessions
    let activeSessions: any[] = [];
    if (salesStaffId) {
      const [sessions] = await pool.execute(
        `SELECT
          sas.session_id,
          sas.customer_user_id,
          sas.session_type,
          sas.permissions,
          up.first_name,
          up.last_name,
          u.email
        FROM sales_assistance_sessions sas
        JOIN users u ON sas.customer_user_id = u.user_id
        LEFT JOIN user_profiles up ON u.user_id = up.user_id
        WHERE sas.sales_staff_id = ? AND sas.status = 'active'`,
        [salesStaffId]
      );

      activeSessions = (sessions as any[]).map(s => ({
        sessionId: s.session_id,
        customer: {
          userId: s.customer_user_id,
          firstName: s.first_name || 'Customer',
          lastName: s.last_name || '',
          email: s.email
        },
        sessionType: s.session_type || 'cart_assistance',
        permissions: s.permissions ? (typeof s.permissions === 'string' ? JSON.parse(s.permissions) : s.permissions) : { viewCart: true, modifyCart: false }
      }));
    }

    return {
      status,
      activeSessions
    };
  }

  /**
   * Auto-set online status when dashboard loads
   */
  private async setAutoOnline(user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const pool = await getPool();

    // Get or create sales_staff record
    let salesStaffId: number;
    const [staffRows] = await pool.execute(
      `SELECT sales_staff_id FROM sales_staff WHERE user_id = ?`,
      [user.user_id]
    );

    if ((staffRows as any[]).length === 0) {
      // Create sales_staff record
      const [result] = await pool.execute(
        `INSERT INTO sales_staff (user_id, is_active, start_date) VALUES (?, 1, CURDATE())`,
        [user.user_id]
      );
      salesStaffId = (result as any).insertId;
    } else {
      salesStaffId = (staffRows as any[])[0].sales_staff_id;
    }

    // Check if status record exists
    const [existing] = await pool.execute(
      `SELECT * FROM sales_staff_online_status WHERE sales_staff_id = ?`,
      [salesStaffId]
    );

    if ((existing as any[]).length === 0) {
      // Create new status record
      await pool.execute(
        `INSERT INTO sales_staff_online_status (sales_staff_id, is_online, is_available_for_assistance, current_active_sessions, max_concurrent_sessions)
         VALUES (?, 1, 1, 0, 5)`,
        [salesStaffId]
      );
    } else {
      // Update existing record
      await pool.execute(
        `UPDATE sales_staff_online_status SET is_online = 1, is_available_for_assistance = 1, last_activity = NOW() WHERE sales_staff_id = ?`,
        [salesStaffId]
      );
    }

    return {
      status: {
        isOnline: true,
        isAvailableForAssistance: true,
        currentActiveSessions: 0,
        maxConcurrentSessions: 5,
        notificationPreferences: {}
      }
    };
  }

  /**
   * Update sales status
   */
  private async updateSalesStatus(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const body = await this.getBody(req);
    const { isOnline, isAvailableForAssistance } = body;

    const pool = await getPool();

    // Get sales_staff_id
    const [staffRows] = await pool.execute(
      `SELECT sales_staff_id FROM sales_staff WHERE user_id = ?`,
      [user.user_id]
    );

    if ((staffRows as any[]).length === 0) {
      throw new ApiError('Sales staff record not found', 404);
    }

    const salesStaffId = (staffRows as any[])[0].sales_staff_id;

    // Check if status record exists
    const [existing] = await pool.execute(
      `SELECT * FROM sales_staff_online_status WHERE sales_staff_id = ?`,
      [salesStaffId]
    );

    if ((existing as any[]).length === 0) {
      // Create new status record
      await pool.execute(
        `INSERT INTO sales_staff_online_status (sales_staff_id, is_online, is_available_for_assistance, current_active_sessions, max_concurrent_sessions)
         VALUES (?, ?, ?, 0, 5)`,
        [salesStaffId, isOnline ? 1 : 0, isAvailableForAssistance ? 1 : 0]
      );
    } else {
      // Update existing record
      const updates: string[] = [];
      const params: any[] = [];

      if (isOnline !== undefined) {
        updates.push('is_online = ?');
        params.push(isOnline ? 1 : 0);
        if (isOnline) {
          updates.push('last_activity = NOW()');
        }
      }
      if (isAvailableForAssistance !== undefined) {
        updates.push('is_available_for_assistance = ?');
        params.push(isAvailableForAssistance ? 1 : 0);
      }

      if (updates.length > 0) {
        params.push(salesStaffId);
        await pool.execute(
          `UPDATE sales_staff_online_status SET ${updates.join(', ')} WHERE sales_staff_id = ?`,
          params
        );
      }
    }

    return { message: 'Status updated successfully' };
  }

  /**
   * Accept customer assistance request with PIN
   */
  private async acceptAssistanceRequest(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const body = await this.getBody(req);
    const { accessPin } = body;

    if (!accessPin || accessPin.length !== 8) {
      throw new ApiError('Invalid PIN format. Please enter an 8-digit PIN.', 400);
    }

    const pool = await getPool();

    // Get sales_staff_id
    const [staffRows] = await pool.execute(
      `SELECT sales_staff_id FROM sales_staff WHERE user_id = ?`,
      [user.user_id]
    );

    if ((staffRows as any[]).length === 0) {
      throw new ApiError('Sales staff record not found', 404);
    }

    const salesStaffId = (staffRows as any[])[0].sales_staff_id;

    // Find assistance session by PIN (pending status)
    const [sessions] = await pool.execute(
      `SELECT
        sas.session_id,
        sas.customer_user_id,
        sas.session_type,
        sas.permissions,
        sas.customer_cart_id,
        up.first_name,
        up.last_name,
        u.email
      FROM sales_assistance_sessions sas
      JOIN users u ON sas.customer_user_id = u.user_id
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE sas.access_pin = ? AND sas.status = 'pending' AND sas.expires_at > NOW()`,
      [accessPin]
    );

    if ((sessions as any[]).length === 0) {
      throw new ApiError('Invalid or expired PIN. Please ask the customer for a new PIN.', 404);
    }

    const session = (sessions as any[])[0];

    // Update session to active and assign sales staff
    await pool.execute(
      `UPDATE sales_assistance_sessions SET status = 'active', sales_staff_id = ?, accepted_at = NOW() WHERE session_id = ?`,
      [salesStaffId, session.session_id]
    );

    // Update sales rep active sessions count
    await pool.execute(
      `UPDATE sales_staff_online_status SET current_active_sessions = current_active_sessions + 1 WHERE sales_staff_id = ?`,
      [salesStaffId]
    );

    // Get customer cart
    let cartDetails = null;
    const [carts] = await pool.execute(
      `SELECT c.cart_id, c.status,
        COALESCE(SUM(ci.quantity * ci.unit_price), 0) as total_amount,
        COUNT(ci.cart_item_id) as item_count
      FROM carts c
      LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
      WHERE c.user_id = ? AND c.status = 'active'
      GROUP BY c.cart_id`,
      [session.customer_user_id]
    );

    if ((carts as any[]).length > 0) {
      const cart = (carts as any[])[0];
      const [items] = await pool.execute(
        `SELECT
          ci.cart_item_id,
          ci.product_id,
          p.name as product_name,
          COALESCE(vi.business_name, 'Smart Blinds Hub') as vendor_name,
          ci.quantity,
          ci.unit_price,
          ci.quantity * ci.unit_price as line_total,
          ci.discount_amount,
          ci.coupon_code
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        LEFT JOIN vendor_info vi ON p.vendor_id = vi.vendor_info_id
        WHERE ci.cart_id = ?`,
        [cart.cart_id]
      );

      cartDetails = {
        cartId: cart.cart_id,
        status: cart.status,
        totalAmount: parseFloat(cart.total_amount) || 0,
        itemCount: cart.item_count || 0,
        items: items || []
      };
    }

    return {
      sessionId: session.session_id,
      customer: {
        userId: session.customer_user_id,
        firstName: session.first_name || 'Customer',
        lastName: session.last_name || '',
        email: session.email
      },
      sessionType: session.session_type || 'cart_assistance',
      permissions: session.permissions ? (typeof session.permissions === 'string' ? JSON.parse(session.permissions) : session.permissions) : { viewCart: true, modifyCart: true },
      cartDetails
    };
  }

  /**
   * Get customer cart for assistance session
   */
  private async getAssistanceCart(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const searchParams = this.getSearchParams(req);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      throw new ApiError('Session ID is required', 400);
    }

    const pool = await getPool();

    // Get sales_staff_id
    const [staffRows] = await pool.execute(
      `SELECT sales_staff_id FROM sales_staff WHERE user_id = ?`,
      [user.user_id]
    );

    if ((staffRows as any[]).length === 0) {
      throw new ApiError('Sales staff record not found', 404);
    }

    const salesStaffId = (staffRows as any[])[0].sales_staff_id;

    // Verify session belongs to this sales rep
    const [sessions] = await pool.execute(
      `SELECT customer_user_id FROM sales_assistance_sessions WHERE session_id = ? AND sales_staff_id = ? AND status = 'active'`,
      [sessionId, salesStaffId]
    );

    if ((sessions as any[]).length === 0) {
      throw new ApiError('Session not found or not authorized', 404);
    }

    const customerId = (sessions as any[])[0].customer_user_id;

    // Get customer cart
    const [carts] = await pool.execute(
      `SELECT c.cart_id, c.status,
        COALESCE(SUM(ci.quantity * ci.unit_price), 0) as total_amount,
        COUNT(ci.cart_item_id) as item_count
      FROM carts c
      LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
      WHERE c.user_id = ? AND c.status = 'active'
      GROUP BY c.cart_id`,
      [customerId]
    );

    if ((carts as any[]).length === 0) {
      return { cart: null };
    }

    const cart = (carts as any[])[0];
    const [items] = await pool.execute(
      `SELECT
        ci.cart_item_id,
        ci.product_id,
        p.name as product_name,
        COALESCE(vi.business_name, 'Smart Blinds Hub') as vendor_name,
        ci.quantity,
        ci.unit_price,
        ci.quantity * ci.unit_price as line_total,
        ci.discount_amount,
        ci.coupon_code
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      LEFT JOIN vendor_info vi ON p.vendor_id = vi.vendor_info_id
      WHERE ci.cart_id = ?`,
      [cart.cart_id]
    );

    return {
      cart: {
        cartId: cart.cart_id,
        status: cart.status,
        totalAmount: parseFloat(cart.total_amount) || 0,
        itemCount: cart.item_count || 0,
        items: items || []
      }
    };
  }

  /**
   * Modify customer cart during assistance session
   */
  private async modifyAssistanceCart(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const body = await this.getBody(req);
    const { sessionId, action, itemId, quantity, discountAmount } = body;

    if (!sessionId || !action) {
      throw new ApiError('Session ID and action are required', 400);
    }

    const pool = await getPool();

    // Get sales_staff_id
    const [staffRows] = await pool.execute(
      `SELECT sales_staff_id FROM sales_staff WHERE user_id = ?`,
      [user.user_id]
    );

    if ((staffRows as any[]).length === 0) {
      throw new ApiError('Sales staff record not found', 404);
    }

    const salesStaffId = (staffRows as any[])[0].sales_staff_id;

    // Verify session and get customer ID
    const [sessions] = await pool.execute(
      `SELECT customer_user_id, permissions FROM sales_assistance_sessions
       WHERE session_id = ? AND sales_staff_id = ? AND status = 'active'`,
      [sessionId, salesStaffId]
    );

    if ((sessions as any[]).length === 0) {
      throw new ApiError('Session not found or not authorized', 404);
    }

    const session = (sessions as any[])[0];
    const permissions = session.permissions ? (typeof session.permissions === 'string' ? JSON.parse(session.permissions) : session.permissions) : {};

    if (!permissions.modifyCart) {
      throw new ApiError('You do not have permission to modify this cart', 403);
    }

    // Get customer's active cart
    const [carts] = await pool.execute(
      `SELECT cart_id FROM carts WHERE user_id = ? AND status = 'active'`,
      [session.customer_user_id]
    );

    if ((carts as any[]).length === 0) {
      throw new ApiError('Customer has no active cart', 404);
    }

    const cartId = (carts as any[])[0].cart_id;

    switch (action) {
      case 'update_quantity':
        if (!itemId || quantity === undefined) {
          throw new ApiError('Item ID and quantity are required', 400);
        }
        await pool.execute(
          `UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND cart_id = ?`,
          [quantity, itemId, cartId]
        );
        break;

      case 'apply_discount':
        if (!itemId || discountAmount === undefined) {
          throw new ApiError('Item ID and discount amount are required', 400);
        }
        await pool.execute(
          `UPDATE cart_items SET discount_amount = ? WHERE cart_item_id = ? AND cart_id = ?`,
          [discountAmount, itemId, cartId]
        );
        break;

      case 'remove_item':
        if (!itemId) {
          throw new ApiError('Item ID is required', 400);
        }
        await pool.execute(
          `DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?`,
          [itemId, cartId]
        );
        break;

      default:
        throw new ApiError(`Unknown action: ${action}`, 400);
    }

    return { message: 'Cart updated successfully' };
  }

  /**
   * Get sales profile
   */
  private async getSalesProfile(user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const pool = await getPool();

    // Get user profile
    const [userProfiles] = await pool.execute(
      `SELECT
        u.user_id,
        u.email,
        up.first_name,
        up.last_name,
        up.phone,
        up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      WHERE u.user_id = ?`,
      [user.user_id]
    );

    if ((userProfiles as any[]).length === 0) {
      throw new ApiError('User not found', 404);
    }

    const userProfile = (userProfiles as any[])[0];

    // Get sales staff profile
    const [staffProfiles] = await pool.execute(
      `SELECT
        ss.sales_staff_id,
        ss.territory,
        ss.specialization,
        ss.experience_years,
        ss.availability_schedule,
        ss.hourly_rate,
        ss.rating,
        ss.total_consultations,
        ss.commission_rate,
        ss.target_sales,
        ss.total_sales,
        ss.start_date
      FROM sales_staff ss
      WHERE ss.user_id = ?`,
      [user.user_id]
    );

    let salesProfile = null;
    if ((staffProfiles as any[]).length > 0) {
      const sp = (staffProfiles as any[])[0];
      salesProfile = {
        salesStaffId: sp.sales_staff_id,
        territory: sp.territory,
        specialization: sp.specialization,
        experienceYears: sp.experience_years,
        availabilitySchedule: sp.availability_schedule ? (typeof sp.availability_schedule === 'string' ? JSON.parse(sp.availability_schedule) : sp.availability_schedule) : null,
        hourlyRate: parseFloat(sp.hourly_rate) || 0,
        rating: parseFloat(sp.rating) || 0,
        totalConsultations: sp.total_consultations || 0,
        commissionRate: parseFloat(sp.commission_rate) || 0,
        targetSales: parseFloat(sp.target_sales) || 0,
        totalSales: parseFloat(sp.total_sales) || 0,
        startDate: sp.start_date
      };
    }

    // Get vendor info - use default company info for sales reps
    // Sales reps work for the main company, so we use company defaults
    const [vendorInfoRows] = await pool.execute(
      `SELECT
        vi.business_name,
        vi.business_email,
        vi.business_phone
      FROM vendor_info vi
      WHERE vi.user_id = ?
      LIMIT 1`,
      [user.user_id]
    );

    // Default to Smart Blinds Hub company info if no vendor record exists
    let vendorInfo = {
      companyName: 'Smart Blinds Hub',
      contactEmail: 'sales@smartblindshub.com',
      contactPhone: '1-800-555-0199'
    };

    if ((vendorInfoRows as any[]).length > 0) {
      const vi = (vendorInfoRows as any[])[0];
      vendorInfo = {
        companyName: vi.business_name || 'Smart Blinds Hub',
        contactEmail: vi.business_email || 'sales@smartblindshub.com',
        contactPhone: vi.business_phone || '1-800-555-0199'
      };
    }

    return {
      profile: {
        userId: userProfile.user_id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        phone: userProfile.phone,
        avatarUrl: userProfile.avatar_url,
        vendorInfo,
        ...salesProfile
      }
    };
  }

  /**
   * Update sales profile
   */
  private async updateSalesProfile(req: NextRequest, user: any) {
    this.requireRole(user, 'SALES_REPRESENTATIVE');

    const body = await this.getBody(req);
    const { firstName, lastName, phone, territory, specialization, availabilitySchedule } = body;

    const pool = await getPool();

    // Update user profile
    const profileUpdates: string[] = [];
    const profileParams: any[] = [];

    if (firstName !== undefined) {
      profileUpdates.push('first_name = ?');
      profileParams.push(firstName);
    }
    if (lastName !== undefined) {
      profileUpdates.push('last_name = ?');
      profileParams.push(lastName);
    }
    if (phone !== undefined) {
      profileUpdates.push('phone = ?');
      profileParams.push(phone);
    }

    if (profileUpdates.length > 0) {
      profileParams.push(user.user_id);
      await pool.execute(
        `UPDATE user_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
        profileParams
      );
    }

    // Update sales staff profile
    const staffUpdates: string[] = [];
    const staffParams: any[] = [];

    if (territory !== undefined) {
      staffUpdates.push('territory = ?');
      staffParams.push(territory);
    }
    if (specialization !== undefined) {
      staffUpdates.push('specialization = ?');
      staffParams.push(specialization);
    }
    if (availabilitySchedule !== undefined) {
      staffUpdates.push('availability_schedule = ?');
      staffParams.push(JSON.stringify(availabilitySchedule));
    }

    if (staffUpdates.length > 0) {
      staffParams.push(user.user_id);
      await pool.execute(
        `UPDATE sales_staff SET ${staffUpdates.join(', ')} WHERE user_id = ?`,
        staffParams
      );
    }

    return { message: 'Profile updated successfully' };
  }

  /**
   * Helper method to get request body
   */
  protected async getRequestBody(req: NextRequest): Promise<any> {
    try {
      return await req.json();
    } catch {
      return {};
    }
  }
}
