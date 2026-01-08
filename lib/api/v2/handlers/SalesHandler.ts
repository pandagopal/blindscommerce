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
    };

    return this.routeAction(action, routes);
  }

  /**
   * Handle POST requests
   */
  async handlePOST(req: NextRequest, action: string[], user: any): Promise<any> {
    const routes = {
      'leads': () => this.createLead(req, user),
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
        COALESCE(vi.business_name, 'Smart Blinds Hub') as vendor,
        o.notes,
        NULL as tracking_number
      FROM orders o
      LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.shipping_address_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN vendor_info vi ON oi.vendor_id = vi.vendor_info_id
      WHERE ${whereClause}
      GROUP BY o.order_id
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
          oi.product_config as customizations
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
      LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.shipping_address_id
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
        oi.product_config as customizations
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
      LEFT JOIN user_shipping_addresses usa ON o.shipping_address_id = usa.shipping_address_id
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
