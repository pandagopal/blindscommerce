import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Internal function to call V2 API endpoints
async function callV2Api(endpoint: string, method: string, data?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const response = await fetch(`${baseUrl}/v2/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-webhook': 'afterpay', // Internal webhook identifier
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

    // Handle different Afterpay events using V2 API
    switch (event.eventType) {
      case 'order.approved':
        await handleOrderApproved(event);
        break;
        
      case 'order.declined':
        await handleOrderDeclined(event);
        break;
        
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
        
      case 'refund.completed':
        await handleRefundCompleted(event);
        break;
        
      default:
        console.log(`Unhandled Afterpay event type: ${event.eventType}`);
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

async function handleOrderApproved(event: any) {
  const order = event.data;
  
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/afterpay/order-approved', 'POST', {
      token: order.token,
      orderId: order.merchantReference,
      amount: order.amount.amount,
      currency: order.amount.currency,
      status: 'approved',
      orderData: order,
    });

  } catch (error) {
    console.error('Error handling Afterpay order approved:', error);
    throw error;
  }
}

async function handleOrderDeclined(event: any) {
  const order = event.data;
  
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/afterpay/order-declined', 'POST', {
      token: order.token,
      orderId: order.merchantReference,
      amount: order.amount.amount,
      currency: order.amount.currency,
      errorMessage: 'Order declined',
      orderData: order,
    });

  } catch (error) {
    console.error('Error handling Afterpay order declined:', error);
    throw error;
  }
}

async function handlePaymentCaptured(event: any) {
  const payment = event.data;
  
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/afterpay/payment-captured', 'POST', {
      paymentId: payment.id,
      orderId: payment.merchantReference,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: 'captured',
      paymentData: payment,
    });

  } catch (error) {
    console.error('Error handling Afterpay payment captured:', error);
    throw error;
  }
}

async function handlePaymentFailed(event: any) {
  const payment = event.data;
  
  try {
    // Update payment via V2 API
    await callV2Api('payments/webhook/afterpay/payment-failed', 'POST', {
      paymentId: payment.id,
      orderId: payment.merchantReference,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      errorMessage: payment.errorMessage || 'Payment failed',
      paymentData: payment,
    });

  } catch (error) {
    console.error('Error handling Afterpay payment failed:', error);
    throw error;
  }
}

async function handleRefundCompleted(event: any) {
  const refund = event.data;
  
  try {
    // Create refund via V2 API
    await callV2Api('payments/webhook/afterpay/refund-completed', 'POST', {
      refundId: refund.refundId,
      paymentId: refund.paymentId,
      amount: refund.amount.amount,
      currency: refund.amount.currency,
      reason: refund.reason || 'requested_by_customer',
      refundData: refund,
    });

  } catch (error) {
    console.error('Error handling Afterpay refund completed:', error);
    throw error;
  }
}