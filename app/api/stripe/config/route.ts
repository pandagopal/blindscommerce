import { NextRequest, NextResponse } from 'next/server';
import { getStripeCredentials } from '@/lib/settings';

// GET /api/stripe/config - Get Stripe publishable key and configuration
export async function GET(req: NextRequest) {
  try {
    // Get Stripe credentials from database
    const stripeCredentials = await getStripeCredentials();
    
    if (!stripeCredentials.enabled) {
      return NextResponse.json(
        { error: 'Stripe payments are not enabled' },
        { status: 400 }
      );
    }
    
    if (!stripeCredentials.publishableKey) {
      return NextResponse.json(
        { error: 'Stripe publishable key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publishableKey: stripeCredentials.publishableKey,
      enabled: stripeCredentials.enabled
    });
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe configuration' },
      { status: 500 }
    );
  }
}