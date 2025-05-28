import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const pool = await getPool();

    let baseQuery = `
      SELECT DISTINCT
        o.order_id as orderId,
        o.order_number as orderNumber,
        CONCAT(u.first_name, ' ', u.last_name) as customerName,
        u.email as customerEmail,
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
    `;
    let countQuery = `
      SELECT COUNT(DISTINCT o.order_id) as total
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN vendor_info vi ON p.vendor_info_id = vi.vendor_info_id
      JOIN users u ON o.user_id = u.user_id
      JOIN order_status os ON o.status_id = os.status_id
      WHERE vi.user_id = ?
    `;
    const params: (string | number)[] = [user.userId];
    const countParams: (string | number)[] = [user.userId];

    if (status) {
      baseQuery += ' AND os.name = ?';
      countQuery += ' AND os.name = ?';
      params.push(status);
      countParams.push(status);
    }
    if (search) {
      baseQuery += ' AND (o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      countQuery += ' AND (o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    baseQuery += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(baseQuery, params) as any[];
    const [countRows] = await pool.execute(countQuery, countParams) as any[];
    const total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;

    return NextResponse.json({ orders: rows, total, limit, offset });
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 