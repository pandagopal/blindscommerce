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
    const { order_id, payment_method_nonce } = await request.json();

    if (!order_id || !payment_method_nonce) {
      return NextResponse.json(
        { error: 'Order ID and payment method nonce are required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // Get the payment intent from database
    const [paymentIntents] = await pool.execute(`
      SELECT * FROM payment_intents 
      WHERE provider_order_id = ? AND provider = 'paypal'
    `, [order_id]);

    if (!paymentIntents || (paymentIntents as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    const paymentIntent = (paymentIntents as any[])[0];

    // Process the payment through Braintree
    const transactionResult = await gateway.transaction.sale({
      amount: paymentIntent.amount.toString(),
      paymentMethodNonce: payment_method_nonce,
      options: {
        submitForSettlement: true,
        paypal: {
          customField: paymentIntent.id.toString(),
          description: `BlindsCommerce Order #${order_id}`
        }
      },
      customerId: user?.userId.toString(),
      orderId: order_id
    });

    if (!transactionResult.success) {
      // Update payment intent status to failed
      await pool.execute(`
        UPDATE payment_intents 
        SET status = 'failed', error_message = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        transactionResult.message || 'Payment processing failed',
        paymentIntent.id
      ]);

      return NextResponse.json(
        { 
          error: 'Payment failed', 
          details: transactionResult.message,
          decline_code: transactionResult.transaction?.processorResponseCode
        },
        { status: 400 }
      );
    }

    const transaction = transactionResult.transaction;

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
      transaction?.id,
      transaction?.amount,
      JSON.stringify({
        status: transaction?.status,
        type: transaction?.type,
        processor_response_code: transaction?.processorResponseCode,
        processor_response_text: transaction?.processorResponseText,
        paypal_details: transaction?.paypalDetails
      }),
      paymentIntent.id
    ]);

    // Create payment record
    await pool.execute(`
      INSERT INTO payments (
        user_id, order_id, payment_method, transaction_id, 
        amount, currency, status, processor_response, created_at
      ) VALUES (?, ?, 'paypal', ?, ?, ?, 'completed', ?, NOW())
    `, [
      user?.userId,
      order_id,
      transaction?.id,
      transaction?.amount,
      paymentIntent.currency,
      JSON.stringify({
        paypal_email: transaction?.paypalDetails?.payerEmail,
        transaction_fee: transaction?.paypalDetails?.transactionFeeAmount,
        authorization_id: transaction?.paypalDetails?.authorizationId
      })
    ]);

    // Save PayPal account as payment method if user is logged in
    if (user && transaction?.paypalDetails?.payerEmail) {
      const [existingMethods] = await pool.execute(`
        SELECT id FROM saved_payment_methods 
        WHERE user_id = ? AND payment_type = 'paypal' 
          AND wallet_email = ?
      `, [user.userId, transaction.paypalDetails.payerEmail]);

      if ((existingMethods as any[]).length === 0) {
        await pool.execute(`
          INSERT INTO saved_payment_methods (
            user_id, payment_type, wallet_type, wallet_email,
            billing_name, billing_email, is_default, created_at
          ) VALUES (?, 'paypal', 'paypal', ?, ?, ?, 0, NOW())
        `, [
          user.userId,
          transaction.paypalDetails.payerEmail,
          transaction.paypalDetails.payerFirstName + ' ' + (transaction.paypalDetails.payerLastName || ''),
          transaction.paypalDetails.payerEmail
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      transaction_id: transaction?.id,
      status: transaction?.status,
      amount: transaction?.amount,
      currency: paymentIntent.currency,
      payer_email: transaction?.paypalDetails?.payerEmail,
      payment_details: {
        authorization_id: transaction?.paypalDetails?.authorizationId,
        transaction_fee: transaction?.paypalDetails?.transactionFeeAmount,
        payment_id: transaction?.paypalDetails?.paymentId
      }
    });

  } catch (error) {
    console.error('PayPal capture order error:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal payment' },
      { status: 500 }
    );
  }
}

// GET - Get PayPal order details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const pool = await getPool();

    // Get payment intent details
    const [paymentIntents] = await pool.execute(`
      SELECT * FROM payment_intents 
      WHERE provider_order_id = ? AND provider = 'paypal'
      ${user ? 'AND user_id = ?' : ''}
    `, user ? [order_id, user.userId] : [order_id]);

    if (!paymentIntents || (paymentIntents as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    const paymentIntent = (paymentIntents as any[])[0];

    return NextResponse.json({
      success: true,
      order_id: paymentIntent.provider_order_id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created_at: paymentIntent.created_at,
      order_data: JSON.parse(paymentIntent.order_data || '{}')
    });

  } catch (error) {
    console.error('PayPal get order details error:', error);
    return NextResponse.json(
      { error: 'Failed to get PayPal order details' },
      { status: 500 }
    );
  }
}