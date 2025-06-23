import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = request.headers;
    
    // Verify PayPal webhook signature
    if (!verifyPayPalSignature(body, headers)) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const pool = await getPool();

    // PayPal webhook received

    // Handle different PayPal events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event, pool);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event, pool);
        break;
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event, pool);
        break;
        
      case 'CHECKOUT.ORDER.APPROVED':
        await handleCheckoutOrderApproved(event, pool);
        break;
        
      case 'CUSTOMER.DISPUTE.CREATED':
        await handleCustomerDisputeCreated(event, pool);
        break;
        
      default:
        // Unhandled PayPal event type
    }

    return NextResponse.json({ status: 'SUCCESS' });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyPayPalSignature(body: string, headers: Headers): boolean {
  const authAlgo = headers.get('paypal-auth-algo');
  const transmission = headers.get('paypal-transmission-id');
  const certId = headers.get('paypal-cert-id');
  const signature = headers.get('paypal-transmission-sig');
  const timestamp = headers.get('paypal-transmission-time');
  
  // PayPal webhook signature verification
  // In production, you should implement proper PayPal signature verification
  // using their SDK or follow their documentation for manual verification
  
  const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('PayPal webhook secret not configured');
    return true; // Allow in development
  }
  
  // Simple HMAC verification (replace with proper PayPal verification)
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('base64');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('PayPal signature verification error:', error);
    return false;
  }
}

async function handlePaymentCaptureCompleted(event: any, pool: any) {
  const capture = event.resource;
  const orderId = capture.supplementary_data?.related_ids?.order_id || capture.custom_id;
  
  try {
    // Update payment intent status
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        status = 'completed',
        transaction_id = ?,
        captured_amount = ?,
        processor_response = ?,
        updated_at = NOW()
      WHERE provider_order_id = ? AND provider = 'paypal'
    `, [
      capture.id,
      parseFloat(capture.amount.value),
      JSON.stringify(capture),
      orderId
    ]);

    // Create payment record
    await pool.execute(`
      INSERT IGNORE INTO payments (
        order_id, payment_method, transaction_id, amount, currency,
        status, processor_response, created_at
      ) VALUES (?, 'paypal', ?, ?, ?, 'completed', ?, NOW())
    `, [
      orderId,
      capture.id,
      parseFloat(capture.amount.value),
      capture.amount.currency_code,
      JSON.stringify({
        capture_id: capture.id,
        payer_email: capture.payer?.email_address,
        paypal_fee: capture.seller_receivable_breakdown?.paypal_fee
      })
    ]);

    // Update analytics
    await updatePaymentAnalytics('paypal', 'paypal', parseFloat(capture.amount.value), 'success', pool);

    // PayPal payment completed

  } catch (error) {
    console.error('Error handling PayPal payment capture completed:', error);
  }
}

async function handlePaymentCaptureDenied(event: any, pool: any) {
  const capture = event.resource;
  const orderId = capture.supplementary_data?.related_ids?.order_id || capture.custom_id;
  
  try {
    // Update payment intent status
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        status = 'failed',
        error_message = ?,
        processor_response = ?,
        updated_at = NOW()
      WHERE provider_order_id = ? AND provider = 'paypal'
    `, [
      'Payment capture denied',
      JSON.stringify(capture),
      orderId
    ]);

    // Update analytics
    await updatePaymentAnalytics('paypal', 'paypal', parseFloat(capture.amount.value), 'failed', pool);

    // PayPal payment denied

  } catch (error) {
    console.error('Error handling PayPal payment capture denied:', error);
  }
}

async function handlePaymentCaptureRefunded(event: any, pool: any) {
  const refund = event.resource;
  
  try {
    // Find the original payment
    const [payments] = await pool.execute(`
      SELECT payment_id FROM payments 
      WHERE transaction_id = ? AND payment_method = 'paypal'
    `, [refund.links?.find((link: any) => link.rel === 'up')?.href?.split('/').pop()]);

    if ((payments as any[]).length > 0) {
      const paymentId = (payments as any[])[0].payment_id;
      
      // Create refund record
      await pool.execute(`
        INSERT INTO payment_refunds (
          payment_id, refund_id, provider, amount, currency,
          reason, status, processor_response, created_at
        ) VALUES (?, ?, 'paypal', ?, ?, 'requested_by_customer', 'succeeded', ?, NOW())
      `, [
        paymentId,
        refund.id,
        parseFloat(refund.amount.value),
        refund.amount.currency_code,
        JSON.stringify(refund)
      ]);
    }

    // PayPal refund processed

  } catch (error) {
    console.error('Error handling PayPal refund:', error);
  }
}

async function handleCheckoutOrderApproved(event: any, pool: any) {
  const order = event.resource;
  
  try {
    // Update payment intent to show order approved
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        processor_response = ?,
        updated_at = NOW()
      WHERE provider_order_id = ? AND provider = 'paypal'
    `, [
      JSON.stringify({ status: 'APPROVED', ...order }),
      order.id
    ]);

    // PayPal order approved

  } catch (error) {
    console.error('Error handling PayPal order approved:', error);
  }
}

async function handleCustomerDisputeCreated(event: any, pool: any) {
  const dispute = event.resource;
  
  try {
    // Find the payment from the disputed transaction
    const [payments] = await pool.execute(`
      SELECT payment_id FROM payments 
      WHERE transaction_id = ? AND payment_method = 'paypal'
    `, [dispute.disputed_transactions?.[0]?.seller_transaction_id]);

    if ((payments as any[]).length > 0) {
      const paymentId = (payments as any[])[0].payment_id;
      
      // Create dispute record
      await pool.execute(`
        INSERT INTO payment_disputes (
          payment_id, dispute_id, provider, dispute_type, status,
          amount, currency, reason_code, reason_description,
          created_at
        ) VALUES (?, ?, 'paypal', 'chargeback', 'open', ?, ?, ?, ?, NOW())
      `, [
        paymentId,
        dispute.dispute_id,
        parseFloat(dispute.dispute_amount.value),
        dispute.dispute_amount.currency_code,
        dispute.reason,
        dispute.dispute_life_cycle_stage
      ]);
    }

    // PayPal dispute created

  } catch (error) {
    console.error('Error handling PayPal dispute:', error);
  }
}

async function updatePaymentAnalytics(paymentMethod: string, provider: string, amount: number, status: 'success' | 'failed', pool: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await pool.execute(`
      INSERT INTO payment_analytics (
        date, payment_method, provider, total_transactions, total_amount,
        successful_transactions, failed_transactions, average_amount, created_at
      ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        total_transactions = total_transactions + 1,
        total_amount = total_amount + VALUES(total_amount),
        successful_transactions = successful_transactions + VALUES(successful_transactions),
        failed_transactions = failed_transactions + VALUES(failed_transactions),
        average_amount = total_amount / total_transactions,
        updated_at = NOW()
    `, [
      today,
      paymentMethod,
      provider,
      status === 'success' ? amount : 0,
      status === 'success' ? 1 : 0,
      status === 'failed' ? 1 : 0,
      amount
    ]);

  } catch (error) {
    console.error('Error updating payment analytics:', error);
  }
}