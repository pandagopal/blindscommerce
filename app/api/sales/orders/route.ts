import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SalesOrder extends RowDataPacket {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  commission_rate: number;
  commission_amount: number;
  created_at: Date;
  updated_at: Date;
}

// GET /api/sales/orders - Get orders for sales person
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const month = searchParams.get('month'); // Format: YYYY-MM

    const pool = await getPool();

    // Build query
    let query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email,
        COALESCE(ss.commission_rate, 5.0) as commission_rate,
        ROUND(o.total_amount * COALESCE(ss.commission_rate, 5.0) / 100, 2) as commission_amount
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN sales_staff ss ON o.sales_staff_id = ss.sales_staff_id
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    // Filter by sales person if not admin
    if (user.role === 'sales') {
      query += ' AND o.sales_staff_id = ?';
      queryParams.push(user.userId);
    }

    // Filter by status
    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      queryParams.push(status);
    }

    // Filter by month
    if (month) {
      query += ' AND DATE_FORMAT(o.created_at, "%Y-%m") = ?';
      queryParams.push(month);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [orders] = await pool.execute<SalesOrder[]>(query, queryParams);

    // Get summary statistics
    const [stats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.total_amount * COALESCE(ss.commission_rate, 5.0) / 100), 0) as total_commission
      FROM orders o
      LEFT JOIN sales_staff ss ON o.sales_staff_id = ss.sales_staff_id
      WHERE o.status IN ('processing', 'shipped', 'delivered')
        ${user.role === 'sales' ? 'AND o.sales_staff_id = ?' : ''}
        ${month ? 'AND DATE_FORMAT(o.created_at, "%Y-%m") = ?' : ''}`,
      user.role === 'sales' 
        ? (month ? [user.userId, month] : [user.userId])
        : (month ? [month] : [])
    );

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders o WHERE 1=1';
    const countParams: any[] = [];

    if (user.role === 'sales') {
      countQuery += ' AND o.sales_staff_id = ?';
      countParams.push(user.userId);
    }

    if (status && status !== 'all') {
      countQuery += ' AND o.status = ?';
      countParams.push(status);
    }

    if (month) {
      countQuery += ' AND DATE_FORMAT(o.created_at, "%Y-%m") = ?';
      countParams.push(month);
    }

    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams);

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.order_id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        amount: parseFloat(order.total_amount.toString()),
        status: order.status,
        commissionRate: parseFloat(order.commission_rate?.toString() || '5.0'),
        commissionAmount: parseFloat(order.commission_amount?.toString() || '0'),
        createdAt: order.created_at,
        updatedAt: order.updated_at
      })),
      stats: {
        totalOrders: parseInt(stats[0].total_orders.toString()),
        totalRevenue: parseFloat(stats[0].total_revenue.toString()),
        totalCommission: parseFloat(stats[0].total_commission.toString())
      },
      pagination: {
        total: parseInt(countResult[0].total.toString()),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult[0].total.toString())
      }
    });

  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}