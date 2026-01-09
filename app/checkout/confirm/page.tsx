'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CheckoutConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Get PayPal token from URL
        const token = searchParams.get('token');
        const payerId = searchParams.get('PayerID');
        
        if (!token) {
          throw new Error('Payment token not found');
        }

        // Get stored order data
        const pendingOrderStr = localStorage.getItem('pending_order');
        if (!pendingOrderStr) {
          throw new Error('Order data not found');
        }

        const pendingOrder = JSON.parse(pendingOrderStr);
        
        // Capture PayPal payment
        const captureResponse = await fetch('/api/v2/commerce/payment/capture-paypal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: pendingOrder.paypal_order_id,
            payer_id: payerId,
          }),
        });

        const captureResult = await captureResponse.json();

        if (!captureResult.success) {
          throw new Error(captureResult.error || 'Payment capture failed');
        }

        // Create the order with the captured payment
        const orderData = {
          ...pendingOrder.order_data,
          payment: {
            method: 'paypal',
            transaction_id: captureResult.provider_response.id,
            paypal_order_id: captureResult.provider_response.paypal_order_id,
            status: 'completed'
          }
        };

        const isGuest = !document.cookie.includes('auth-token');
        const apiEndpoint = isGuest ? '/api/v2/commerce/orders/create-guest' : '/api/v2/commerce/orders/create';
        
        const orderResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to create order');
        }

        const data = await orderResponse.json();
        
        // Clear pending order data
        localStorage.removeItem('pending_order');
        
        // Clear cart
        try {
          await fetch('/api/v2/commerce/cart/clear', { method: 'POST' });
        } catch (e) {
          // Ignore cart clear errors
        }

        // Redirect to success page with order number
        router.push(`/checkout/success?order=${data.orderNumber}`);

      } catch (error) {
        console.error('Payment confirmation error:', error);
        setError(error instanceof Error ? error.message : 'Payment confirmation failed');
        setProcessing(false);
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmation Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/checkout')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Return to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming Your Payment</h1>
          <p className="text-gray-600">Please wait while we process your payment...</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <CheckoutConfirmContent />
    </Suspense>
  );
}