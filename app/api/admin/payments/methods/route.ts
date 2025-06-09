import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const pool = await getPool();

    // Get payment method configurations
    const [methods] = await pool.execute(`
      SELECT 
        pmc.*,
        COALESCE(stats.total_transactions, 0) as total_transactions,
        COALESCE(stats.success_rate, 0) as success_rate
      FROM payment_method_configurations pmc
      LEFT JOIN (
        SELECT 
          provider,
          COUNT(*) as total_transactions,
          AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_rate
        FROM payment_intents 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY provider
      ) stats ON pmc.provider = stats.provider
      ORDER BY pmc.display_name
    `);

    return NextResponse.json({
      success: true,
      payment_methods: methods
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment methods' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Method ID is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Update payment method status
    await pool.execute(`
      UPDATE payment_method_configurations 
      SET is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [is_active, id]);

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}