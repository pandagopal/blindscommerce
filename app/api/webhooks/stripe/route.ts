import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getPool } from '@/lib/db';
import { getStripeCredentials } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    // Get Stripe credentials from database
    const stripeCredentials = await getStripeCredentials();
    
    if (!stripeCredentials.enabled) {
      return NextResponse.json(
        { error: 'Stripe webhooks are not enabled' },
        { status: 400 }
      );
    }
    
    if (!stripeCredentials.secretKey || !stripeCredentials.webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe credentials not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe with database credentials
    const stripe = new Stripe(stripeCredentials.secretKey, {
      apiVersion: '2024-06-20'
    });

    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, stripeCredentials.webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, pool);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, pool);
        break;
        
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod, pool);
        break;
        
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute, pool, stripe);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, pool);
        break;
        
      default:
        // Unhandled Stripe event type
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, pool: any) {
  // Payment succeeded
  
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
      WHERE provider_order_id = ? AND provider = 'stripe'
    `, [
      paymentIntent.id,
      paymentIntent.amount_received / 100,
      JSON.stringify({
        status: paymentIntent.status,
        payment_method: paymentIntent.payment_method,
        charges: paymentIntent.charges.data.length
      }),
      paymentIntent.id
    ]);

    // Create payment record if it doesn't exist
    const orderRef = paymentIntent.metadata?.order_id || paymentIntent.id;
    
    await pool.execute(`
      INSERT IGNORE INTO payments (
        order_id, payment_method, transaction_id, amount, currency,
        status, processor_response, created_at
      ) VALUES (?, 'stripe', ?, ?, ?, 'completed', ?, NOW())
    `, [
      orderRef,
      paymentIntent.id,
      paymentIntent.amount_received / 100,
      paymentIntent.currency.toUpperCase(),
      JSON.stringify({
        payment_intent_id: paymentIntent.id,
        payment_method_types: paymentIntent.payment_method_types
      })
    ]);

    // Update payment analytics
    await updatePaymentAnalytics('stripe', 'stripe', paymentIntent.amount_received / 100, 'success', pool);

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, pool: any) {
  // Payment failed
  
  try {
    // Update payment intent status
    await pool.execute(`
      UPDATE payment_intents 
      SET 
        status = 'failed',
        error_message = ?,
        processor_response = ?,
        updated_at = NOW()
      WHERE provider_order_id = ? AND provider = 'stripe'
    `, [
      paymentIntent.last_payment_error?.message || 'Payment failed',
      JSON.stringify({
        status: paymentIntent.status,
        last_payment_error: paymentIntent.last_payment_error
      }),
      paymentIntent.id
    ]);

    // Update payment analytics
    await updatePaymentAnalytics('stripe', 'stripe', paymentIntent.amount / 100, 'failed', pool);

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod, pool: any) {
  // Payment method attached
  
  // This could be used to automatically save payment methods for customers
  // Implementation depends on your business logic
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute, pool: any, stripe: Stripe) {
  // Dispute created
  
  try {
    // Get payment ID from charge
    const charge = await stripe.charges.retrieve(dispute.charge as string);
    
    // Find payment record
    const [payments] = await pool.execute(`
      SELECT payment_id FROM payments 
      WHERE transaction_id = ? AND payment_method = 'stripe'
    `, [charge.payment_intent]);

    if ((payments as any[]).length > 0) {
      const paymentId = (payments as any[])[0].payment_id;
      
      // Create dispute record
      await pool.execute(`
        INSERT INTO payment_disputes (
          payment_id, dispute_id, provider, dispute_type, status,
          amount, currency, reason_code, reason_description,
          evidence_due_date, created_at
        ) VALUES (?, ?, 'stripe', 'chargeback', 'open', ?, ?, ?, ?, ?, NOW())
      `, [
        paymentId,
        dispute.id,
        dispute.amount / 100,
        dispute.currency.toUpperCase(),
        dispute.reason,
        dispute.reason,
        dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null
      ]);
    }

  } catch (error) {
    console.error('Error handling dispute created:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, pool: any) {
  // Invoice payment succeeded
  
  // Handle subscription or recurring payment success
  // Implementation depends on your subscription model
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