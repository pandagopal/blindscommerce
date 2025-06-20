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

    // Use pool directly - transactions will be handled at application level
    const pool = await getPool();

    // Get order status ID using parameterized query
    const [statusRows] = await pool.execute(
      'SELECT status_id FROM order_status WHERE name = ? LIMIT 1',
      ['pending']
    );
    const statusId = (statusRows as any)[0]?.status_id || 1;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

    // Create order with discount and commission tracking fields
    const orderQuery = `
      INSERT INTO orders (
        user_id,
        vendor_id,
        sales_staff_id,
        subtotal,
        discount_amount,
        volume_discount_amount,
        shipping_cost,
        tax_amount,
        total_amount,
        coupon_code,
        campaign_id,
        shipping_address,
        billing_address,
        payment_method,
        payment_status,
        shipping_status,
        order_status,
        tracking_number,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    // Get vendor_id from first product (simplified - in production, handle multi-vendor)
    let vendorId = null;
    if (validatedData.items.length > 0) {
      const [vendorRows] = await pool.execute(
        'SELECT vendor_id FROM products WHERE product_id = ? LIMIT 1',
        [validatedData.items[0].productId]
      );
      vendorId = (vendorRows as any)[0]?.vendor_id || null;
    }

    // Get campaign_id if campaign code provided
    let campaignId = null;
    if (body.campaign_code) {
      const [campaignRows] = await pool.execute(
        'SELECT campaign_id FROM promotional_campaigns WHERE campaign_code = ? AND is_active = TRUE LIMIT 1',
        [body.campaign_code]
      );
      campaignId = (campaignRows as any)[0]?.campaign_id || null;
    }

    const [orderResult] = await pool.execute(orderQuery, [
        user.userId,
        vendorId,
        body.sales_staff_id || null,
        body.subtotal || validatedData.totalAmount,
        body.discount_amount || 0,
        body.volume_discount_amount || 0,
        body.shipping_cost || 0,
        body.tax || 0,
        validatedData.totalAmount,
        body.coupon_code || null,
        campaignId,
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
      await pool.execute(orderItemsQuery, [
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

      await pool.execute(paymentQuery, [
        orderId,
        body.payment.transactionId,
        body.payment.method || 'Credit Card',
        validatedData.totalAmount,
        'Completed'
      ]);
    }

    // Update coupon usage if coupon was used
    if (body.coupon_code) {
      await pool.execute(
        'UPDATE coupon_codes SET usage_count = usage_count + 1 WHERE coupon_code = ?',
        [body.coupon_code]
      );
    }

    // If payment is successful, update order status to completed to trigger commission calculation
    if (body.payment && body.payment.transactionId) {
      await pool.execute(
        'UPDATE orders SET order_status = "completed", payment_status = "paid" WHERE order_id = ?',
        [orderId]
      );
    }

    // Return the created order
    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      order: {
        order_id: orderId,
        order_number: orderNumber,
        created_at: new Date().toISOString(),
        status: 'Confirmed',
        total_amount: validatedData.totalAmount,
        discount_applied: (body.discount_amount || 0) > 0
      }
    });
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
