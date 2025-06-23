import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    const pool = await getPool();

    // Verify webhook signature (implement according to Klarna documentation)
    const signature = request.headers.get('klarna-signature');
    if (!verifyKlarnaSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle different Klarna events
    switch (event.event_type) {
      case 'order_pending':
        await handleOrderPending(event, pool);
        break;
      
      case 'order_captured':
        await handleOrderCaptured(event, pool);
        break;
      
      case 'order_cancelled':
        await handleOrderCancelled(event, pool);
        break;
      
      case 'order_expired':
        await handleOrderExpired(event, pool);
        break;

      default:
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Klarna webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleOrderPending(event: any, pool: any) {
  const { order_id, order_amount, purchase_currency } = event.order;

  // Update payment intent status
  await pool.execute(`
    UPDATE payment_intents 
    SET status = 'pending', updated_at = NOW()
    WHERE provider_order_id = ? AND provider = 'klarna'
  `, [order_id]);

}

async function handleOrderCaptured(event: any, pool: any) {
  const { order_id, order_amount, purchase_currency, captured_amount } = event.order;

  // Update payment intent status to completed
  await pool.execute(`
    UPDATE payment_intents 
    SET 
      status = 'completed',
      captured_amount = ?,
      processor_response = ?,
      updated_at = NOW()
    WHERE provider_order_id = ? AND provider = 'klarna'
  `, [
    captured_amount / 100,
    JSON.stringify(event),
    order_id
  ]);

  // Get payment intent details
  const [paymentIntents] = await pool.execute(`
    SELECT * FROM payment_intents 
    WHERE provider_order_id = ? AND provider = 'klarna'
  `, [order_id]);

  if (paymentIntents && (paymentIntents as any[]).length > 0) {
    const paymentIntent = (paymentIntents as any[])[0];

    // Create payment record
    await pool.execute(`
      INSERT INTO payments (
        user_id, order_id, payment_method, transaction_id, 
        amount, currency, status, processor_response, created_at
      ) VALUES (?, ?, 'klarna', ?, ?, ?, 'completed', ?, NOW())
    `, [
      paymentIntent.user_id,
      order_id,
      order_id, // Use order_id as transaction_id for Klarna
      captured_amount / 100,
      purchase_currency,
      JSON.stringify({
        klarna_reference: event.order.klarna_reference,
        order_amount: order_amount / 100,
        captured_amount: captured_amount / 100
      })
    ]);
  }

}

async function handleOrderCancelled(event: any, pool: any) {
  const { order_id } = event.order;

  // Update payment intent status to cancelled
  await pool.execute(`
    UPDATE payment_intents 
    SET status = 'cancelled', updated_at = NOW()
    WHERE provider_order_id = ? AND provider = 'klarna'
  `, [order_id]);

}

async function handleOrderExpired(event: any, pool: any) {
  const { order_id } = event.order;

  // Update payment intent status to expired
  await pool.execute(`
    UPDATE payment_intents 
    SET status = 'expired', updated_at = NOW()
    WHERE provider_order_id = ? AND provider = 'klarna'
  `, [order_id]);

}

function verifyKlarnaSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  
  // Implement Klarna signature verification
  // This is a placeholder - implement according to Klarna's documentation
  const crypto = require('crypto');
  const secret = process.env.KLARNA_WEBHOOK_SECRET;
  
  if (!secret) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');
  
  return signature === expectedSignature;
}