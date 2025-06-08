import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { orderSchema, apiRateLimiter } from '@/lib/security/validation';
import { z } from 'zod';

// POST /api/orders/create
export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limiting
    if (apiRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate and sanitize input
    let validatedData;
    try {
      validatedData = orderSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid order data', details: error.errors },
          { status: 400 }
        );
      }
      throw error;
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
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get order status ID using parameterized query
      const [statusRows] = await connection.execute(
        'SELECT status_id FROM order_status WHERE name = ? LIMIT 1',
        ['pending']
      );
      const statusId = (statusRows as any)[0]?.status_id || 1;

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

      const [orderResult] = await connection.execute(orderQuery, [
        user.userId,
        validatedData.totalAmount,
        validatedData.shippingAddress,
        validatedData.billingAddress,
        validatedData.paymentMethod,
        'pending',
        'pending',
        'pending',
        null,
        validatedData.notes || ''
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

      const itemPromises = validatedData.items.map(async (item) => {
        await connection.execute(orderItemsQuery, [
          orderId,
          item.productId,
          item.quantity,
          item.price,
          JSON.stringify(item.options || {})
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
          ) VALUES (?, ?, ?, ?, ?)
        `;

        await connection.execute(paymentQuery, [
          orderId,
          body.payment.transactionId,
          body.payment.method || 'Credit Card',
          validatedData.totalAmount,
          'Completed'
        ]);
      }

      // Commit the transaction
      await connection.commit();

      // Return the created order
      return NextResponse.json({
        success: true,
        order: {
          order_id: orderId,
          order_number: orderNumber,
          created_at: new Date().toISOString(),
          status: 'Pending',
          total_amount: validatedData.totalAmount
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      // Safe error logging
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error creating order:', error);
      } else {
        console.error('Order creation failed');
      }
      throw error;
    } finally {
      // Release connection back to pool
      connection.release();
    }
  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error processing order:', error);
    } else {
      console.error('Order processing failed');
    }
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
