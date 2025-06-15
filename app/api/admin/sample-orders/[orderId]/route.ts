import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { status, tracking_number } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Build update query based on status
    let updateFields = ['status = ?'];
    let updateValues = [status];

    if (status === 'shipped' && tracking_number) {
      updateFields.push('tracking_number = ?', 'shipped_at = NOW()');
      updateValues.push(tracking_number);
    } else if (status === 'delivered') {
      updateFields.push('delivered_at = NOW()');
    }

    updateValues.push(orderId);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE sample_orders 
       SET ${updateFields.join(', ')}, updated_at = NOW() 
       WHERE order_id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Send notification email if status changed to shipped or delivered
    if (status === 'shipped' || status === 'delivered') {
      // TODO: Implement email notification
      // await sendOrderStatusNotification(orderId, status, tracking_number);
    }

    return NextResponse.json({
      message: `Order ${orderId} status updated to ${status}`,
      status,
      tracking_number: tracking_number || null,
    });

  } catch (error) {
    console.error('Error updating sample order:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}