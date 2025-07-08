'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Check, X, Settings, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentMethod {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  enabled: boolean;
  testMode: boolean;
  credentials: {
    configured: boolean;
    fields: string[];
  };
  supportedCurrencies: string[];
  transactionFees: {
    percentage: number;
    fixed: number;
  };
}

const paymentProviders: PaymentMethod[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    displayName: 'Credit/Debit Cards (Stripe)',
    icon: '💳',
    enabled: false,
    testMode: true,
    credentials: {
      configured: false,
      fields: ['Secret Key', 'Publishable Key', 'Webhook Secret'],
    },
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    transactionFees: { percentage: 2.9, fixed: 0.30 },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    displayName: 'PayPal / Braintree',
    icon: '🅿️',
    enabled: false,
    testMode: true,
    credentials: {
      configured: false,
      fields: ['Client ID', 'Client Secret'],
    },
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    transactionFees: { percentage: 2.9, fixed: 0.30 },
  },
  {
    id: 'klarna',
    name: 'Klarna',
    displayName: 'Klarna (Buy Now, Pay Later)',
    icon: '🇰',
    enabled: false,
    testMode: true,
    credentials: {
      configured: false,
      fields: ['Username', 'Password', 'API URL'],
    },
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    transactionFees: { percentage: 3.29, fixed: 0.30 },
  },
  {
    id: 'afterpay',
    name: 'Afterpay',
    displayName: 'Afterpay / Clearpay',
    icon: '💰',
    enabled: false,
    testMode: true,
    credentials: {
      configured: false,
      fields: ['Merchant ID', 'Secret Key'],
    },
    supportedCurrencies: ['USD', 'AUD', 'NZD', 'GBP'],
    transactionFees: { percentage: 4.0, fixed: 0.30 },
  },
  {
    id: 'affirm',
    name: 'Affirm',
    displayName: 'Affirm (Monthly Payments)',
    icon: '📅',
    enabled: false,
    testMode: true,
    credentials: {
      configured: false,
      fields: ['Public API Key', 'Private API Key'],
    },
    supportedCurrencies: ['USD'],
    transactionFees: { percentage: 5.0, fixed: 0 },
  },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>(paymentProviders);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const settings = data.data?.settings || {};
        
        // Update payment methods with actual settings
        setMethods(methods.map(method => ({
          ...method,
          enabled: settings.payments?.[`${method.id}_enabled`] || false,
          credentials: {
            ...method.credentials,
            configured: !!settings.payments?.[`${method.id}_secret_key`] || 
                        !!settings.payments?.[`${method.id}_client_id`] ||
                        !!settings.payments?.[`${method.id}_api_key`],
          }
        })));
      }
    } catch (err) {
      console.error('Failed to load payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMethod = async (methodId: string) => {
    const method = methods.find(m => m.id === methodId);
    if (!method) return;

    if (!method.credentials.configured) {
      alert('Please configure credentials before enabling this payment method');
      return;
    }

    setSaving(true);
    try {
      const updatedMethods = methods.map(m =>
        m.id === methodId ? { ...m, enabled: !m.enabled } : m
      );
      setMethods(updatedMethods);

      // Save to backend
      const response = await fetch('/api/v2/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'payments',
          settings: {
            [`${methodId}_enabled`]: !method.enabled,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
    } catch (err) {
      console.error('Failed to toggle payment method:', err);
      // Revert on error
      fetchPaymentSettings();
    } finally {
      setSaving(false);
    }
  };

  const formatFee = (method: PaymentMethod) => {
    const { percentage, fixed } = method.transactionFees;
    let fee = `${percentage}%`;
    if (fixed > 0) {
      fee += ` + $${fixed.toFixed(2)}`;
    }
    return fee;
  };

  if (loading) return <div>Loading payment methods...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <p className="text-gray-600 mt-2">
          Configure payment providers and processing options
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Payment credentials are encrypted using AES-256-GCM encryption. Never share your
          secret keys or store them in plain text.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{method.displayName}</CardTitle>
                    <CardDescription>
                      Transaction fee: {formatFee(method)} • 
                      Supports: {method.supportedCurrencies.join(', ')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {method.credentials.configured ? (
                    <Badge variant="success">
                      <Check className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                  {method.testMode && (
                    <Badge variant="outline">Test Mode</Badge>
                  )}
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => handleToggleMethod(method.id)}
                    disabled={saving || !method.credentials.configured}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMethod(method)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Configure {method.displayName}</DialogTitle>
                      <DialogDescription>
                        Enter your {method.name} API credentials. These will be encrypted before storage.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertDescription>
                          Get your API credentials from your {method.name} dashboard.
                          {method.testMode && ' Currently in test mode - use test credentials only.'}
                        </AlertDescription>
                      </Alert>
                      
                      {method.credentials.fields.map((field) => (
                        <div key={field} className="space-y-2">
                          <Label>{field}</Label>
                          <Input
                            type="password"
                            placeholder={`Enter your ${field.toLowerCase()}`}
                          />
                        </div>
                      ))}

                      <div className="flex items-center space-x-2">
                        <Switch id="test-mode" defaultChecked={method.testMode} />
                        <Label htmlFor="test-mode">Test Mode</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>Save Configuration</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {method.id === 'stripe' && (
                  <Button variant="outline" size="sm">
                    View Webhook Setup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Processing Settings</CardTitle>
          <CardDescription>
            Global settings that apply to all payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Order Amount</Label>
              <div className="flex items-center space-x-2">
                <span>$</span>
                <Input type="number" defaultValue="25.00" step="0.01" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Processing Fee (%)</Label>
              <Input type="number" defaultValue="2.9" step="0.1" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Vendor Commission Rate (%)</Label>
            <Input type="number" defaultValue="15.0" step="0.1" />
            <p className="text-sm text-gray-500">
              Platform commission charged to vendors on each sale
            </p>
          </div>

          <Button className="w-full sm:w-auto">Save Processing Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}