import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { checkout_token } = await request.json();

    if (!checkout_token) {
      return NextResponse.json(
        { error: 'Checkout token is required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // Get the payment intent from database
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

    // Authorize the charge with Affirm
    const authorizeResponse = await fetch(`${process.env.AFFIRM_API_URL}/api/v2/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AFFIRM_PUBLIC_API_KEY}:${process.env.AFFIRM_PRIVATE_API_KEY}`
        ).toString('base64')}`
      },
      body: JSON.stringify({
        checkout_token: checkout_token
      })
    });

    if (!authorizeResponse.ok) {
      const errorData = await authorizeResponse.json();
      console.error('Affirm authorization failed:', errorData);

      // Update payment intent status to failed
      await pool.execute(`
        UPDATE payment_intents 
        SET status = 'failed', error_message = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        errorData.message || 'Authorization failed',
        paymentIntent.id
      ]);

      return NextResponse.json(
        { error: 'Payment authorization failed', details: errorData },
        { status: 400 }
      );
    }

    const authorizeResult = await authorizeResponse.json();
    const charge_id = authorizeResult.id;

    // Capture the authorized charge
    const captureResponse = await fetch(`${process.env.AFFIRM_API_URL}/api/v2/charges/${charge_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AFFIRM_PUBLIC_API_KEY}:${process.env.AFFIRM_PRIVATE_API_KEY}`
        ).toString('base64')}`
      },
      body: JSON.stringify({
        amount: Math.round(paymentIntent.amount * 100) // Amount in cents
      })
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('Affirm capture failed:', errorData);

      // Update payment intent status to failed
      await pool.execute(`
        UPDATE payment_intents 
        SET status = 'failed', error_message = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        errorData.message || 'Capture failed',
        paymentIntent.id
      ]);

      return NextResponse.json(
        { error: 'Payment capture failed', details: errorData },
        { status: 400 }
      );
    }

    const captureResult = await captureResponse.json();

    // Update payment intent status to completed
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        status = 'completed',
        transaction_id = ?,
        captured_amount = ?,
        processor_response = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      charge_id,
      captureResult.amount / 100,
      JSON.stringify({
        authorize_result: authorizeResult,
        capture_result: captureResult
      }),
      paymentIntent.id
    ]);

    // Create payment record
    await pool.execute(`
      INSERT INTO payments (
        user_id, order_id, payment_method, transaction_id, 
        amount, currency, status, processor_response, created_at
      ) VALUES (?, ?, 'affirm', ?, ?, ?, 'completed', ?, NOW())
    `, [
      user?.userId,
      authorizeResult.order_id,
      charge_id,
      captureResult.amount / 100,
      paymentIntent.currency,
      JSON.stringify({
        affirm_charge_id: charge_id,
        fee: captureResult.fee / 100,
        provider_type: authorizeResult.provider_type,
        events: captureResult.events
      })
    ]);

    return NextResponse.json({
      success: true,
      charge_id: charge_id,
      amount: captureResult.amount / 100,
      currency: paymentIntent.currency,
      fee: captureResult.fee / 100,
      provider_type: authorizeResult.provider_type,
      order_id: authorizeResult.order_id
    });

  } catch (error) {
    console.error('Affirm capture payment error:', error);
    return NextResponse.json(
      { error: 'Failed to capture Affirm payment' },
      { status: 500 }
    );
  }
}