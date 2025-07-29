'use client';

import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { loadStripe, Stripe, PaymentRequest, PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

export interface StripePaymentRequestHandle {
  triggerPayment: () => Promise<void>;
}

interface StripePaymentRequestProps {
  amount: number;
  currency: string;
  country: string;
  publishableKey: string;
  onPaymentMethod: (paymentMethod: any) => Promise<void>;
  onError: (error: string) => void;
  selectedMethod: string;
  billingDetails: {
    email: string;
    name: string;
    phone?: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

const StripePaymentRequest = forwardRef<StripePaymentRequestHandle, StripePaymentRequestProps>(({
  amount,
  currency,
  country,
  publishableKey,
  onPaymentMethod,
  onError,
  selectedMethod,
  billingDetails,
}, ref) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Initialize Stripe
  useEffect(() => {
    if (!publishableKey) return;

    const initializeStripe = async () => {
      try {
        const stripeInstance = await loadStripe(publishableKey);
        setStripe(stripeInstance);
      } catch (err) {
        console.error('Failed to initialize Stripe:', err);
        setError('Failed to initialize payment system');
      }
    };

    initializeStripe();
  }, [publishableKey]);

  // Create Payment Request
  useEffect(() => {
    if (!stripe || !amount) return;

    const pr = stripe.paymentRequest({
      country: country || 'US',
      currency: currency.toLowerCase(),
      total: {
        label: 'Total',
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
      requestShipping: false, // We already have shipping info
    });

    // Check if the Payment Request is available (Apple Pay or Google Pay)
    pr.canMakePayment().then((result) => {
      console.log('Payment Request canMakePayment result:', result);
      
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
        
        // Log which payment methods are available
        if (result.applePay) {
          console.log('Apple Pay is available');
        }
        if (result.googlePay) {
          console.log('Google Pay is available');
        }
      } else {
        setCanMakePayment(false);
        console.log('Payment Request not available. Possible reasons:');
        console.log('- No saved payment methods in browser');
        console.log('- Not on HTTPS (except localhost)');
        console.log('- Browser doesn\'t support Payment Request API');
        console.log('- User has disabled payment methods');
      }
    }).catch((error) => {
      console.error('Error checking payment availability:', error);
      setCanMakePayment(false);
    });

    // Handle payment method creation
    pr.on('paymentmethod', async (event: PaymentRequestPaymentMethodEvent) => {
      setIsProcessing(true);
      setError('');

      try {
        // Pass the payment method to the parent component
        await onPaymentMethod({
          paymentMethod: event.paymentMethod,
          billingDetails: {
            ...billingDetails,
            email: event.payerEmail || billingDetails.email,
            name: event.payerName || billingDetails.name,
            phone: event.payerPhone || billingDetails.phone,
          },
        });

        // Complete the payment in the UI
        event.complete('success');
      } catch (err) {
        // Show error in the payment sheet
        event.complete('fail');
        setError(err instanceof Error ? err.message : 'Payment failed');
        onError(err instanceof Error ? err.message : 'Payment failed');
      } finally {
        setIsProcessing(false);
      }
    });

    return () => {
      // Cleanup
      pr.abort();
    };
  }, [stripe, amount, currency, country, billingDetails, onPaymentMethod, onError]);

  // Handle payment request button click
  const handlePaymentRequest = useCallback(async () => {
    if (!paymentRequest) return;

    try {
      // This will show the Apple Pay or Google Pay sheet
      await paymentRequest.show();
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        onError(err.message);
      }
    }
  }, [paymentRequest, onError]);

  // Remove auto-trigger - let the user click Pay Now button instead
  // This provides better UX as users expect to click a button to pay
  
  // Expose trigger method to parent component
  useImperativeHandle(ref, () => ({
    triggerPayment: handlePaymentRequest
  }), [handlePaymentRequest]);

  // Don't render anything if payment request is not available
  if (!canMakePayment || (selectedMethod !== 'google_pay' && selectedMethod !== 'apple_pay')) {
    if (selectedMethod === 'google_pay' || selectedMethod === 'apple_pay') {
      return (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-700">
            {selectedMethod === 'google_pay' ? (
              <>Google Pay is not available on this device/browser. Please ensure you have a saved payment method in your Google account and are using a supported browser (Chrome, Edge, or Safari).</>
            ) : (
              <>Apple Pay is not available on this device/browser. Apple Pay requires Safari on an Apple device (Mac, iPhone, or iPad).</>
            )}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {isProcessing ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-gray-600">Processing payment...</span>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Click the button below to complete your payment with {selectedMethod === 'google_pay' ? 'Google Pay' : 'Apple Pay'}
          </p>
          <button
            type="button"
            onClick={handlePaymentRequest}
            className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {selectedMethod === 'google_pay' ? (
              <>
                <img src="/images/payment/google-pay.svg" alt="Google Pay" className="h-5 mr-2 invert" />
                Pay with Google Pay
              </>
            ) : (
              <>
                <img src="/images/payment/apple-pay.svg" alt="Apple Pay" className="h-5 mr-2 invert" />
                Pay with Apple Pay
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Your payment details will be processed securely by {selectedMethod === 'google_pay' ? 'Google' : 'Apple'}
          </p>
        </div>
      )}
    </div>
  );
});

StripePaymentRequest.displayName = 'StripePaymentRequest';

export default StripePaymentRequest;