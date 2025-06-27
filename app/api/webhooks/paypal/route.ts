import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Internal function to call V2 API endpoints
async function callV2Api(endpoint: string, method: string, data?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const response = await fetch(`${baseUrl}/v2/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-webhook': 'paypal', // Internal webhook identifier
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

    // Handle different PayPal events using V2 API
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event);
        break;
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event);
        break;
        
      case 'CHECKOUT.ORDER.APPROVED':
        await handleCheckoutOrderApproved(event);
        break;
        
      case 'CUSTOMER.DISPUTE.CREATED':
        await handleCustomerDisputeCreated(event);
        break;
        
      default:
        // Unhandled PayPal event type
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
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
  const transmissionId = headers.get('paypal-transmission-id');
  const certUrl = headers.get('paypal-cert-url');
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
  
  // TODO: Implement proper PayPal webhook signature verification
  // For now, return true to allow processing
  return true;
}

async function handlePaymentCaptureCompleted(event: any) {
  const capture = event.resource;
  const orderId = capture.supplementary_data?.related_ids?.order_id || capture.custom_id;
  
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/paypal/capture-completed', 'POST', {
      captureId: capture.id,
      orderId: orderId,
      amount: parseFloat(capture.amount.value),
      currency: capture.amount.currency_code,
      payerEmail: capture.payer?.email_address,
      paypalFee: capture.seller_receivable_breakdown?.paypal_fee,
      status: capture.status,
      captureData: capture,
    });

  } catch (error) {
    console.error('Error handling PayPal payment capture completed:', error);
    throw error;
  }
}

async function handlePaymentCaptureDenied(event: any) {
  const capture = event.resource;
  const orderId = capture.supplementary_data?.related_ids?.order_id || capture.custom_id;
  
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/paypal/capture-denied', 'POST', {
      captureId: capture.id,
      orderId: orderId,
      amount: parseFloat(capture.amount.value),
      currency: capture.amount.currency_code,
      errorMessage: 'Payment capture denied',
      captureData: capture,
    });

  } catch (error) {
    console.error('Error handling PayPal payment capture denied:', error);
    throw error;
  }
}

async function handlePaymentCaptureRefunded(event: any) {
  const refund = event.resource;
  
  try {
    const captureId = refund.links?.find((link: any) => link.rel === 'up')?.href?.split('/').pop();
    
    // Create refund via V2 API
    await callV2Api('payments/webhook/paypal/refund-created', 'POST', {
      refundId: refund.id,
      captureId: captureId,
      amount: parseFloat(refund.amount.value),
      currency: refund.amount.currency_code,
      reason: 'requested_by_customer',
      status: refund.status,
      refundData: refund,
    });

  } catch (error) {
    console.error('Error handling PayPal payment capture refunded:', error);
    throw error;
  }
}

async function handleCheckoutOrderApproved(event: any) {
  const order = event.resource;
  
  try {
    // Notify V2 API about order approval
    await callV2Api('payments/webhook/paypal/order-approved', 'POST', {
      orderId: order.id,
      payerEmail: order.payer?.email_address,
      orderData: order,
    });

  } catch (error) {
    console.error('Error handling PayPal checkout order approved:', error);
    throw error;
  }
}

async function handleCustomerDisputeCreated(event: any) {
  const dispute = event.resource;
  
  try {
    // Create dispute via V2 API
    await callV2Api('payments/webhook/paypal/dispute-created', 'POST', {
      disputeId: dispute.dispute_id,
      orderId: dispute.disputed_transactions?.[0]?.seller_transaction_id,
      amount: parseFloat(dispute.dispute_amount.value),
      currency: dispute.dispute_amount.currency_code,
      reason: dispute.reason,
      status: dispute.status,
      disputeData: dispute,
    });

  } catch (error) {
    console.error('Error handling PayPal customer dispute created:', error);
    throw error;
  }
}