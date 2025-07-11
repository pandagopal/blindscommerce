import Stripe from 'stripe';
import { BaseService } from './BaseService';
import type { SettingsService } from './SettingsService';

interface PaymentIntent {
  payment_method_id: string;
  amount: number;
  currency: string;
  payment_data: {
    cardNumber?: string;
    expiryDate?: string;
    cvc?: string;
    cardholderName?: string;
  };
  billing_address: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shipping_address?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  order_items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    product_id: string;
  }>;
  metadata?: Record<string, string>;
}

export class PaymentService extends BaseService {
  private stripe: Stripe | null = null;
  private stripeInitialized = false;
  private settingsService: SettingsService | null = null;

  constructor() {
    super();
  }

  setSettingsService(settingsService: SettingsService) {
    this.settingsService = settingsService;
  }

  private async initializeStripe() {
    if (this.stripeInitialized || !this.settingsService) {
      return;
    }

    try {
      const settings = await this.settingsService.getAllSettings();
      const stripeSecretKey = settings.payments?.stripe_secret_key;
      
      // Debug logging
      console.log('Stripe settings:', {
        enabled: settings.payments?.stripe_enabled,
        hasSecretKey: !!stripeSecretKey,
        keyPrefix: stripeSecretKey?.substring(0, 7) // Show key prefix for debugging
      });
      
      // Use test key if no key is configured but Stripe is in test mode
      const isTestMode = settings.payments?.stripe_environment !== 'live';
      let finalStripeKey = stripeSecretKey;
      
      if (isTestMode && !stripeSecretKey) {
        // No fallback - Stripe key must be configured in database
        console.log('Stripe test mode enabled but no key configured in database');
      }
      
      if (finalStripeKey) {
        // Ensure we're using the secret key, not the publishable key
        if (finalStripeKey.startsWith('pk_')) {
          console.error('ERROR: Using publishable key instead of secret key!');
          throw new Error('Invalid Stripe configuration: secret key required');
        }
        
        this.stripe = new Stripe(finalStripeKey, {
          apiVersion: '2024-12-18.acacia',
        });
        this.stripeInitialized = true;
        console.log('Stripe initialized successfully with', finalStripeKey.substring(0, 7) + '...');
      } else {
        console.log('Stripe not initialized - no secret key available');
      }
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  }

  async processPayment(paymentIntent: PaymentIntent) {
    // Determine payment provider from payment_method_id
    const provider = this.getProviderFromMethodId(paymentIntent.payment_method_id);
    
    switch (provider) {
      case 'stripe':
        return this.processStripePayment(paymentIntent);
      case 'klarna':
        return this.processKlarnaPayment(paymentIntent);
      case 'affirm':
        return this.processAffirmPayment(paymentIntent);
      case 'paypal':
        return this.processPayPalPayment(paymentIntent);
      case 'braintree':
        return this.processBraintreePayment(paymentIntent);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  private getProviderFromMethodId(methodId: string): string {
    if (methodId.startsWith('stripe_')) return 'stripe';
    if (methodId === 'klarna') return 'klarna';
    if (methodId === 'affirm') return 'affirm';
    if (methodId === 'paypal') return 'paypal';
    if (methodId === 'braintree' || methodId.startsWith('braintree_')) return 'braintree';
    return 'stripe'; // Default to stripe
  }

  private async processStripePayment(paymentIntent: PaymentIntent) {
    // Ensure Stripe is initialized
    if (!this.stripe) {
      await this.initializeStripe();
    }

    if (!this.stripe) {
      throw new Error('Stripe payment processing is not configured. Please contact support.');
    }

    try {
      // Check if we're in test mode
      const settings = await this.settingsService?.getAllSettings();
      const isTestMode = settings?.payments?.stripe_environment !== 'live' || 
                         settings?.payments?.stripe_secret_key?.startsWith('sk_test_');
      
      let paymentMethodId: string;
      
      // Check if payment method ID was provided from frontend (production flow)
      if (paymentIntent.payment_method_id && paymentIntent.payment_method_id.startsWith('pm_')) {
        // Production flow: Use the payment method ID created by Stripe Elements on frontend
        paymentMethodId = paymentIntent.payment_method_id;
      } else if (isTestMode) {
        // Test mode: Create a test payment method
        console.log('Test mode: Using Stripe test payment method');
        const testPaymentMethod = await this.stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: 'tok_visa', // Stripe's test token for Visa
          },
          billing_details: {
            name: `${paymentIntent.billing_address.firstName} ${paymentIntent.billing_address.lastName}`,
            email: paymentIntent.billing_address.email,
            address: {
              line1: paymentIntent.billing_address.address,
              city: paymentIntent.billing_address.city,
              state: paymentIntent.billing_address.state,
              postal_code: paymentIntent.billing_address.zipCode,
              country: 'US',
            },
          },
        });
        paymentMethodId = testPaymentMethod.id;
      } else {
        // Production mode but no payment method ID provided
        throw new Error('In production mode, payment method must be created on frontend using Stripe Elements. Please integrate Stripe Elements in your checkout form.');
      }

      // Create a payment intent
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentIntent.amount * 100), // Convert to cents
        currency: paymentIntent.currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: false,
        },
        metadata: {
          ...paymentIntent.metadata,
          customer_email: paymentIntent.billing_address.email,
          customer_name: `${paymentIntent.billing_address.firstName} ${paymentIntent.billing_address.lastName}`,
        },
        receipt_email: paymentIntent.billing_address.email,
        description: 'BlindsCommerce Order',
      });

      // Check if payment requires additional action (3D Secure, etc.)
      if (intent.status === 'requires_action' || intent.status === 'requires_source_action') {
        return {
          success: false,
          requires_action: true,
          client_secret: intent.client_secret,
          message: 'Payment requires additional authentication',
        };
      }

      if (intent.status === 'succeeded') {
        return {
          success: true,
          provider_response: {
            id: intent.id,
            status: intent.status,
            amount: intent.amount / 100, // Convert back from cents
            currency: intent.currency,
            payment_method: intent.payment_method,
            receipt_url: intent.charges?.data[0]?.receipt_url,
          },
        };
      }

      // Payment failed
      return {
        success: false,
        error: 'Payment failed',
        provider_response: {
          id: intent.id,
          status: intent.status,
          error: intent.last_payment_error?.message,
        },
      };

    } catch (error) {
      console.error('Stripe payment error:', error);
      
      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          type: error.type,
        };
      }

      throw error;
    }
  }

  private async createPaymentMethod(paymentIntent: PaymentIntent): Promise<Stripe.PaymentMethod> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    // In production, the payment method should be created on the frontend using Stripe Elements
    // This is a simplified version for testing
    
    // Check if we have card data from the frontend
    if (paymentIntent.payment_data.cardNumber) {
      // Parse the card data from frontend (this is temporary - use Stripe Elements in production)
      const [expMonth, expYear] = (paymentIntent.payment_data.expiryDate || '').split('/');
      
      const card = {
        number: paymentIntent.payment_data.cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(expMonth) || 12,
        exp_year: parseInt('20' + expYear) || 2025,
        cvc: paymentIntent.payment_data.cvc || '123',
      };
      
      // Use the provided card
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: card,
        billing_details: {
          name: paymentIntent.payment_data.cardholderName || `${paymentIntent.billing_address.firstName} ${paymentIntent.billing_address.lastName}`,
          email: paymentIntent.billing_address.email,
          address: {
            line1: paymentIntent.billing_address.address,
            city: paymentIntent.billing_address.city,
            state: paymentIntent.billing_address.state,
            postal_code: paymentIntent.billing_address.zipCode,
            country: 'US',
          },
        },
      });
      
      return paymentMethod;
    }
    
    // For testing without card data, use a test card
    // This allows testing the flow without entering real card details
    console.log('Using Stripe test card for payment processing');
    const testCard = {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
    };

    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: testCard,
      billing_details: {
        name: `${paymentIntent.billing_address.firstName} ${paymentIntent.billing_address.lastName}`,
        email: paymentIntent.billing_address.email,
        address: {
          line1: paymentIntent.billing_address.address,
          city: paymentIntent.billing_address.city,
          state: paymentIntent.billing_address.state,
          postal_code: paymentIntent.billing_address.zipCode,
          country: 'US',
        },
      },
    });

    return paymentMethod;
  }

  private async processKlarnaPayment(paymentIntent: PaymentIntent) {
    if (!this.settingsService) {
      throw new Error('Settings service not initialized');
    }
    const settings = await this.settingsService.getAllSettings();
    const klarnaSettings = settings.payments;
    
    if (!klarnaSettings?.klarna_enabled || !klarnaSettings?.klarna_username || !klarnaSettings?.klarna_password) {
      throw new Error('Klarna payment processing is not configured');
    }

    try {
      // Klarna requires creating a session first
      const klarnaAuth = Buffer.from(`${klarnaSettings.klarna_username}:${klarnaSettings.klarna_password}`).toString('base64');
      const klarnaApiUrl = klarnaSettings.klarna_api_url || 'https://api.playground.klarna.com';
      
      // Create Klarna session
      const sessionResponse = await fetch(`${klarnaApiUrl}/payments/v1/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${klarnaAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchase_country: 'US',
          purchase_currency: paymentIntent.currency.toUpperCase(),
          locale: 'en-US',
          order_amount: Math.round(paymentIntent.amount * 100),
          order_tax_amount: 0, // Should be calculated
          order_lines: paymentIntent.order_items?.map(item => ({
            type: 'physical',
            reference: item.product_id,
            name: item.name,
            quantity: item.quantity,
            unit_price: Math.round(item.unit_price * 100),
            tax_rate: 0,
            total_amount: Math.round(item.unit_price * item.quantity * 100),
            total_tax_amount: 0,
          })) || [{
            type: 'physical',
            name: 'Order Total',
            quantity: 1,
            unit_price: Math.round(paymentIntent.amount * 100),
            tax_rate: 0,
            total_amount: Math.round(paymentIntent.amount * 100),
            total_tax_amount: 0,
          }],
          customer: {
            email: paymentIntent.billing_address.email,
          },
          billing_address: {
            given_name: paymentIntent.billing_address.firstName,
            family_name: paymentIntent.billing_address.lastName,
            email: paymentIntent.billing_address.email,
            street_address: paymentIntent.billing_address.address,
            city: paymentIntent.billing_address.city,
            region: paymentIntent.billing_address.state,
            postal_code: paymentIntent.billing_address.zipCode,
            country: 'US',
          },
          shipping_address: paymentIntent.shipping_address ? {
            given_name: paymentIntent.shipping_address.firstName,
            family_name: paymentIntent.shipping_address.lastName,
            street_address: paymentIntent.shipping_address.address,
            city: paymentIntent.shipping_address.city,
            region: paymentIntent.shipping_address.state,
            postal_code: paymentIntent.shipping_address.zipCode,
            country: 'US',
          } : undefined,
        }),
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json();
        throw new Error(error.error_messages?.[0] || 'Failed to create Klarna session');
      }

      const session = await sessionResponse.json();

      // In a real implementation, you would redirect the user to Klarna's hosted payment page
      // For now, we'll return the session data for the frontend to handle
      return {
        success: false,
        requires_action: true,
        provider: 'klarna',
        session_id: session.session_id,
        client_token: session.client_token,
        payment_method_categories: session.payment_method_categories,
        message: 'Redirect customer to Klarna checkout',
      };

    } catch (error) {
      console.error('Klarna payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Klarna payment failed',
      };
    }
  }

  private async processAffirmPayment(paymentIntent: PaymentIntent) {
    if (!this.settingsService) {
      throw new Error('Settings service not initialized');
    }
    const settings = await this.settingsService.getAllSettings();
    const affirmSettings = settings.payments;
    
    if (!affirmSettings?.affirm_enabled || !affirmSettings?.affirm_public_key || !affirmSettings?.affirm_private_key) {
      throw new Error('Affirm payment processing is not configured');
    }

    try {
      // Affirm uses a checkout flow where the customer is redirected to Affirm's site
      // Here we create the checkout data that the frontend will use
      
      const affirmApiUrl = affirmSettings.affirm_api_url || 'https://sandbox.affirm.com';
      
      // Create checkout object for Affirm
      const checkoutData = {
        merchant: {
          public_api_key: affirmSettings.affirm_public_key,
          user_confirmation_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirm`,
          user_cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
        },
        billing: {
          name: {
            first: paymentIntent.billing_address.firstName,
            last: paymentIntent.billing_address.lastName,
          },
          address: {
            line1: paymentIntent.billing_address.address,
            city: paymentIntent.billing_address.city,
            state: paymentIntent.billing_address.state,
            zipcode: paymentIntent.billing_address.zipCode,
            country: 'USA',
          },
          email: paymentIntent.billing_address.email,
        },
        shipping: paymentIntent.shipping_address ? {
          name: {
            first: paymentIntent.shipping_address.firstName,
            last: paymentIntent.shipping_address.lastName,
          },
          address: {
            line1: paymentIntent.shipping_address.address,
            city: paymentIntent.shipping_address.city,
            state: paymentIntent.shipping_address.state,
            zipcode: paymentIntent.shipping_address.zipCode,
            country: 'USA',
          },
        } : undefined,
        items: paymentIntent.order_items?.map(item => ({
          display_name: item.name,
          sku: item.product_id,
          unit_price_cents: Math.round(item.unit_price * 100),
          qty: item.quantity,
        })) || [{
          display_name: 'Order Total',
          sku: 'ORDER',
          unit_price_cents: Math.round(paymentIntent.amount * 100),
          qty: 1,
        }],
        metadata: {
          ...paymentIntent.metadata,
        },
        order_id: `${Date.now()}`,
        total: Math.round(paymentIntent.amount * 100),
        currency: 'USD',
      };

      // In a real implementation, the frontend would use affirm.js to open the checkout
      // The checkout_token would be created on the frontend
      // For now, return the data needed for the frontend
      return {
        success: false,
        requires_action: true,
        provider: 'affirm',
        checkout_data: checkoutData,
        public_api_key: affirmSettings.affirm_public_key,
        script_url: `${affirmApiUrl}/js/v2/affirm.js`,
        message: 'Redirect customer to Affirm checkout',
      };

    } catch (error) {
      console.error('Affirm payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Affirm payment failed',
      };
    }
  }

  private async processPayPalPayment(paymentIntent: PaymentIntent) {
    if (!this.settingsService) {
      throw new Error('Settings service not initialized');
    }
    const settings = await this.settingsService.getAllSettings();
    const paypalSettings = settings.payments;
    
    if (!paypalSettings?.paypal_enabled || !paypalSettings?.paypal_client_id || !paypalSettings?.paypal_client_secret) {
      throw new Error('PayPal payment processing is not configured');
    }

    try {
      // Get PayPal access token
      const authString = Buffer.from(`${paypalSettings.paypal_client_id}:${paypalSettings.paypal_client_secret}`).toString('base64');
      const paypalApiUrl = paypalSettings.paypal_environment === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';
      
      // Get access token
      const tokenResponse = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with PayPal');
      }

      const { access_token } = await tokenResponse.json();

      // Create PayPal order
      const orderResponse = await fetch(`${paypalApiUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `blindscommerce-${Date.now()}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: 'default',
            amount: {
              currency_code: paymentIntent.currency.toUpperCase(),
              value: paymentIntent.amount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: paymentIntent.currency.toUpperCase(),
                  value: paymentIntent.amount.toFixed(2),
                },
              },
            },
            items: paymentIntent.order_items?.map(item => ({
              name: item.name,
              unit_amount: {
                currency_code: paymentIntent.currency.toUpperCase(),
                value: item.unit_price.toFixed(2),
              },
              quantity: item.quantity.toString(),
            })) || [{
              name: 'Order Total',
              unit_amount: {
                currency_code: paymentIntent.currency.toUpperCase(),
                value: paymentIntent.amount.toFixed(2),
              },
              quantity: '1',
            }],
            shipping: paymentIntent.shipping_address ? {
              name: {
                full_name: `${paymentIntent.shipping_address.firstName} ${paymentIntent.shipping_address.lastName}`,
              },
              address: {
                address_line_1: paymentIntent.shipping_address.address,
                admin_area_2: paymentIntent.shipping_address.city,
                admin_area_1: paymentIntent.shipping_address.state,
                postal_code: paymentIntent.shipping_address.zipCode,
                country_code: 'US',
              },
            } : undefined,
          }],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirm`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
              },
            },
          },
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || 'Failed to create PayPal order');
      }

      const order = await orderResponse.json();

      // Return approval URL for redirect
      const approvalUrl = order.links?.find((link: any) => link.rel === 'payer-action')?.href;
      
      return {
        success: false,
        requires_action: true,
        provider: 'paypal',
        order_id: order.id,
        approval_url: approvalUrl,
        message: 'Redirect customer to PayPal for approval',
      };

    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal payment failed',
      };
    }
  }

  private async processBraintreePayment(paymentIntent: PaymentIntent) {
    if (!this.settingsService) {
      throw new Error('Settings service not initialized');
    }
    const settings = await this.settingsService.getAllSettings();
    const braintreeSettings = settings.payments;
    
    if (!braintreeSettings?.braintree_enabled || 
        !braintreeSettings?.braintree_merchant_id || 
        !braintreeSettings?.braintree_public_key || 
        !braintreeSettings?.braintree_private_key) {
      throw new Error('Braintree payment processing is not configured');
    }

    try {
      // Note: In production, you should use the official Braintree SDK
      // npm install braintree
      // This is a simplified implementation
      
      const braintreeApiUrl = braintreeSettings.braintree_environment === 'production'
        ? 'https://payments.braintree-api.com'
        : 'https://payments.sandbox.braintree-api.com';

      // For Braintree, we need to create a client token first for the frontend
      // Then process the payment nonce received from frontend
      
      // Since we're implementing server-side only, we'll return the data needed
      // for the frontend to complete the payment
      return {
        success: false,
        requires_action: true,
        provider: 'braintree',
        merchant_id: braintreeSettings.braintree_merchant_id,
        public_key: braintreeSettings.braintree_public_key,
        environment: braintreeSettings.braintree_environment,
        amount: paymentIntent.amount,
        message: 'Use Braintree Drop-in UI on frontend to complete payment',
        // In production, generate a client token here using Braintree SDK
        client_token_endpoint: '/api/v2/commerce/payment/braintree-token',
      };

    } catch (error) {
      console.error('Braintree payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Braintree payment failed',
      };
    }
  }

  // Helper method to capture PayPal payment after approval
  async capturePayPalPayment(orderId: string) {
    if (!this.settingsService) {
      throw new Error('Settings service not initialized');
    }
    const settings = await this.settingsService.getAllSettings();
    const paypalSettings = settings.payments;
    
    if (!paypalSettings?.paypal_enabled || !paypalSettings?.paypal_client_id || !paypalSettings?.paypal_client_secret) {
      throw new Error('PayPal payment processing is not configured');
    }

    try {
      // Get PayPal access token
      const authString = Buffer.from(`${paypalSettings.paypal_client_id}:${paypalSettings.paypal_client_secret}`).toString('base64');
      const paypalApiUrl = paypalSettings.paypal_environment === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';
      
      // Get access token
      const tokenResponse = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with PayPal');
      }

      const { access_token } = await tokenResponse.json();

      // Capture the payment
      const captureResponse = await fetch(`${paypalApiUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!captureResponse.ok) {
        const error = await captureResponse.json();
        throw new Error(error.message || 'Failed to capture PayPal payment');
      }

      const captureData = await captureResponse.json();
      const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

      if (capture?.status === 'COMPLETED') {
        return {
          success: true,
          provider_response: {
            id: capture.id,
            status: capture.status,
            amount: parseFloat(capture.amount.value),
            currency: capture.amount.currency_code,
            paypal_order_id: orderId,
          },
        };
      }

      return {
        success: false,
        error: 'Payment capture failed',
        status: capture?.status,
      };

    } catch (error) {
      console.error('PayPal capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPal capture failed',
      };
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number, reason?: string) {
    if (!this.stripe) {
      throw new Error('Payment processing is not configured');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if partial refund
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
      });

      return {
        success: true,
        refund_id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      
      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          error: error.message,
        };
      }

      throw error;
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    if (!this.stripe) {
      throw new Error('Payment processing is not configured');
    }

    try {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: intent.id,
        amount: intent.amount / 100,
        currency: intent.currency,
        status: intent.status,
        created: new Date(intent.created * 1000),
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  }
}