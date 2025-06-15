import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SampleOrderRow extends RowDataPacket {
  sample_order_id: number;
  order_id: string;
  shipping_name: string;
  sample_count: number;
  total_amount: number;
  status: string;
  priority: string;
  tracking_number?: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface SampleItemRow extends RowDataPacket {
  swatch_name: string;
  material_name: string;
  category_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const pool = await getPool();

    // Get user's sample orders
    const [orderRows] = await pool.execute<SampleOrderRow[]>(
      `SELECT 
        sample_order_id,
        order_id,
        shipping_name,
        sample_count,
        total_amount,
        status,
        priority,
        tracking_number,
        created_at,
        shipped_at,
        delivered_at
      FROM sample_orders 
      WHERE user_id = ? OR email = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`,
      [user.userId, user.email, limit, offset]
    );

    // Get sample items for each order
    const ordersWithItems = await Promise.all(
      orderRows.map(async (order) => {
        const [itemRows] = await pool.execute<SampleItemRow[]>(
          `SELECT 
            ms.name as swatch_name,
            ms.material_name,
            c.name as category_name
          FROM sample_order_items soi
          LEFT JOIN material_swatches ms ON soi.swatch_id = ms.swatch_id
          LEFT JOIN categories c ON ms.category_id = c.category_id
          WHERE soi.sample_order_id = ?`,
          [order.sample_order_id]
        );

        return {
          ...order,
          items: itemRows,
        };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        limit,
        offset,
        total: orderRows.length,
      },
    });

  } catch (error) {
    console.error('Error fetching customer sample orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample orders' },
      { status: 500 }
    );
  }
}