import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();

    // Get dashboard statistics
    const [[stats]] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE user_id = ?) as totalOrders,
        (SELECT COUNT(*) FROM measurements WHERE user_id = ?) as savedMeasurements,
        (SELECT COUNT(*) FROM product_configurations WHERE user_id = ? AND status = 'active') as activeConfigurations,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = ?) as wishlistItems
      `,
      [user.userId, user.userId, user.userId, user.userId]
    );

    // Get recent orders
    const [recentOrders] = await pool.execute(`
      SELECT o.*, op.product_name, op.quantity, op.price
      FROM orders o
      JOIN order_products op ON o.order_id = op.order_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [user.userId]);

    // Get saved measurements
    const [savedMeasurements] = await pool.execute(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM window_measurements wm WHERE wm.measurement_id = m.measurement_id) as window_count
      FROM measurements m
      WHERE m.user_id = ?
      ORDER BY m.updated_at DESC
      LIMIT 5
    `, [user.userId]);

    // Get active configurations
    const [configurations] = await pool.execute(`
      SELECT pc.*, p.name as product_name
      FROM product_configurations pc
      JOIN products p ON pc.product_id = p.product_id
      WHERE pc.user_id = ?
      AND pc.status = 'active'
      ORDER BY pc.updated_at DESC
      LIMIT 5
    `, [user.userId]);

    return NextResponse.json({
      stats,
      recentOrders,
      savedMeasurements,
      configurations
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
