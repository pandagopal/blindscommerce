import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      // Get total revenue and orders
      const [[revenue]] = await connection.execute(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(*) as total_orders,
          AVG(total_amount) as average_order_value
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Get customer stats
      const [[customerStats]] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT user_id) as total_customers,
          SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_customers
        FROM users
        WHERE role = 'CUSTOMER'
      `);

      // Get pending orders
      const [[{ pending_orders }]] = await connection.execute(`
        SELECT COUNT(*) as pending_orders
        FROM orders
        WHERE status IN ('pending', 'processing')
      `);

      // Get stock alerts
      const [[{ stock_alerts }]] = await connection.execute(`
        SELECT COUNT(*) as stock_alerts
        FROM products
        WHERE stock_quantity <= reorder_point
      `);

      // Get daily sales for the past 30 days
      const [recentSales] = await connection.execute(`
        SELECT 
          DATE(created_at) as date,
          SUM(total_amount) as amount
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      // Get customer growth
      const [customerGrowth] = await connection.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_customers,
          SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total
        FROM users
        WHERE 
          role = 'CUSTOMER'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      return NextResponse.json({
        totalRevenue: revenue.total_revenue || 0,
        totalOrders: revenue.total_orders || 0,
        averageOrderValue: revenue.average_order_value || 0,
        totalCustomers: customerStats.total_customers || 0,
        activeCustomers: customerStats.active_customers || 0,
        pendingOrders: pending_orders || 0,
        stockAlerts: stock_alerts || 0,
        recentSales,
        customerGrowth
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
