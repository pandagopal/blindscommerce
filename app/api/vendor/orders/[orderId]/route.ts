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
       JOIN vendor_products vp ON oi.product_id = vp.product_id
       JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
       WHERE oi.order_id = ? AND vi.user_id = ?`,
      [orderId, user.userId]
    );
    if (!vendorCheck[0] || vendorCheck[0].count === 0) {
      return NextResponse.json({ error: 'Order not found or not accessible' }, { status: 404 });
    }
    // Fetch order details
    const [orderRows] = await pool.execute(
      `SELECT o.*, o.status as status_name, u.first_name as customer_name, u.email as customer_email
       FROM orders o
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
       JOIN vendor_products vp ON oi.product_id = vp.product_id
       JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
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
       JOIN vendor_products vp ON oi.product_id = vp.product_id
       JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
       WHERE oi.order_id = ? AND vi.user_id = ?`,
      [orderId, user.userId]
    );
    if (!vendorCheck[0] || vendorCheck[0].count === 0) {
      return NextResponse.json({ error: 'Order not found or not accessible' }, { status: 404 });
    }
    // Validate status is allowed for vendors
    const allowedStatuses = ['processing', 'shipped', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status for vendor' }, { status: 400 });
    }
    // Update the order status
    await pool.execute(
      `UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?`,
      [status, orderId]
    );
    // Return updated order
    const [orderRows] = await pool.execute(
      `SELECT o.*, o.status as status_name, u.first_name as customer_name, u.email as customer_email
       FROM orders o
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