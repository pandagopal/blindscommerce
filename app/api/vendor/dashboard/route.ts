import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DashboardStats extends RowDataPacket {
  total_sales: number;
  total_orders: number;
  total_products: number;
  pending_orders: number;
}

interface RecentOrder extends RowDataPacket {
  order_id: string;
  created_at: string;
  customer_name: string;
  total_amount: number;
  status: string;
  items_count: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    const userId = user.userId;

    // Get vendor_id from vendor_info table
    const [vendorData] = await pool.execute<RowDataPacket[]>(
      `SELECT vendor_info_id as vendor_id FROM vendor_info WHERE user_id = ?`,
      [userId]
    );
    
    if (!vendorData[0]) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendorId = vendorData[0].vendor_id;

    // Get dashboard statistics
    const [stats] = await pool.execute<DashboardStats[]>(
      `SELECT 
        COALESCE(SUM(CASE WHEN o.status IN ('delivered', 'completed') THEN o.total_amount ELSE 0 END), 0) as total_sales,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT vp.product_id) as total_products,
        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.order_id END) as pending_orders
      FROM vendor_products vp
      LEFT JOIN order_items oi ON vp.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE vp.vendor_id = ?`,
      [vendorId]
    );

    // Get recent orders with customer information
    const [recentOrders] = await pool.execute<RecentOrder[]>(
      `SELECT 
        o.order_id,
        o.created_at,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as customer_name,
        o.total_amount,
        o.status,
        COUNT(oi.order_item_id) as items_count
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN vendor_products vp ON oi.product_id = vp.product_id
      JOIN users u ON o.user_id = u.user_id
      WHERE vp.vendor_id = ?
      GROUP BY o.order_id, o.created_at, u.first_name, u.last_name, o.total_amount, o.status
      ORDER BY o.created_at DESC
      LIMIT 10`,
      [vendorId]
    );

    const dashboardData = {
      stats: {
        totalSales: Number(stats[0]?.total_sales) || 0,
        totalOrders: Number(stats[0]?.total_orders) || 0,
        totalProducts: Number(stats[0]?.total_products) || 0,
        pendingOrders: Number(stats[0]?.pending_orders) || 0,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.order_id,
        date: order.created_at,
        customer: order.customer_name.trim() || 'Unknown Customer',
        total: Number(order.total_amount),
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        items: Number(order.items_count)
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}