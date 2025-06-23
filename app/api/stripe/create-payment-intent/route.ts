import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeCredentials } from '@/lib/settings';

export async function POST(req: NextRequest) {
  try {
    // Get Stripe credentials from database
    const stripeCredentials = await getStripeCredentials();
    
    if (!stripeCredentials.enabled) {
      return NextResponse.json(
        { error: 'Stripe payments are not enabled' },
        { status: 400 }
      );
    }
    
    if (!stripeCredentials.secretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe with database credentials
    const stripe = new Stripe(stripeCredentials.secretKey);
    
    const body = await req.json();
    const { amount, metadata, shipping, customer_email } = body;

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: 'usd',
      metadata,
      shipping,
      receipt_email: customer_email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
}
