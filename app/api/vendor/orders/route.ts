import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface VendorOrderRow extends RowDataPacket {
  order_id: number;
  user_id: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  vendor_items_count: number;
  vendor_items_total: number;
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  configuration: string | null;
}

// GET: Fetch vendor-specific orders
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Build query with parameters
    let query = `
      SELECT DISTINCT
        o.order_id,
        o.user_id,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        COUNT(oi.order_item_id) as vendor_items_count,
        SUM(oi.total_price) as vendor_items_total
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN vendor_products vp ON oi.product_id = vp.product_id
      JOIN users u ON o.user_id = u.user_id
      WHERE vp.vendor_id = ?
    `;
    
    const queryParams: any[] = [vendorId];
    
    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      queryParams.push(status);
    }

    query += `
      GROUP BY o.order_id, o.user_id, o.status, o.total_amount, o.created_at, o.updated_at,
               u.first_name, u.last_name, u.email, u.phone
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get orders that contain vendor's products
    const [orders] = await pool.execute<VendorOrderRow[]>(query, queryParams);

    // Get order items for each order (vendor's products only)
    const orderIds = orders.map(order => order.order_id);
    let orderItems: VendorOrderRow[] = [];
    
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [items] = await pool.execute<VendorOrderRow[]>(
        `SELECT 
          oi.order_id,
          oi.order_item_id,
          oi.product_id,
          oi.quantity,
          oi.unit_price,
          oi.total_price,
          oi.configuration,
          p.name as product_name
        FROM order_items oi
        JOIN vendor_products vp ON oi.product_id = vp.product_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE vp.vendor_id = ? AND oi.order_id IN (${placeholders})
        ORDER BY oi.order_id, oi.order_item_id`,
        [vendorId, ...orderIds]
      );
      orderItems = items;
    }

    // Group items by order
    const ordersWithItems = orders.map(order => ({
      ...order,
      vendor_items_count: Number(order.vendor_items_count),
      vendor_items_total: Number(order.vendor_items_total),
      total_amount: Number(order.total_amount),
      items: orderItems
        .filter(item => item.order_id === order.order_id)
        .map(item => ({
          order_item_id: item.order_item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          configuration: item.configuration ? JSON.parse(item.configuration) : null
        }))
    }));

    return NextResponse.json({ 
      success: true, 
      orders: ordersWithItems,
      pagination: {
        limit,
        offset,
        total: orders.length
      }
    });

  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// PUT: Update order status (vendor can only update certain statuses)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, status, vendor_notes } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    // Vendors can only update to certain statuses
    const allowedStatuses = ['processing', 'shipped', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Vendors can only update status to: ${allowedStatuses.join(', ')}` 
      }, { status: 400 });
    }

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

    // Verify vendor has products in this order
    const [orderCheck] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as item_count 
      FROM order_items oi
      JOIN vendor_products vp ON oi.product_id = vp.product_id
      WHERE oi.order_id = ? AND vp.vendor_id = ?`,
      [order_id, vendorId]
    );

    if (orderCheck[0].item_count === 0) {
      return NextResponse.json({ 
        error: 'Order not found or does not contain vendor products' 
      }, { status: 404 });
    }

    // Update order status
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
      [status, order_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order status updated successfully' 
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
} 