import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Internal function to call V2 API endpoints
async function callV2Api(endpoint: string, method: string, data?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const response = await fetch(`${baseUrl}/v2/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-webhook': 'stripe', // Internal webhook identifier
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'V2 API request failed');
  }
  return result.data;
}

export async function POST(request: NextRequest) {
  try {
    // Get Stripe credentials via V2 API
    const settings = await callV2Api('settings', 'GET');
    const stripeSettings = settings.payments;
    
    if (!stripeSettings.stripe_enabled) {
      return NextResponse.json(
        { error: 'Stripe webhooks are not enabled' },
        { status: 400 }
      );
    }
    
    // Check if webhook secret is configured - if not, webhooks are disabled
    if (!stripeSettings.stripe_webhook_secret) {
      return NextResponse.json(
        { message: 'Stripe webhooks are disabled (no webhook secret configured)' },
        { status: 200 }
      );
    }
    
    if (!stripeSettings.stripe_secret_key) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe with database credentials
    const stripe = new Stripe(stripeSettings.stripe_secret_key, {
      apiVersion: '2024-06-20'
    });

    const body = await request.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, stripeSettings.stripe_webhook_secret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event using V2 API
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_method.attached':
        // Handle payment method attached if needed
        break;
        
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute, stripe);
        break;
        
      case 'invoice.payment_succeeded':
        // Handle invoice payment succeeded if needed
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

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/stripe/payment-succeeded', 'POST', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount_received / 100,
      currency: paymentIntent.currency.toUpperCase(),
      orderId: paymentIntent.metadata?.order_id,
      paymentMethodTypes: paymentIntent.payment_method_types,
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method,
    });

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/stripe/payment-failed', 'POST', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
      lastPaymentError: paymentIntent.last_payment_error,
      status: paymentIntent.status,
    });

  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute, stripe: Stripe) {
  try {
    // Get charge details
    const charge = await stripe.charges.retrieve(dispute.charge as string);
    
    // Create dispute via V2 API
    await callV2Api('payments/webhook/stripe/dispute-created', 'POST', {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      paymentIntentId: charge.payment_intent,
      amount: dispute.amount / 100,
      currency: dispute.currency.toUpperCase(),
      reason: dispute.reason,
      status: 'open',
      evidenceDueBy: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
    });

  } catch (error) {
    console.error('Error handling dispute created:', error);
    throw error;
  }
}