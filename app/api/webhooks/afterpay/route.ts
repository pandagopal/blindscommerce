import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-afterpay-signature');
    
    // Verify Afterpay webhook signature
    if (!verifyAfterpaySignature(body, signature)) {
      console.error('Afterpay webhook signature verification failed');
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const pool = await getPool();


    // Handle different Afterpay events
    switch (event.eventType) {
      case 'order.approved':
        await handleOrderApproved(event, pool);
        break;
        
      case 'order.declined':
        await handleOrderDeclined(event, pool);
        break;
        
      case 'payment.captured':
        await handlePaymentCaptured(event, pool);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(event, pool);
        break;
        
      case 'refund.completed':
        await handleRefundCompleted(event, pool);
        break;
        
      default:
    }

    return NextResponse.json({ status: 'OK' });

  } catch (error) {
    console.error('Afterpay webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyAfterpaySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const secret = process.env.AFTERPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('Afterpay webhook secret not configured');
    return true; // Allow in development
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  } catch (error) {
    console.error('Afterpay signature verification error:', error);
    return false;
  }
}

async function handleOrderApproved(event: any, pool: any) {
  const order = event.data;
  
  try {
    // Update payment intent status
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        status = 'pending',
        processor_response = ?,
        updated_at = NOW()
      WHERE provider_order_id = ? AND provider = 'afterpay'
    `, [
      JSON.stringify({ status: 'approved', ...order }),
      order.token
    ]);


  } catch (error) {
    console.error('Error handling Afterpay order approved:', error);
  }
}

async function handleOrderDeclined(event: any, pool: any) {
  const order = event.data;
  
  try {
    // Update payment intent status
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        status = 'failed',
        error_message = 'Order declined by Afterpay',
        processor_response = ?,
        updated_at = NOW()
      WHERE provider_order_id = ? AND provider = 'afterpay'
    `, [
      JSON.stringify({ status: 'declined', ...order }),
      order.token
    ]);

    // Update analytics
    await updatePaymentAnalytics('afterpay', 'afterpay', parseFloat(order.amount?.amount || 0), 'failed', pool);


  } catch (error) {
    console.error('Error handling Afterpay order declined:', error);
  }
}

async function handlePaymentCaptured(event: any, pool: any) {
  const payment = event.data;
  
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
      WHERE provider_order_id = ? AND provider = 'afterpay'
    `, [
      payment.id,
      parseFloat(payment.amount?.amount || 0),
      JSON.stringify(payment),
      payment.orderToken
    ]);

    // Create payment record
    await pool.execute(`
      INSERT IGNORE INTO payments (
        order_id, payment_method, transaction_id, amount, currency,
        status, processor_response, created_at
      ) VALUES (?, 'afterpay', ?, ?, ?, 'completed', ?, NOW())
    `, [
      payment.merchantReference,
      payment.id,
      parseFloat(payment.amount?.amount || 0),
      payment.amount?.currency || 'USD',
      JSON.stringify({
        afterpay_payment_id: payment.id,
        order_token: payment.orderToken,
        installments: 4
      })
    ]);

    // Update analytics
    await updatePaymentAnalytics('afterpay', 'afterpay', parseFloat(payment.amount?.amount || 0), 'success', pool);


  } catch (error) {
    console.error('Error handling Afterpay payment captured:', error);
  }
}

async function handlePaymentFailed(event: any, pool: any) {
  const payment = event.data;
  
  try {
    // Update payment intent status
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        status = 'failed',
        error_message = 'Payment failed',
        processor_response = ?,
        updated_at = NOW()
      WHERE provider_order_id = ? AND provider = 'afterpay'
    `, [
      JSON.stringify(payment),
      payment.orderToken
    ]);

    // Update analytics
    await updatePaymentAnalytics('afterpay', 'afterpay', parseFloat(payment.amount?.amount || 0), 'failed', pool);


  } catch (error) {
    console.error('Error handling Afterpay payment failed:', error);
  }
}

async function handleRefundCompleted(event: any, pool: any) {
  const refund = event.data;
  
  try {
    // Find the original payment
    const [payments] = await pool.execute(`
      SELECT payment_id FROM payments 
      WHERE transaction_id = ? AND payment_method = 'afterpay'
    `, [refund.paymentId]);

    if ((payments as any[]).length > 0) {
      const paymentId = (payments as any[])[0].payment_id;
      
      // Create refund record
      await pool.execute(`
        INSERT INTO payment_refunds (
          payment_id, refund_id, provider, amount, currency,
          reason, status, processor_response, created_at
        ) VALUES (?, ?, 'afterpay', ?, ?, 'requested_by_customer', 'succeeded', ?, NOW())
      `, [
        paymentId,
        refund.refundId,
        parseFloat(refund.amount?.amount || 0),
        refund.amount?.currency || 'USD',
        JSON.stringify(refund)
      ]);
    }


  } catch (error) {
    console.error('Error handling Afterpay refund:', error);
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