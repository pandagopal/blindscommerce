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

    // Afterpay has minimum and maximum limits
    if (amount < 1 || amount > 4000) {
      return NextResponse.json(
        { error: 'Amount must be between $1 and $4,000 for Afterpay' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // Calculate totals
    const total_amount = {
      amount: amount.toFixed(2),
      currency: currency
    };

    const shipping_amount = {
      amount: '0.00',
      currency: currency
    };

    const tax_amount = {
      amount: (amount * 0.08).toFixed(2), // 8% tax
      currency: currency
    };

    // Afterpay checkout payload
    const checkoutData = {
      amount: total_amount,
      consumer: {
        phoneNumber: shipping_address?.phone || '',
        givenNames: shipping_address?.name?.split(' ')[0] || '',
        surname: shipping_address?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || billing_address?.email || ''
      },
      billing: billing_address ? {
        name: billing_address.name,
        line1: billing_address.line1,
        line2: billing_address.line2 || '',
        area1: billing_address.city,
        region: billing_address.state,
        postcode: billing_address.postal_code,
        countryCode: billing_address.country || 'US',
        phoneNumber: billing_address.phone || ''
      } : undefined,
      shipping: shipping_address ? {
        name: shipping_address.name,
        line1: shipping_address.line1,
        line2: shipping_address.line2 || '',
        area1: shipping_address.city,
        region: shipping_address.state,
        postcode: shipping_address.postal_code,
        countryCode: shipping_address.country || 'US',
        phoneNumber: shipping_address.phone || ''
      } : undefined,
      items: items.map((item: any) => ({
        name: item.name,
        sku: item.sku || item.product_id?.toString(),
        quantity: item.quantity,
        pageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/products/${item.slug}`,
        imageUrl: item.image_url,
        price: {
          amount: item.unit_price.toFixed(2),
          currency: currency
        },
        categories: [['Home & Garden', 'Window Treatments']]
      })),
      discounts: [],
      merchant: {
        redirectConfirmUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        redirectCancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`
      },
      merchantReference: order_id || `order_${Date.now()}`,
      taxAmount: tax_amount,
      shippingAmount: shipping_amount
    };

    // Create Afterpay checkout
    const afterpayResponse = await fetch(`${process.env.AFTERPAY_API_URL}/v2/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AFTERPAY_MERCHANT_ID}:${process.env.AFTERPAY_SECRET_KEY}`
        ).toString('base64')}`,
        'User-Agent': 'BlindsCommerce/1.0'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!afterpayResponse.ok) {
      const errorData = await afterpayResponse.json();
      console.error('Afterpay checkout creation failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to create Afterpay checkout', details: errorData },
        { status: 400 }
      );
    }

    const afterpayCheckout = await afterpayResponse.json();

    // Store payment intent in database
    if (user) {
      await pool.execute(`
        INSERT INTO payment_intents (
          user_id, provider, provider_order_id, amount, currency,
          status, order_data, created_at
        ) VALUES (?, 'afterpay', ?, ?, ?, 'pending', ?, NOW())
      `, [
        user.userId,
        afterpayCheckout.token,
        amount,
        currency,
        JSON.stringify(checkoutData)
      ]);
    }

    return NextResponse.json({
      success: true,
      checkout_token: afterpayCheckout.token,
      redirect_checkout_url: afterpayCheckout.redirectCheckoutUrl,
      expires: afterpayCheckout.expires,
      amount,
      currency
    });

  } catch (error) {
    console.error('Afterpay checkout creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create Afterpay checkout' },
      { status: 500 }
    );
  }
}

// GET - Get Afterpay checkout details
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

    // Get Afterpay checkout details
    const afterpayResponse = await fetch(`${process.env.AFTERPAY_API_URL}/v2/checkouts/${checkout_token}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AFTERPAY_MERCHANT_ID}:${process.env.AFTERPAY_SECRET_KEY}`
        ).toString('base64')}`,
        'User-Agent': 'BlindsCommerce/1.0'
      }
    });

    if (!afterpayResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get Afterpay checkout' },
        { status: 404 }
      );
    }

    const afterpayCheckout = await afterpayResponse.json();

    return NextResponse.json({
      success: true,
      checkout_token: afterpayCheckout.token,
      status: afterpayCheckout.status,
      amount: afterpayCheckout.amount?.amount,
      currency: afterpayCheckout.amount?.currency,
      expires: afterpayCheckout.expires,
      merchant_reference: afterpayCheckout.merchantReference
    });

  } catch (error) {
    console.error('Afterpay get checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to get Afterpay checkout' },
      { status: 500 }
    );
  }
}