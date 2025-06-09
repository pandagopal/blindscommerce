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

    const user = await getCurrentUser();
    const pool = await getPool();

    // Calculate order totals
    const order_amount = Math.round(amount * 100); // Klarna expects amount in cents
    const tax_amount = Math.round(amount * 0.08 * 100); // Assuming 8% tax
    const order_lines = items.map((item: any) => ({
      type: 'physical',
      reference: item.sku || item.product_id?.toString(),
      name: item.name,
      quantity: item.quantity,
      unit_price: Math.round(item.unit_price * 100),
      tax_rate: 800, // 8% in basis points
      total_amount: Math.round(item.unit_price * item.quantity * 100),
      total_discount_amount: 0,
      total_tax_amount: Math.round(item.unit_price * item.quantity * 0.08 * 100),
      product_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${item.slug}`,
      image_url: item.image_url
    }));

    // Klarna session payload
    const sessionData = {
      purchase_country: shipping_address?.country || 'US',
      purchase_currency: currency,
      locale: 'en-US',
      order_amount,
      order_tax_amount: tax_amount,
      order_lines,
      merchant_urls: {
        terms: `${process.env.NEXT_PUBLIC_APP_URL}/terms`,
        checkout: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
        confirmation: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id={checkout.order.id}`,
        push: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/klarna/webhook`
      },
      options: {
        allow_separate_shipping_address: true,
        date_of_birth_mandatory: false,
        require_validate_callback_success: true
      },
      shipping_address: shipping_address ? {
        given_name: shipping_address.name?.split(' ')[0] || '',
        family_name: shipping_address.name?.split(' ').slice(1).join(' ') || '',
        email: shipping_address.email || user?.email,
        street_address: shipping_address.line1,
        street_address2: shipping_address.line2 || '',
        postal_code: shipping_address.postal_code,
        city: shipping_address.city,
        region: shipping_address.state,
        country: shipping_address.country || 'US',
        phone: shipping_address.phone || ''
      } : undefined,
      billing_address: billing_address ? {
        given_name: billing_address.name?.split(' ')[0] || '',
        family_name: billing_address.name?.split(' ').slice(1).join(' ') || '',
        email: billing_address.email || user?.email,
        street_address: billing_address.line1,
        street_address2: billing_address.line2 || '',
        postal_code: billing_address.postal_code,
        city: billing_address.city,
        region: billing_address.state,
        country: billing_address.country || 'US',
        phone: billing_address.phone || ''
      } : undefined
    };

    // Create Klarna session (using Klarna Checkout API)
    const klarnaResponse = await fetch(`${process.env.KLARNA_API_URL}/checkout/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.KLARNA_USERNAME}:${process.env.KLARNA_PASSWORD}`
        ).toString('base64')}`
      },
      body: JSON.stringify(sessionData)
    });

    if (!klarnaResponse.ok) {
      const errorData = await klarnaResponse.json();
      console.error('Klarna session creation failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to create Klarna session', details: errorData },
        { status: 400 }
      );
    }

    const klarnaSession = await klarnaResponse.json();

    // Store payment intent in database
    if (user) {
      await pool.execute(`
        INSERT INTO payment_intents (
          user_id, provider, provider_order_id, amount, currency,
          status, order_data, created_at
        ) VALUES (?, 'klarna', ?, ?, ?, 'pending', ?, NOW())
      `, [
        user.userId,
        klarnaSession.order_id,
        amount,
        currency,
        JSON.stringify(sessionData)
      ]);
    }

    return NextResponse.json({
      success: true,
      session_id: klarnaSession.order_id,
      html_snippet: klarnaSession.html_snippet,
      checkout_url: klarnaSession.checkout_url,
      amount,
      currency
    });

  } catch (error) {
    console.error('Klarna session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create Klarna session' },
      { status: 500 }
    );
  }
}

// GET - Get Klarna session details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get Klarna session details
    const klarnaResponse = await fetch(`${process.env.KLARNA_API_URL}/checkout/v3/orders/${session_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.KLARNA_USERNAME}:${process.env.KLARNA_PASSWORD}`
        ).toString('base64')}`
      }
    });

    if (!klarnaResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get Klarna session' },
        { status: 404 }
      );
    }

    const klarnaSession = await klarnaResponse.json();

    return NextResponse.json({
      success: true,
      session_id: klarnaSession.order_id,
      status: klarnaSession.status,
      amount: klarnaSession.order_amount / 100,
      currency: klarnaSession.purchase_currency,
      html_snippet: klarnaSession.html_snippet
    });

  } catch (error) {
    console.error('Klarna get session error:', error);
    return NextResponse.json(
      { error: 'Failed to get Klarna session' },
      { status: 500 }
    );
  }
}