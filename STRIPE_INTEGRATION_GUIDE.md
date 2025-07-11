# Stripe Integration Guide for Production

## Current State
The payment system is currently configured to work in **test mode** using Stripe's test tokens. This allows you to test the full checkout flow without real card details.

## What You Need for Production

### 1. Frontend Integration with Stripe Elements

You'll need to integrate Stripe Elements in your checkout form. Here's what needs to be done:

#### Install Stripe.js
```bash
npm install @stripe/stripe-js
```

#### Update Checkout Page
In `/app/checkout/page.tsx`, you'll need to:

1. Load Stripe.js
2. Create Stripe Elements for card input
3. Create a payment method on the frontend
4. Send only the payment method ID to the backend

Example implementation:
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// In your payment form component:
const stripe = useStripe();
const elements = useElements();

const handlePayment = async () => {
  // Create payment method
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: elements.getElement(CardElement),
    billing_details: {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      address: {
        line1: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.zipCode,
        country: 'US',
      },
    },
  });

  if (!error) {
    // Send paymentMethod.id to your backend
    const paymentRequest = {
      payment_method_id: paymentMethod.id, // This is what the backend expects
      amount: total,
      // ... other payment details
    };
  }
};
```

### 2. Environment Variables

Add to your `.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Your live publishable key
```

### 3. Update Payment Request

The payment request should include the payment method ID from Stripe Elements:
```typescript
const paymentRequest = {
  payment_method_id: paymentMethod.id,  // From Stripe Elements
  amount: pricing.total,
  currency: 'USD',
  payment_data: {}, // No card details needed
  billing_address: {
    // ... billing details
  },
  // ... other fields
};
```

### 4. Security Considerations

- **Never send raw card details** to your backend
- Always use Stripe Elements or Payment Element
- The backend only needs the payment method ID
- Stripe handles all PCI compliance

### 5. Testing the Integration

1. Keep test mode enabled in Admin Settings
2. Implement Stripe Elements
3. Test with Stripe test cards
4. When ready, switch to live mode in Admin Settings
5. Update your Stripe publishable key to the live version

### 6. 3D Secure Support

The current implementation already handles 3D Secure. When a payment requires authentication:
- The backend returns `requires_action: true`
- The frontend should use `stripe.confirmCardPayment()` with the client secret
- After confirmation, complete the order

## Current Test Mode Behavior

In test mode, the system:
- Automatically uses Stripe's test card token (`tok_visa`)
- Processes payments successfully without real card input
- Allows testing the full order flow

## Support for Other Payment Methods

The system already supports:
- PayPal (redirect flow implemented)
- Klarna (requires frontend SDK)
- Affirm (requires frontend SDK)
- Afterpay (requires frontend SDK)
- Braintree (requires Drop-in UI)

Each payment method has its own integration requirements documented in the respective provider's documentation.