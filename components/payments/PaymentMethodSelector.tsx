'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Smartphone, Building, Clock, DollarSign, Star, Zap } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'digital_wallet' | 'bnpl' | 'bank_transfer';
  provider: string;
  description: string;
  icon: string;
  min_amount: number;
  max_amount: number;
  currencies: string[];
  countries: string[];
  processing_time: string;
  fee_structure?: string;
  fees?: {
    percentage?: number;
    fixed?: number;
  };
  installments?: number | number[];
  installment_frequency?: string;
  interest_rate?: number | number[];
  available: boolean;
  recommended?: boolean;
  popular?: boolean;
  estimated_fee: number;
  estimated_total: number;
}

interface PaymentMethodSelectorProps {
  amount: number;
  currency?: string;
  country?: string;
  onMethodSelect: (method: PaymentMethod) => void;
  selectedMethod?: string;
}

const PaymentMethodSelector = ({
  amount,
  currency = 'USD',
  country = 'US',
  onMethodSelect,
  selectedMethod
}: PaymentMethodSelectorProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, [amount, currency, country]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/payments/methods?amount=${amount}&currency=${currency}&country=${country}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.payment_methods || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (iconName: string, type: string) => {
    switch (iconName) {
      case 'credit-card':
        return <CreditCard className="w-6 h-6" />;
      case 'apple':
      case 'google':
      case 'paypal':
        return <Smartphone className="w-6 h-6" />;
      case 'bank':
        return <Building className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getPaymentBadges = (method: PaymentMethod) => {
    const badges = [];
    
    if (method.recommended) {
      badges.push(
        <Badge key="recommended" variant="default" className="bg-blue-100 text-blue-800">
          <Star className="w-3 h-3 mr-1" />
          Recommended
        </Badge>
      );
    }
    
    if (method.popular) {
      badges.push(
        <Badge key="popular" variant="secondary" className="bg-green-100 text-green-800">
          Popular
        </Badge>
      );
    }
    
    if (method.processing_time === 'instant') {
      badges.push(
        <Badge key="instant" variant="outline" className="border-orange-200 text-orange-700">
          <Zap className="w-3 h-3 mr-1" />
          Instant
        </Badge>
      );
    }
    
    if (method.type === 'bnpl' && method.interest_rate === 0) {
      badges.push(
        <Badge key="interest-free" variant="outline" className="border-purple-200 text-purple-700">
          0% Interest
        </Badge>
      );
    }

    return badges;
  };

  const getInstallmentInfo = (method: PaymentMethod) => {
    if (method.type !== 'bnpl') return null;

    const installmentAmount = amount / (method.installments as number);
    
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
        <div className="font-medium text-gray-700">
          {method.installments} payments of {formatCurrency(installmentAmount)}
        </div>
        <div className="text-gray-500">
          Every {method.installment_frequency === 'bi_weekly' ? '2 weeks' : 'month'}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-48 h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 font-medium mb-2">Error Loading Payment Methods</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <Button onClick={fetchPaymentMethods} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group payment methods by type
  const groupedMethods = paymentMethods.reduce((groups, method) => {
    const key = method.type;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(method);
    return groups;
  }, {} as Record<string, PaymentMethod[]>);

  const typeLabels = {
    card: 'Cards & Digital Wallets',
    digital_wallet: 'Digital Wallets',
    bnpl: 'Buy Now, Pay Later',
    bank_transfer: 'Bank Transfers'
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold text-gray-900">
        Choose Payment Method
      </div>

      {Object.entries(groupedMethods).map(([type, methods]) => (
        <div key={type}>
          <h3 className="text-md font-medium text-gray-700 mb-3">
            {typeLabels[type as keyof typeof typeLabels] || type}
          </h3>
          
          <div className="space-y-3">
            {methods.map((method) => (
              <Card 
                key={method.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedMethod === method.id 
                    ? 'ring-2 ring-blue-500 border-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onMethodSelect(method)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getMethodIcon(method.icon, method.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{method.name}</h4>
                          {getPaymentBadges(method)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {method.description}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {method.processing_time}
                          </div>
                          
                          {method.estimated_fee > 0 && (
                            <div className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              Fee: {formatCurrency(method.estimated_fee)}
                            </div>
                          )}
                        </div>

                        {getInstallmentInfo(method)}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(method.estimated_total)}
                      </div>
                      {method.estimated_fee > 0 && (
                        <div className="text-xs text-gray-500">
                          +{formatCurrency(method.estimated_fee)} fee
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {paymentMethods.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <div className="text-yellow-800 font-medium mb-2">
              No Payment Methods Available
            </div>
            <div className="text-yellow-700 text-sm">
              No payment methods are available for this amount and location.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentMethodSelector;