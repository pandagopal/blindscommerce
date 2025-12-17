'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, DollarSign, Info } from 'lucide-react';

interface BNPLPaymentProps {
  provider: 'klarna' | 'afterpay' | 'affirm';
  amount: number;
  currency?: string;
  items?: Array<{
    name: string;
    unit_price: number;
    quantity: number;
    sku?: string;
    slug?: string;
    image_url?: string;
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
  billingAddress?: {
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

const BNPLPayment = ({
  provider,
  amount,
  currency = 'USD',
  items = [],
  shippingAddress,
  billingAddress,
  onSuccess,
  onError,
  onCancel
}: BNPLPaymentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [installmentInfo, setInstallmentInfo] = useState<any>(null);

  useEffect(() => {
    calculateInstallments();
  }, [provider, amount]);

  const calculateInstallments = () => {
    let info = null;
    
    switch (provider) {
      case 'klarna':
        info = {
          installments: 4,
          frequency: 'Every 2 weeks',
          installment_amount: amount / 4,
          total_amount: amount,
          interest_rate: 0,
          fees: 'No interest, no fees if paid on time'
        };
        break;
      
      case 'afterpay':
        info = {
          installments: 4,
          frequency: 'Every 2 weeks',
          installment_amount: amount / 4,
          total_amount: amount,
          interest_rate: 0,
          fees: 'Always interest-free'
        };
        break;
      
      case 'affirm':
        // Affirm offers various payment plans
        info = {
          installments: [3, 6, 12],
          frequency: 'Monthly',
          options: [
            {
              months: 3,
              installment_amount: amount / 3,
              interest_rate: 0,
              total_amount: amount
            },
            {
              months: 6,
              installment_amount: amount / 6,
              interest_rate: 10,
              total_amount: amount * 1.1
            },
            {
              months: 12,
              installment_amount: amount / 12,
              interest_rate: 15,
              total_amount: amount * 1.15
            }
          ]
        };
        break;
    }
    
    setInstallmentInfo(info);
  };

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let endpoint = '';
      
      switch (provider) {
        case 'klarna':
          endpoint = '/api/payments/klarna/create-session';
          break;
        case 'afterpay':
          endpoint = '/api/payments/afterpay/create-checkout';
          break;
        case 'affirm':
          endpoint = '/api/payments/affirm/create-checkout';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          items,
          shipping_address: shippingAddress,
          billing_address: billingAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create ${provider} checkout`);
      }

      const data = await response.json();
      setCheckoutSession(data);

      // Handle provider-specific redirects
      if (provider === 'klarna' && data.html_snippet) {
        // For Klarna, embed the HTML snippet
        handleKlarnaCheckout(data);
      } else if ((provider === 'afterpay' || provider === 'affirm') && data.redirect_url) {
        // For Afterpay/Affirm, redirect to their checkout
        window.location.href = data.redirect_url || data.redirect_checkout_url;
      }

    } catch (error) {
      console.error(`${provider} payment error:`, error);
      setError(error instanceof Error ? error.message : `Failed to process ${provider} payment`);
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKlarnaCheckout = (sessionData: any) => {
    // For Klarna, we would typically embed their HTML snippet
    // This is a simplified version - in production, you'd use Klarna's SDK
    if (sessionData.checkout_url) {
      window.location.href = sessionData.checkout_url;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getProviderInfo = () => {
    switch (provider) {
      case 'klarna':
        return {
          name: 'Klarna',
          logo: '/images/klarna-logo.png',
          description: 'Shop now, pay later with Klarna',
          color: 'bg-pink-100 text-primary-dark'
        };
      case 'afterpay':
        return {
          name: 'Afterpay',
          logo: '/images/afterpay-logo.png',
          description: 'Buy now, pay in 4 installments',
          color: 'bg-green-100 text-green-800'
        };
      case 'affirm':
        return {
          name: 'Affirm',
          logo: '/images/affirm-logo.png',
          description: 'Pay over time with flexible monthly payments',
          color: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <img 
            src={providerInfo.logo} 
            alt={providerInfo.name} 
            className="h-8"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span>{providerInfo.name}</span>
          <Badge variant="outline" className={providerInfo.color}>
            0% Interest
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-sm text-gray-600">
          {providerInfo.description}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Installment breakdown */}
        {installmentInfo && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">Payment Schedule</span>
            </div>

            {provider === 'affirm' && installmentInfo.options ? (
              <div className="space-y-3">
                {installmentInfo.options.map((option: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">
                        {option.months} monthly payments of {formatCurrency(option.installment_amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.interest_rate}% APR
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(option.total_amount)}</div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment plan:</span>
                  <span className="font-medium">
                    {installmentInfo.installments} payments of {formatCurrency(installmentInfo.installment_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span>{installmentInfo.frequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total amount:</span>
                  <span className="font-medium">{formatCurrency(installmentInfo.total_amount)}</span>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-gray-600">
                  {installmentInfo.fees}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment button */}
        <div className="space-y-3">
          <Button 
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Continue with {providerInfo.name}
              </>
            )}
          </Button>

          {onCancel && (
            <Button 
              onClick={onCancel}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Provider benefits */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>• No impact to your credit score</div>
          <div>• Simple approval process</div>
          <div>• Secure and encrypted</div>
          {provider === 'klarna' && <div>• Shopping protection included</div>}
          {provider === 'afterpay' && <div>• No interest, ever</div>}
          {provider === 'affirm' && <div>• See exactly what you'll pay upfront</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default BNPLPayment;