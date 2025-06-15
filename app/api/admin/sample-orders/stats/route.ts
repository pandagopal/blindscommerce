import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface StatsRow extends RowDataPacket {
  total_orders: number;
  pending_orders: number;
  shipped_today: number;
  avg_processing_hours: number;
}

interface MaterialStatsRow extends RowDataPacket {
  material_name: string;
  request_count: number;
}

export async function GET() {
  try {
    const pool = await getPool();

    // Get basic stats
    const [statsRows] = await pool.execute<StatsRow[]>(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN DATE(shipped_at) = CURDATE() THEN 1 ELSE 0 END) as shipped_today,
        COALESCE(AVG(CASE 
          WHEN shipped_at IS NOT NULL AND status != 'cancelled' 
          THEN TIMESTAMPDIFF(HOUR, created_at, shipped_at) 
        END), 0) as avg_processing_hours
      FROM sample_orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    // Get top materials
    const [materialRows] = await pool.execute<MaterialStatsRow[]>(
      `SELECT 
        ms.material_name,
        COUNT(*) as request_count
      FROM sample_order_items soi
      JOIN material_swatches ms ON soi.swatch_id = ms.swatch_id
      JOIN sample_orders so ON soi.sample_order_id = so.sample_order_id
      WHERE so.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY ms.material_name
      ORDER BY request_count DESC
      LIMIT 10`
    );

    const stats = statsRows[0] || {
      total_orders: 0,
      pending_orders: 0,
      shipped_today: 0,
      avg_processing_hours: 0,
    };

    const topMaterials = materialRows.map(row => ({
      material: row.material_name,
      count: row.request_count,
    }));

    return NextResponse.json({
      stats: {
        totalOrders: stats.total_orders,
        pendingOrders: stats.pending_orders,
        shippedToday: stats.shipped_today,
        avgProcessingTime: Math.round(stats.avg_processing_hours),
        topMaterials,
      },
    });

  } catch (error) {
    console.error('Error fetching sample stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample statistics' },
      { status: 500 }
    );
  }
}