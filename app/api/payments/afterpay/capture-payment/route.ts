import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { checkout_token, order_token } = await request.json();

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
      WHERE provider_order_id = ? AND provider = 'afterpay'
    `, [checkout_token]);

    if (!paymentIntents || (paymentIntents as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    const paymentIntent = (paymentIntents as any[])[0];

    // Capture the payment with Afterpay
    const captureData = {
      token: order_token || checkout_token,
      merchantReference: paymentIntent.id.toString()
    };

    const afterpayResponse = await fetch(`${process.env.AFTERPAY_API_URL}/v2/payments/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.AFTERPAY_MERCHANT_ID}:${process.env.AFTERPAY_SECRET_KEY}`
        ).toString('base64')}`,
        'User-Agent': 'BlindsCommerce/1.0'
      },
      body: JSON.stringify(captureData)
    });

    if (!afterpayResponse.ok) {
      const errorData = await afterpayResponse.json();
      console.error('Afterpay payment capture failed:', errorData);

      // Update payment intent status to failed
      await pool.execute(`
        UPDATE payment_intents 
        SET status = 'failed', error_message = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        errorData.message || 'Payment capture failed',
        paymentIntent.id
      ]);

      return NextResponse.json(
        { error: 'Payment capture failed', details: errorData },
        { status: 400 }
      );
    }

    const captureResult = await afterpayResponse.json();

    // Execute update and insert operations in parallel to reduce connection time
    const [
      [updateResult],
      [insertResult]
    ] = await Promise.all([
      // Update payment intent status to completed
      pool.execute(`
        UPDATE payment_intents 
        SET 
          status = 'completed',
          transaction_id = ?,
          captured_amount = ?,
          processor_response = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        captureResult.id,
        captureResult.totalResults?.amount?.amount,
        JSON.stringify(captureResult),
        paymentIntent.id
      ]),

      // Create payment record
      pool.execute(`
        INSERT INTO payments (
          user_id, order_id, payment_method, transaction_id, 
          amount, currency, status, processor_response, created_at
        ) VALUES (?, ?, 'afterpay', ?, ?, ?, 'completed', ?, NOW())
      `, [
        user?.userId,
        captureResult.merchantReference,
        captureResult.id,
        captureResult.totalResults?.amount?.amount,
        captureResult.totalResults?.amount?.currency,
        JSON.stringify({
          afterpay_order_id: captureResult.orderDetails?.orderNumber,
          payment_state: captureResult.paymentState,
          open_to_capture_amount: captureResult.openToCaptureAmount
        })
      ])
    ]);

    return NextResponse.json({
      success: true,
      payment_id: captureResult.id,
      status: captureResult.status,
      amount: captureResult.totalResults?.amount?.amount,
      currency: captureResult.totalResults?.amount?.currency,
      payment_state: captureResult.paymentState,
      order_details: captureResult.orderDetails
    });

  } catch (error) {
    console.error('Afterpay capture payment error:', error);
    return NextResponse.json(
      { error: 'Failed to capture Afterpay payment' },
      { status: 500 }
    );
  }
}