import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface AnalyticsRow extends RowDataPacket {
  total_sales: number;
  total_orders: number;
  total_products: number;
  avg_rating: number;
  revenue_this_month: number;
  revenue_last_month: number;
  orders_this_month: number;
  orders_last_month: number;
  month_name: string;
  revenue: number;
  order_count: number;
  product_name: string;
  product_sales: number;
  product_revenue: number;
  status: string;
  status_count: number;
}

// GET: Vendor analytics and performance metrics
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || '12months';

    const pool = await getPool();
    
    // Get vendor info
    const [vendorInfo] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    if (vendorInfo.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    const vendorId = vendorInfo[0].vendor_info_id;

    // Get overall statistics
    const [overallStats] = await pool.execute<AnalyticsRow[]>(
      `SELECT 
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT vp.product_id) as total_products,
        COALESCE(AVG(vr.rating), 0) as avg_rating,
        COALESCE(SUM(CASE 
          WHEN o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) 
          THEN o.total_amount ELSE 0 END), 0) as revenue_this_month,
        COALESCE(SUM(CASE 
          WHEN o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH) 
          AND o.created_at < DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)
          THEN o.total_amount ELSE 0 END), 0) as revenue_last_month,
        COUNT(DISTINCT CASE 
          WHEN o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) 
          THEN o.order_id END) as orders_this_month,
        COUNT(DISTINCT CASE 
          WHEN o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH) 
          AND o.created_at < DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)
          THEN o.order_id END) as orders_last_month
      FROM vendor_products vp
      LEFT JOIN order_items oi ON vp.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status IN ('completed', 'delivered')
      LEFT JOIN vendor_ratings vr ON vp.vendor_id = vr.vendor_id
      WHERE vp.vendor_id = ?`,
      [vendorId]
    );

    // Get monthly revenue trend (last 12 months)
    const [monthlyTrend] = await pool.execute<AnalyticsRow[]>(
      `SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month_name,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT o.order_id) as order_count
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN vendor_products vp ON oi.product_id = vp.product_id
      WHERE vp.vendor_id = ? 
        AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
        AND o.order_status IN ('completed', 'delivered')
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY month_name ASC`,
      [vendorId]
    );

    // Get top performing products
    const [topProducts] = await pool.execute<AnalyticsRow[]>(
      `SELECT 
        p.name as product_name,
        COUNT(DISTINCT oi.order_id) as product_sales,
        COALESCE(SUM(oi.total_price), 0) as product_revenue
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      LEFT JOIN order_items oi ON vp.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status IN ('completed', 'delivered')
      WHERE vp.vendor_id = ?
        AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY vp.product_id, p.name
      ORDER BY product_revenue DESC
      LIMIT 10`,
      [vendorId]
    );

    // Get order status distribution
    const [orderStatus] = await pool.execute<AnalyticsRow[]>(
      `SELECT 
        o.order_status as status,
        COUNT(*) as status_count
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN vendor_products vp ON oi.product_id = vp.product_id
      WHERE vp.vendor_id = ?
        AND o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY o.order_status
      ORDER BY status_count DESC`,
      [vendorId]
    );

    // Calculate growth rates
    const stats = overallStats[0];
    const revenueGrowth = stats.revenue_last_month > 0 
      ? ((stats.revenue_this_month - stats.revenue_last_month) / stats.revenue_last_month * 100)
      : 0;
    
    const ordersGrowth = stats.orders_last_month > 0 
      ? ((stats.orders_this_month - stats.orders_last_month) / stats.orders_last_month * 100)
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalSales: Number(stats.total_sales),
          totalOrders: Number(stats.total_orders),
          totalProducts: Number(stats.total_products),
          averageRating: Number(stats.avg_rating.toFixed(2)),
          revenueThisMonth: Number(stats.revenue_this_month),
          revenueLastMonth: Number(stats.revenue_last_month),
          ordersThisMonth: Number(stats.orders_this_month),
          ordersLastMonth: Number(stats.orders_last_month),
          revenueGrowth: Number(revenueGrowth.toFixed(2)),
          ordersGrowth: Number(ordersGrowth.toFixed(2))
        },
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.month_name,
          revenue: Number(item.revenue),
          orders: Number(item.order_count)
        })),
        topProducts: topProducts.map(item => ({
          name: item.product_name,
          sales: Number(item.product_sales),
          revenue: Number(item.product_revenue)
        })),
        orderStatus: orderStatus.map(item => ({
          status: item.status,
          count: Number(item.status_count)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor analytics' }, { status: 500 });
  }
}