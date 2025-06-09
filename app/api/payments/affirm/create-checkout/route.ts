import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      currency = 'USD',
      items = [],
      shipping_address,
      billing_address,
      order_id 
    } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Affirm has minimum and maximum limits
    if (amount < 50 || amount > 17500) {
      return NextResponse.json(
        { error: 'Amount must be between $50 and $17,500 for Affirm' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // Convert amount to cents for Affirm
    const total_amount = Math.round(amount * 100);
    const tax_amount = Math.round(amount * 0.08 * 100); // 8% tax
    const shipping_amount = 0; // Free shipping

    // Affirm checkout payload
    const checkoutData = {
      merchant: {
        user_confirmation_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        user_cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
        user_confirmation_url_action: 'POST',
        name: 'BlindsCommerce'
      },
      items: items.map((item: any) => ({
        display_name: item.name,
        sku: item.sku || item.product_id?.toString(),
        unit_price: Math.round(item.unit_price * 100),
        qty: item.quantity,
        item_image_url: item.image_url,
        item_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${item.slug}`,
        categories: [['Home & Garden', 'Window Treatments']]
      })),
      billing: billing_address ? {
        name: {
          first: billing_address.name?.split(' ')[0] || '',
          last: billing_address.name?.split(' ').slice(1).join(' ') || ''
        },
        address: {
          line1: billing_address.line1,
          line2: billing_address.line2 || '',
          city: billing_address.city,
          state: billing_address.state,
          zipcode: billing_address.postal_code,
          country: billing_address.country || 'USA'
        },
        phone_number: billing_address.phone || '',
        email: billing_address.email || user?.email || ''
      } : undefined,
      shipping: shipping_address ? {
        name: {
          first: shipping_address.name?.split(' ')[0] || '',
          last: shipping_address.name?.split(' ').slice(1).join(' ') || ''
        },
        address: {
          line1: shipping_address.line1,
          line2: shipping_address.line2 || '',
          city: shipping_address.city,
          state: shipping_address.state,
          zipcode: shipping_address.postal_code,
          country: shipping_address.country || 'USA'
        },
        phone_number: shipping_address.phone || '',
        email: shipping_address.email || user?.email || ''
      } : undefined,
      shipping_amount,
      tax_amount,
      total: total_amount,
      metadata: {
        order_id: order_id || `order_${Date.now()}`,
        user_id: user?.userId?.toString(),
        platform: 'web'
      },
      order_id: order_id || `order_${Date.now()}`,
      currency: currency.toLowerCase(),
      financing_program: 'affirm' // Can be 'affirm' or 'monthly'
    };

    // Create Affirm checkout
    const affirmResponse = await fetch(`${process.env.AFFIRM_API_URL}/api/v2/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AFFIRM_PUBLIC_API_KEY}:${process.env.AFFIRM_PRIVATE_API_KEY}`
        ).toString('base64')}`
      },
      body: JSON.stringify(checkoutData)
    });

    if (!affirmResponse.ok) {
      const errorData = await affirmResponse.json();
      console.error('Affirm checkout creation failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to create Affirm checkout', details: errorData },
        { status: 400 }
      );
    }

    const affirmCheckout = await affirmResponse.json();

    // Store payment intent in database
    if (user) {
      await pool.execute(`
        INSERT INTO payment_intents (
          user_id, provider, provider_order_id, amount, currency,
          status, order_data, created_at
        ) VALUES (?, 'affirm', ?, ?, ?, 'pending', ?, NOW())
      `, [
        user.userId,
        affirmCheckout.checkout_token,
        amount,
        currency,
        JSON.stringify(checkoutData)
      ]);
    }

    return NextResponse.json({
      success: true,
      checkout_token: affirmCheckout.checkout_token,
      redirect_url: affirmCheckout.redirect_url,
      amount,
      currency
    });

  } catch (error) {
    console.error('Affirm checkout creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create Affirm checkout' },
      { status: 500 }
    );
  }
}

// GET - Get Affirm checkout details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkout_token = searchParams.get('checkout_token');

    if (!checkout_token) {
      return NextResponse.json(
        { error: 'Checkout token is required' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Get payment intent details from database
    const [paymentIntents] = await pool.execute(`
      SELECT * FROM payment_intents 
      WHERE provider_order_id = ? AND provider = 'affirm'
    `, [checkout_token]);

    if (!paymentIntents || (paymentIntents as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    const paymentIntent = (paymentIntents as any[])[0];

    return NextResponse.json({
      success: true,
      checkout_token: paymentIntent.provider_order_id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created_at: paymentIntent.created_at,
      order_data: JSON.parse(paymentIntent.order_data || '{}')
    });

  } catch (error) {
    console.error('Affirm get checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to get Affirm checkout' },
      { status: 500 }
    );
  }
}