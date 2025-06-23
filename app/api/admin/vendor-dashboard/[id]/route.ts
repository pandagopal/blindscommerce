import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  date: string;
  customer: string;
  total: number;
  status: string;
  items: number;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const vendorUserId = parseInt(id);
    if (isNaN(vendorUserId)) {
      return NextResponse.json({ error: 'Invalid vendor ID' }, { status: 400 });
    }

    const pool = await getPool();

    // Verify the user is a vendor
    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT role FROM users WHERE user_id = ?',
      [vendorUserId]
    );

    if (!userRows || userRows.length === 0 || userRows[0].role !== 'vendor') {
      return NextResponse.json({ error: 'User is not a vendor' }, { status: 400 });
    }

    // Get vendor_info_id
    const [vendorRows] = await pool.execute<RowDataPacket[]>(
      'SELECT vendor_info_id FROM vendor_info WHERE user_id = ?',
      [vendorUserId]
    );

    if (!vendorRows || vendorRows.length === 0) {
      return NextResponse.json({ error: 'Vendor info not found' }, { status: 404 });
    }

    const vendorInfoId = vendorRows[0].vendor_info_id;

    // Get dashboard stats
    const [statsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COALESCE(SUM(o.total_amount), 0) as totalSales,
        COUNT(DISTINCT o.order_id) as totalOrders,
        COUNT(DISTINCT vp.product_id) as totalProducts,
        COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'processing') THEN o.order_id END) as pendingOrders
      FROM vendor_info v
      LEFT JOIN vendor_products vp ON v.vendor_info_id = vp.vendor_id
      LEFT JOIN order_items oi ON vp.vendor_id = oi.vendor_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE v.vendor_info_id = ?`,
      [vendorInfoId]
    );

    const stats: DashboardStats = {
      totalSales: statsRows[0]?.totalSales || 0,
      totalOrders: statsRows[0]?.totalOrders || 0,
      totalProducts: statsRows[0]?.totalProducts || 0,
      pendingOrders: statsRows[0]?.pendingOrders || 0,
    };

    // Get recent orders
    const [orderRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        o.order_id as id,
        o.created_at as date,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as customer,
        o.total_amount as total,
        o.status,
        COUNT(oi.order_item_id) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE oi.vendor_id = ?
      GROUP BY o.order_id, o.created_at, u.first_name, u.last_name, o.total_amount, o.status
      ORDER BY o.created_at DESC
      LIMIT 10`,
      [vendorInfoId]
    );

    const recentOrders: RecentOrder[] = orderRows.map(row => ({
      id: row.id.toString(),
      date: row.date,
      customer: row.customer.trim() || 'Guest',
      total: parseFloat(row.total) || 0,
      status: row.status || 'Unknown',
      items: row.items || 0,
    }));

    return NextResponse.json({
      stats,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      vendorUserId: vendorUserId
    });
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}