'use client';

import { useEffect, useRef, useState } from 'react';
import { loadScript } from '@paypal/paypal-js';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface PayPalPaymentProps {
  amount: number;
  currency?: string;
  items?: Array<{
    name: string;
    unit_price: number;
    quantity: number;
    sku?: string;
    description?: string;
  }>;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

const PayPalPayment = ({
  amount,
  currency = 'USD',
  items = [],
  shippingAddress,
  onSuccess,
  onError,
  onCancel
}: PayPalPaymentProps) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    initializePayPal();
  }, [amount, currency]);

  const initializePayPal = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load PayPal SDK
      const paypal = await loadScript({
        'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: currency,
        intent: 'capture',
        'data-client-token': await getClientToken()
      });

      if (!paypal || !paypal.Buttons) {
        throw new Error('PayPal SDK failed to load');
      }

      // Clear previous PayPal buttons
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }

      // Render PayPal buttons
      await paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 55
        },
        
        createOrder: async () => {
          try {
            const response = await fetch('/api/v2/payments/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount,
                currency,
                items,
                shipping_address: shippingAddress
              }),
            });

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.message || 'Failed to create PayPal order');
            }

            return result.data.order_id;
          } catch (error) {
            console.error('PayPal create order error:', error);
            setError(error instanceof Error ? error.message : 'Failed to create PayPal order');
            throw error;
          }
        },

        onApprove: async (data) => {
          try {
            const response = await fetch('/api/v2/payments/paypal/capture-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order_id: data.orderID,
                payment_method_nonce: data.paymentID
              }),
            });

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.message || 'Failed to capture PayPal payment');
            }

            onSuccess(result.data);
          } catch (error) {
            console.error('PayPal capture error:', error);
            onError(error);
          }
        },

        onCancel: (data) => {
          if (onCancel) {
            onCancel();
          }
        },

        onError: (err) => {
          console.error('PayPal payment error:', err);
          setError('PayPal payment failed. Please try again.');
          onError(err);
        }
      }).render(paypalRef.current!);

      setPaypalLoaded(true);
    } catch (error) {
      console.error('PayPal initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize PayPal');
    } finally {
      setIsLoading(false);
    }
  };

  const getClientToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/v2/payments/paypal/create-order', {
        method: 'GET'
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to get client token');
      }

      return result.data.client_token || '';
    } catch (error) {
      console.error('Failed to get PayPal client token:', error);
      return '';
    }
  };

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-lg font-semibold text-gray-900 flex items-center">
            <img 
              src="/images/paypal-logo.png" 
              alt="PayPal" 
              className="h-8 mr-3"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            PayPal Payment
          </div>

          <div className="text-sm text-gray-600">
            Pay securely with your PayPal account or credit card
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-gray-600">Loading PayPal...</span>
            </div>
          )}

          <div 
            ref={paypalRef}
            className={`${isLoading ? 'hidden' : 'block'} min-h-[60px]`}
          />

          {paypalLoaded && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Secure payment processing by PayPal</div>
              <div>• Pay with PayPal balance, bank account, or credit card</div>
              <div>• Buyer protection included</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PayPalPayment;