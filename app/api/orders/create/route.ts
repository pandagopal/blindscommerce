import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST /api/orders/create
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Check if we're in development/mock mode
    if (process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH === 'true') {
      return NextResponse.json({
        success: true,
        order: {
          order_id: Math.floor(Math.random() * 10000),
          order_number: `ORD-${Date.now().toString().slice(-8)}`,
          created_at: new Date().toISOString(),
          status: 'Pending',
          total_amount: body.totalAmount || body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }
      });
    }

    // Start a transaction
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get order status ID
      const statusResult = await client.query(
        'SELECT status_id FROM order_status WHERE name = ?',
        ['pending']
      );
      const statusId = statusResult.rows[0]?.status_id || 1;

      // Generate unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          user_id,
          total_amount,
          shipping_address,
          billing_address,
          payment_method,
          payment_status,
          shipping_status,
          order_status,
          tracking_number,
          notes,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [orderResult] = await client.execute(orderQuery, [
        user.userId,
        body.totalAmount || 0,
        body.shippingAddress || '',
        body.billingAddress || '',
        body.paymentMethod || 'Credit Card',
        'pending',
        'pending',
        'pending',
        null,
        body.notes || ''
      ]);

      const orderId = (orderResult as any).insertId;

      // Create order items
      const orderItemsQuery = `
          INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
          price,
          options,
          created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
        `;

      const itemPromises = body.items.map(async (item) => {
        await client.execute(orderItemsQuery, [
          orderId,
          item.productId,
          item.quantity,
          item.price,
          JSON.stringify(item.options)
        ]);
      });

      await Promise.all(itemPromises);

      // Create payment record if payment information is provided
      if (body.payment && body.payment.transactionId) {
        const paymentQuery = `
          INSERT INTO payments (
            order_id,
            transaction_id,
            payment_method,
            amount,
            status
          ) VALUES ($1, $2, $3, $4, $5)
        `;

        const paymentValues = [
          orderId,
          body.payment.transactionId,
          body.payment.method || 'Credit Card',
          body.totalAmount,
          'Completed'
        ];

        await client.query(paymentQuery, paymentValues);
      }

      // Commit the transaction
      await client.query('COMMIT');

      // Return the created order
      return NextResponse.json({
        success: true,
        order: {
          order_id: orderId,
          order_number: orderNumber,
          created_at: new Date().toISOString(),
          status: 'Pending',
          total_amount: body.totalAmount || 0
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error creating order:', error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
