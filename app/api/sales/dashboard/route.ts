import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    
    // Check for AdminViewId header (for admin viewing another user's dashboard)
    const adminViewId = request.headers.get('x-admin-view-id');
    const effectiveUserId = (user.role === 'admin' && adminViewId) ? parseInt(adminViewId) : user.userId;

    // Get sales performance data
    const [salesMetrics] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(DISTINCT o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      WHERE o.status IN ('processing', 'shipped', 'delivered')
        AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${user.role === 'sales' ? 'AND o.sales_staff_id = ?' : ''}`,
      user.role === 'sales' ? [user.userId] : []
    );

    // Get monthly revenue trend
    const [monthlyTrend] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month,
        COUNT(*) as orders,
        SUM(o.total_amount) as revenue
      FROM orders o
      WHERE o.status IN ('processing', 'shipped', 'delivered')
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        ${user.role === 'sales' ? 'AND o.sales_staff_id = ?' : ''}
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12`,
      user.role === 'sales' ? [user.userId] : []
    );

    // Get top products
    const [topProducts] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        p.name,
        COUNT(oi.product_id) as quantity_sold,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status IN ('processing', 'shipped', 'delivered')
        AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${user.role === 'sales' ? 'AND o.sales_staff_id = ?' : ''}
      GROUP BY p.product_id, p.name
      ORDER BY revenue DESC
      LIMIT 10`,
      user.role === 'sales' ? [user.userId] : []
    );

    // Get commission data for sales users
    let commissionData = null;
    if (user.role === 'sales') {
      const [commissions] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          COALESCE(SUM(o.total_amount * 0.05), 0) as total_commission,
          COUNT(*) as qualifying_orders
        FROM orders o
        WHERE o.sales_staff_id = ?
          AND o.status IN ('processing', 'shipped', 'delivered')
          AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
        [user.userId]
      );
      commissionData = commissions[0];
    }

    return NextResponse.json({
      metrics: salesMetrics[0],
      monthlyTrend: monthlyTrend.reverse(), // Show oldest to newest
      topProducts,
      commissionData
    });

  } catch (error) {
    console.error('Error fetching sales dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}