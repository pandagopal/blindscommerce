import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();

    // Get total users
    const [usersResult] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const totalUsers = (usersResult as any[])[0].count;

    // Get total vendors
    const [vendorsResult] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM users u 
      WHERE u.role = 'vendor' AND u.is_active = 1
    `);
    const totalVendors = (vendorsResult as any[])[0].count;

    // Get total orders
    const [ordersResult] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const totalOrders = (ordersResult as any[])[0].count || 0;

    // Get total revenue
    const [revenueResult] = await pool.execute(`
      SELECT SUM(final_total) as revenue 
      FROM orders 
      WHERE status NOT IN ('cancelled', 'refunded')
    `);
    const totalRevenue = (revenueResult as any[])[0].revenue || 0;

    // Get database size (approximate)
    const [dbSizeResult] = await pool.execute(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS db_size_mb
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    const dbSizeMB = (dbSizeResult as any[])[0].db_size_mb || 0;

      // Mock some system stats (in a real system, these would come from system monitoring)
      const stats = {
        totalUsers: parseInt(totalUsers),
        totalVendors: parseInt(totalVendors),
        totalOrders: parseInt(totalOrders),
        totalRevenue: parseFloat(totalRevenue),
        systemUptime: '45 days, 12 hours', // Mock data
        serverHealth: 'excellent',
        databaseSize: `${dbSizeMB} MB`,
        lastBackup: '2 hours ago', // Mock data
        securityAlerts: 3, // Mock data
        apiRequests24h: 45623 // Mock data
      };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  }
}