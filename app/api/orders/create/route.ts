import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get the current user (for authenticated orders)
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      items,
      shipping,
      billing,
      payment,
      subtotal,
      shipping_cost,
      tax,
      total,
      special_instructions
    } = body;

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate an order number
      const orderNumber = `SBH-${Math.floor(100000 + Math.random() * 900000)}`;

      // Create order record - simplify SQL to match available schema
      const orderResult = await client.query(
        `INSERT INTO orders
         (user_id, order_number, order_status, total_amount, shipping_address, customer_email, customer_phone, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING order_id`,
        [
          user?.userId || null, // User ID if authenticated, using userId from UserData
          orderNumber,
          'processing',     // Initial status
          total,
          `${shipping.address} ${shipping.apt || ''}, ${shipping.city}, ${shipping.state} ${shipping.zipCode}`,
          shipping.email,
          shipping.phone,
          special_instructions || ''
        ]
      );

      const orderId = orderResult.rows[0].order_id;

      // Insert order items - simplify SQL to match available schema
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items
           (order_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            orderId,
            item.id,
            item.quantity,
            item.price,
            item.price * item.quantity
          ]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        orderId,
        orderNumber
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Error processing order' },
      { status: 500 }
    );
  }
}
