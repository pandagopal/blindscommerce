import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SampleOrderRow extends RowDataPacket {
  sample_order_id: number;
  order_id: string;
  user_id?: number;
  email: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  priority: string;
  sample_count: number;
  sample_fees: number;
  shipping_fee: number;
  total_amount: number;
  status: string;
  tracking_number?: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface SampleItemRow extends RowDataPacket {
  item_id: number;
  swatch_id: string;
  swatch_name: string;
  material_name: string;
  category_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const pool = await getPool();

    let query = `
      SELECT 
        so.*
      FROM sample_orders so
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (status && status !== 'all') {
      query += ' AND so.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY so.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [orderRows] = await pool.execute<SampleOrderRow[]>(query, queryParams);

    // Get sample items for each order
    const ordersWithItems = await Promise.all(
      orderRows.map(async (order) => {
        const [itemRows] = await pool.execute<SampleItemRow[]>(
          `SELECT 
            soi.item_id,
            soi.swatch_id,
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
    console.error('Error fetching sample orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sample orders' },
      { status: 500 }
    );
  }
}