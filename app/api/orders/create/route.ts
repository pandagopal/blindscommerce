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

      // Get default status ID (usually "Pending")
      const statusResult = await client.query(
        'SELECT status_id FROM order_status WHERE name = $1',
        ['Pending']
      );
      const statusId = statusResult.rows[0]?.status_id || 1;

      // Generate unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

      // Insert order record
      const orderQuery = `
        INSERT INTO orders (
          user_id,
          order_number,
          status_id,
          subtotal,
          shipping_cost,
          tax_amount,
          discount_amount,
          total_amount,
          shipping_method,
          payment_method,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING order_id
      `;

      const orderValues = [
        user.userId,
        orderNumber,
        statusId,
        body.subtotal || 0,
        body.shippingCost || 0,
        body.taxAmount || 0,
        body.discountAmount || 0,
        body.totalAmount || 0,
        body.shippingMethod || 'Standard',
        body.paymentMethod || 'Credit Card',
        body.notes || ''
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const orderId = orderResult.rows[0].order_id;

      // Insert order items
      const itemPromises = body.items.map(async (item) => {
        const itemQuery = `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            width,
            height,
            color_id,
            color_name,
            material_id,
            material_name,
            quantity,
            unit_price,
            subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        const itemValues = [
          orderId,
          item.productId,
          item.name,
          item.width || null,
          item.height || null,
          item.colorId || null,
          item.colorName || null,
          item.materialId || null,
          item.materialName || null,
          item.quantity,
          item.price,
          item.price * item.quantity
        ];

        return client.query(itemQuery, itemValues);
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
