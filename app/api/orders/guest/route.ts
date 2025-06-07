import { NextRequest, NextResponse } from 'next/server';
import { getPool, registerUser } from '@/lib/db';
import { generateToken, setAuthCookie } from '@/lib/auth';

// POST /api/orders/guest - Create order for guest or new account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.shipping || !body.shipping.email) {
      return NextResponse.json(
        { error: 'Shipping information and email are required' },
        { status: 400 }
      );
    }

    let userId = null;
    let shouldCreateAccount = false;

    // Check if creating account
    if (body.createAccount && body.guestPassword) {
      // Validate password confirmation
      if (body.guestPassword !== body.guestConfirmPassword) {
        return NextResponse.json(
          { error: 'Passwords do not match' },
          { status: 400 }
        );
      }

      try {
        // Register new user
        const newUser = await registerUser(
          body.shipping.email,
          body.guestPassword,
          body.shipping.firstName,
          body.shipping.lastName,
          body.shipping.phone,
          'customer'
        );

        if (newUser) {
          userId = newUser.userId;
          shouldCreateAccount = true;
        }
      } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json(
          { error: 'Failed to create account. Email may already be in use.' },
          { status: 400 }
        );
      }
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Generate unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          user_id,
          order_number,
          guest_email,
          guest_phone,
          total_amount,
          shipping_address,
          billing_address,
          payment_method,
          payment_status,
          shipping_status,
          order_status,
          special_instructions,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const shippingAddress = JSON.stringify({
        firstName: body.shipping.firstName,
        lastName: body.shipping.lastName,
        address: body.shipping.address,
        apt: body.shipping.apt,
        city: body.shipping.city,
        state: body.shipping.state,
        zipCode: body.shipping.zipCode,
        country: body.shipping.country
      });

      const billingAddress = JSON.stringify(body.billing);

      const [orderResult] = await connection.execute(orderQuery, [
        userId,
        orderNumber,
        body.shipping.email,
        body.shipping.phone,
        body.total,
        shippingAddress,
        billingAddress,
        'Credit Card',
        body.payment?.id ? 'completed' : 'pending',
        'pending',
        'pending',
        body.special_instructions || null
      ]);

      const orderId = (orderResult as any).insertId;

      // Create order items
      const orderItemsQuery = `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          width,
          height,
          color_name,
          material_name,
          subtotal,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      for (const item of body.items) {
        await connection.execute(orderItemsQuery, [
          orderId,
          item.id || item.product_id,
          item.name,
          item.quantity,
          item.price,
          item.width,
          item.height,
          item.colorName,
          item.materialName || '',
          item.price * item.quantity
        ]);
      }

      // Create payment record if payment successful
      if (body.payment?.id) {
        const paymentQuery = `
          INSERT INTO payments (
            order_id,
            transaction_id,
            payment_method,
            amount,
            currency,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        await connection.execute(paymentQuery, [
          orderId,
          body.payment.id,
          'stripe',
          body.total,
          'usd',
          'completed'
        ]);
      }

      await connection.commit();

      // If account was created, set auth cookie
      let response = NextResponse.json({
        success: true,
        orderId,
        orderNumber,
        accountCreated: shouldCreateAccount
      });

      if (shouldCreateAccount && userId) {
        const user = {
          userId,
          email: body.shipping.email,
          firstName: body.shipping.firstName,
          lastName: body.shipping.lastName,
          isAdmin: false,
          role: 'customer'
        };
        const token = await generateToken(user);
        setAuthCookie(response, token);
      }

      return response;

    } catch (error) {
      await connection.rollback();
      console.error('Error creating guest order:', error);
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error processing guest order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}