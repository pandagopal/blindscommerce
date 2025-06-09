import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    const pool = await getPool();
    // Check if this order contains products belonging to this vendor
    const [vendorCheck] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN vendor_info vi ON p.vendor_info_id = vi.vendor_info_id
       WHERE oi.order_id = ? AND vi.user_id = ?`,
      [orderId, user.userId]
    );
    if (!vendorCheck[0] || vendorCheck[0].count === 0) {
      return NextResponse.json({ error: 'Order not found or not accessible' }, { status: 404 });
    }
    // Fetch order details
    const [orderRows] = await pool.execute(
      `SELECT o.*, os.name as status_name, u.first_name as customer_name, u.email as customer_email
       FROM orders o
       JOIN order_status os ON o.status_id = os.status_id
       JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ?`,
      [orderId]
    );
    if (!orderRows[0]) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orderRows[0];
    // Fetch order items for this vendor
    const [itemRows] = await pool.execute(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN vendor_info vi ON p.vendor_info_id = vi.vendor_info_id
       WHERE oi.order_id = ? AND vi.user_id = ?`,
      [orderId, user.userId]
    );
    order.items = itemRows;
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching vendor order details:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }
    const pool = await getPool();
    // Check vendor ownership as in GET
    const [vendorCheck] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN vendor_info vi ON p.vendor_info_id = vi.vendor_info_id
       WHERE oi.order_id = ? AND vi.user_id = ?`,
      [orderId, user.userId]
    );
    if (!vendorCheck[0] || vendorCheck[0].count === 0) {
      return NextResponse.json({ error: 'Order not found or not accessible' }, { status: 404 });
    }
    // Get status_id for the new status
    const [statusRows] = await pool.execute(
      `SELECT status_id FROM order_status WHERE name = ?`,
      [status]
    );
    if (!statusRows[0]) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const statusId = statusRows[0].status_id;
    // Update the order status
    await pool.execute(
      `UPDATE orders SET status_id = ?, updated_at = NOW() WHERE order_id = ?`,
      [statusId, orderId]
    );
    // Return updated order
    const [orderRows] = await pool.execute(
      `SELECT o.*, os.name as status_name, u.first_name as customer_name, u.email as customer_email
       FROM orders o
       JOIN order_status os ON o.status_id = os.status_id
       JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ?`,
      [orderId]
    );
    const order = orderRows[0];
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
} 