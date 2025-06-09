import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import braintree from 'braintree';

// Initialize Braintree gateway
const gateway = new braintree.BraintreeGateway({
  environment: process.env.BRAINTREE_ENVIRONMENT === 'production' 
    ? braintree.Environment.Production 
    : braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID!,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
});

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

    // Create PayPal order
    const orderRequest = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order_id || `order_${Date.now()}`,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: amount.toFixed(2)
            }
          }
        },
        items: items.map((item: any) => ({
          name: item.name,
          unit_amount: {
            currency_code: currency,
            value: item.unit_price.toFixed(2)
          },
          quantity: item.quantity.toString(),
          description: item.description || '',
          sku: item.sku || item.product_id?.toString(),
          category: 'PHYSICAL_GOODS'
        })),
        shipping: shipping_address ? {
          name: {
            full_name: shipping_address.name
          },
          address: {
            address_line_1: shipping_address.line1,
            address_line_2: shipping_address.line2 || '',
            admin_area_2: shipping_address.city,
            admin_area_1: shipping_address.state,
            postal_code: shipping_address.postal_code,
            country_code: shipping_address.country || 'US'
          }
        } : undefined
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
        brand_name: 'BlindsCommerce',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        payment_method: {
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        }
      }
    };

    // Create order using Braintree PayPal
    const result = await gateway.paypalAccount.create({
      customerId: user?.userId.toString(),
      paypalAccount: {
        email: user?.email || billing_address?.email
      }
    });

    if (!result.success) {
      console.error('PayPal order creation failed:', result.message);
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    // Store payment intent in database
    if (user) {
      await pool.execute(`
        INSERT INTO payment_intents (
          user_id, provider, provider_order_id, amount, currency,
          status, order_data, created_at
        ) VALUES (?, 'paypal', ?, ?, ?, 'pending', ?, NOW())
      `, [
        user.userId,
        result.paypalAccount?.token || 'pending',
        amount,
        currency,
        JSON.stringify(orderRequest)
      ]);
    }

    return NextResponse.json({
      success: true,
      order_id: result.paypalAccount?.token,
      approval_url: result.paypalAccount?.token, // This would be the approval URL in real implementation
      amount,
      currency
    });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal payment' },
      { status: 500 }
    );
  }
}

// GET - Get PayPal client token for frontend
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Generate client token for frontend PayPal integration
    const result = await gateway.clientToken.generate({
      customerId: user?.userId.toString()
    });

    if (!result.success) {
      console.error('Failed to generate PayPal client token:', result.message);
      return NextResponse.json(
        { error: 'Failed to generate client token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      client_token: result.clientToken
    });

  } catch (error) {
    console.error('PayPal client token error:', error);
    return NextResponse.json(
      { error: 'Failed to get PayPal client token' },
      { status: 500 }
    );
  }
}