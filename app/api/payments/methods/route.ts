import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// GET - Get available payment methods for checkout
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const currency = searchParams.get('currency') || 'USD';
    const country = searchParams.get('country') || 'US';

    const user = await getCurrentUser();

    // Base payment methods always available
    const paymentMethods = [
      {
        id: 'stripe_card',
        name: 'Credit/Debit Card',
        type: 'card',
        provider: 'stripe',
        description: 'Visa, Mastercard, American Express, Discover',
        icon: 'credit-card',
        min_amount: 0.50,
        max_amount: 999999,
        currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        countries: ['US', 'CA', 'GB', 'AU', 'EU'],
        processing_time: 'instant',
        fee_structure: 'percentage',
        fees: {
          percentage: 2.9,
          fixed: 0.30
        },
        available: true,
        recommended: true
      },
      {
        id: 'stripe_apple_pay',
        name: 'Apple Pay',
        type: 'digital_wallet',
        provider: 'stripe',
        description: 'Pay securely with Touch ID or Face ID',
        icon: 'apple',
        min_amount: 0.50,
        max_amount: 999999,
        currencies: ['USD', 'EUR', 'GBP', 'CAD'],
        countries: ['US', 'CA', 'GB', 'AU'],
        processing_time: 'instant',
        device_requirements: ['iOS', 'macOS', 'Safari'],
        available: true
      },
      {
        id: 'stripe_google_pay',
        name: 'Google Pay',
        type: 'digital_wallet',
        provider: 'stripe',
        description: 'Pay quickly with your Google account',
        icon: 'google',
        min_amount: 0.50,
        max_amount: 999999,
        currencies: ['USD', 'EUR', 'GBP', 'CAD'],
        countries: ['US', 'CA', 'GB', 'AU'],
        processing_time: 'instant',
        device_requirements: ['Android', 'Chrome'],
        available: true
      },
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'digital_wallet',
        provider: 'paypal',
        description: 'Pay with your PayPal account or PayPal Credit',
        icon: 'paypal',
        min_amount: 0.01,
        max_amount: 10000,
        currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        countries: ['US', 'CA', 'GB', 'AU', 'EU'],
        processing_time: 'instant',
        fee_structure: 'percentage',
        fees: {
          percentage: 3.49,
          fixed: 0.49
        },
        available: process.env.BRAINTREE_MERCHANT_ID ? true : false
      }
    ];

    // Buy Now, Pay Later options
    const bnplMethods = [
      {
        id: 'klarna',
        name: 'Klarna',
        type: 'bnpl',
        provider: 'klarna',
        description: 'Pay in 4 interest-free installments',
        icon: 'klarna',
        min_amount: 1,
        max_amount: 10000,
        currencies: ['USD', 'EUR', 'GBP', 'SEK'],
        countries: ['US', 'CA', 'GB', 'SE', 'DE', 'AT'],
        processing_time: 'instant',
        installments: 4,
        installment_frequency: 'bi_weekly',
        interest_rate: 0,
        late_fees: true,
        credit_check: 'soft',
        available: amount >= 1 && amount <= 10000 && process.env.KLARNA_USERNAME ? true : false,
        popular: true
      },
      {
        id: 'afterpay',
        name: 'Afterpay',
        type: 'bnpl',
        provider: 'afterpay',
        description: 'Pay in 4 installments, always interest-free',
        icon: 'afterpay',
        min_amount: 1,
        max_amount: 4000,
        currencies: ['USD', 'AUD', 'CAD', 'GBP'],
        countries: ['US', 'CA', 'AU', 'GB'],
        processing_time: 'instant',
        installments: 4,
        installment_frequency: 'bi_weekly',
        interest_rate: 0,
        late_fees: true,
        credit_check: 'soft',
        available: amount >= 1 && amount <= 4000 && process.env.AFTERPAY_MERCHANT_ID ? true : false
      },
      {
        id: 'affirm',
        name: 'Affirm',
        type: 'bnpl',
        provider: 'affirm',
        description: 'Monthly payments as low as 0% APR',
        icon: 'affirm',
        min_amount: 50,
        max_amount: 17500,
        currencies: ['USD', 'CAD'],
        countries: ['US', 'CA'],
        processing_time: 'instant',
        installments: [3, 6, 12, 18, 24, 36],
        installment_frequency: 'monthly',
        interest_rate_range: [0, 36],
        credit_check: 'soft',
        prequalification: true,
        available: amount >= 50 && amount <= 17500 && process.env.AFFIRM_PUBLIC_API_KEY ? true : false
      }
    ];

    // Bank transfer options
    const bankMethods = [
      {
        id: 'stripe_ach',
        name: 'Bank Transfer (ACH)',
        type: 'bank_transfer',
        provider: 'stripe',
        description: 'Direct debit from your US bank account',
        icon: 'bank',
        min_amount: 0.50,
        max_amount: 500000,
        currencies: ['USD'],
        countries: ['US'],
        processing_time: '3-5 business days',
        fee_structure: 'flat',
        fees: {
          fixed: 0.80
        },
        available: country === 'US'
      }
    ];

    // Filter methods based on amount, currency, and country
    const availableMethods = [
      ...paymentMethods,
      ...bnplMethods,
      ...bankMethods
    ].filter(method => {
      // Check if method is available
      if (!method.available) return false;
      
      // Check amount limits
      if (amount < method.min_amount || amount > method.max_amount) return false;
      
      // Check currency support
      if (!method.currencies.includes(currency)) return false;
      
      // Check country support
      if (!method.countries.includes(country)) return false;
      
      return true;
    });

    // Calculate fees for each method
    const methodsWithFees = availableMethods.map(method => {
      let estimatedFee = 0;
      
      if (method.fee_structure === 'percentage' && method.fees) {
        estimatedFee = (amount * (method.fees.percentage / 100)) + (method.fees.fixed || 0);
      } else if (method.fee_structure === 'flat' && method.fees) {
        estimatedFee = method.fees.fixed || 0;
      }

      return {
        ...method,
        estimated_fee: estimatedFee,
        estimated_total: amount + estimatedFee
      };
    });

    // Sort methods by recommendation
    const sortedMethods = methodsWithFees.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return a.estimated_fee - b.estimated_fee;
    });

    return NextResponse.json({
      success: true,
      payment_methods: sortedMethods,
      filters: {
        amount,
        currency,
        country
      },
      total_methods: sortedMethods.length,
      recommendations: {
        lowest_fee: sortedMethods.reduce((min, method) => 
          method.estimated_fee < min.estimated_fee ? method : min
        ),
        fastest: sortedMethods.filter(m => m.processing_time === 'instant')[0],
        most_flexible: sortedMethods.filter(m => m.type === 'bnpl')[0]
      }
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment methods' },
      { status: 500 }
    );
  }
}

// POST - Initialize payment with selected method
export async function POST(request: NextRequest) {
  try {
    const { 
      payment_method_id, 
      amount, 
      currency = 'USD',
      items = [],
      shipping_address,
      billing_address,
      order_id 
    } = await request.json();

    if (!payment_method_id || !amount) {
      return NextResponse.json(
        { error: 'Payment method and amount are required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    // Route to appropriate payment provider
    let paymentResponse;
    
    switch (payment_method_id) {
      case 'stripe_card':
      case 'stripe_apple_pay':
      case 'stripe_google_pay':
      case 'stripe_ach':
        // Create Stripe payment intent
        const stripeResponse = await fetch(`${request.nextUrl.origin}/api/stripe/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency,
            metadata: { order_id },
            customer_email: user?.email || billing_address?.email
          })
        });
        paymentResponse = await stripeResponse.json();
        break;

      case 'paypal':
        // Create PayPal order
        const paypalResponse = await fetch(`${request.nextUrl.origin}/api/payments/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency,
            items,
            shipping_address,
            billing_address,
            order_id
          })
        });
        paymentResponse = await paypalResponse.json();
        break;

      case 'klarna':
        // Create Klarna session
        const klarnaResponse = await fetch(`${request.nextUrl.origin}/api/payments/klarna/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency,
            items,
            shipping_address,
            billing_address,
            order_id
          })
        });
        paymentResponse = await klarnaResponse.json();
        break;

      case 'afterpay':
        // Create Afterpay checkout
        const afterpayResponse = await fetch(`${request.nextUrl.origin}/api/payments/afterpay/create-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency,
            items,
            shipping_address,
            billing_address,
            order_id
          })
        });
        paymentResponse = await afterpayResponse.json();
        break;

      case 'affirm':
        // Create Affirm checkout
        const affirmResponse = await fetch(`${request.nextUrl.origin}/api/payments/affirm/create-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency,
            items,
            shipping_address,
            billing_address,
            order_id
          })
        });
        paymentResponse = await affirmResponse.json();
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported payment method' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      payment_method: payment_method_id,
      provider_response: paymentResponse
    });

  } catch (error) {
    console.error('Initialize payment error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}