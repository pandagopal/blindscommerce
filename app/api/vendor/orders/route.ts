import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = await getPool();
    const query = `
      SELECT DISTINCT
        o.order_id as orderId,
        o.order_number as orderNumber,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        o.created_at as orderDate,
        os.name as status,
        o.total_amount as total
      FROM
        orders o
      JOIN
        order_items oi ON o.order_id = oi.order_id
      JOIN
        products p ON oi.product_id = p.product_id
      JOIN
        vendor_info vi ON p.vendor_info_id = vi.vendor_info_id
      JOIN
        users u ON o.user_id = u.user_id
      JOIN
        order_status os ON o.status_id = os.status_id
      WHERE
        vi.user_id = ?
      ORDER BY
        o.created_at DESC
    `;

    const [rows] = await pool.execute(query, [user.userId]);
    return NextResponse.json({ orders: rows });
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 