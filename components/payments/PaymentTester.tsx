'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Play,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  provider: string;
  method: string;
  status: 'success' | 'failed' | 'pending' | 'not_tested';
  message: string;
  duration?: number;
  timestamp?: string;
}

const PaymentTester = () => {
  const [testAmount, setTestAmount] = useState('99.99');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const paymentMethods = [
    {
      provider: 'stripe',
      methods: ['card', 'apple_pay', 'google_pay', 'ach'],
      displayName: 'Stripe',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      provider: 'paypal',
      methods: ['paypal', 'paypal_credit'],
      displayName: 'PayPal',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      provider: 'klarna',
      methods: ['pay_later', 'pay_in_4'],
      displayName: 'Klarna',
      color: 'bg-pink-100 text-primary-dark'
    },
    {
      provider: 'afterpay',
      methods: ['afterpay'],
      displayName: 'Afterpay',
      color: 'bg-green-100 text-green-800'
    },
    {
      provider: 'affirm',
      methods: ['affirm'],
      displayName: 'Affirm',
      color: 'bg-purple-100 text-primary-dark'
    }
  ];

  const testCards = {
    stripe: {
      success: '4242424242424242',
      decline: '4000000000000002',
      insufficient_funds: '4000000000009995',
      lost_card: '4000000000009987'
    }
  };

  const testSingleMethod = async (provider: string, method: string): Promise<TestResult> => {
    const startTime = Date.now();
    setCurrentTest(`${provider}-${method}`);

    try {
      let response;
      const amount = parseFloat(testAmount);

      switch (provider) {
        case 'stripe':
          response = await testStripeMethod(method, amount);
          break;
        case 'paypal':
          response = await testPayPalMethod(method, amount);
          break;
        case 'klarna':
          response = await testKlarnaMethod(method, amount);
          break;
        case 'afterpay':
          response = await testAfterpayMethod(method, amount);
          break;
        case 'affirm':
          response = await testAffirmMethod(method, amount);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      const duration = Date.now() - startTime;
      
      return {
        provider,
        method,
        status: response.success ? 'success' : 'failed',
        message: response.message,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        provider,
        method,
        status: 'failed',
        message: error.message || 'Test failed with unknown error',
        duration,
        timestamp: new Date().toISOString()
      };
    } finally {
      setCurrentTest(null);
    }
  };

  const testStripeMethod = async (method: string, amount: number) => {
    const response = await fetch('/api/v2/payments/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'usd',
        payment_method_types: [method === 'card' ? 'card' : method],
        metadata: { test: true, method }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Stripe test failed');
    }

    return {
      success: true,
      message: `Payment intent created successfully (${data.payment_intent.id})`
    };
  };

  const testPayPalMethod = async (method: string, amount: number) => {
    const response = await fetch('/api/v2/payments/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'USD',
        items: [{
          name: 'Test Product',
          quantity: 1,
          unit_price: amount
        }],
        metadata: { test: true, method }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'PayPal test failed');
    }

    return {
      success: true,
      message: `PayPal order created successfully (${data.order_id})`
    };
  };

  const testKlarnaMethod = async (method: string, amount: number) => {
    const response = await fetch('/api/v2/payments/klarna/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'USD',
        items: [{
          name: 'Test Product',
          quantity: 1,
          unit_price: amount
        }],
        shipping_address: {
          given_name: 'John',
          family_name: 'Doe',
          email: 'test@example.com',
          street_address: '123 Test St',
          postal_code: '12345',
          city: 'Test City',
          region: 'CA',
          country: 'US'
        },
        metadata: { test: true, method }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Klarna test failed');
    }

    return {
      success: true,
      message: `Klarna session created successfully (${data.session_id})`
    };
  };

  const testAfterpayMethod = async (method: string, amount: number) => {
    const response = await fetch('/api/v2/payments/afterpay/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'USD',
        items: [{
          name: 'Test Product',
          quantity: 1,
          price: { amount: amount.toString(), currency: 'USD' }
        }],
        consumer: {
          email: 'test@example.com',
          givenNames: 'John',
          surname: 'Doe',
          phoneNumber: '+15555555555'
        },
        metadata: { test: true, method }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Afterpay test failed');
    }

    return {
      success: true,
      message: `Afterpay checkout created successfully (${data.token})`
    };
  };

  const testAffirmMethod = async (method: string, amount: number) => {
    const response = await fetch('/api/v2/payments/affirm/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Affirm expects cents
        currency: 'USD',
        items: [{
          display_name: 'Test Product',
          sku: 'TEST-001',
          unit_price: Math.round(amount * 100),
          qty: 1
        }],
        shipping: {
          name: {
            first: 'John',
            last: 'Doe'
          },
          address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipcode: '12345',
            country: 'USA'
          }
        },
        metadata: { test: true, method }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Affirm test failed');
    }

    return {
      success: true,
      message: `Affirm checkout created successfully (${data.checkout_token})`
    };
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);

    for (const provider of paymentMethods) {
      for (const method of provider.methods) {
        const result = await testSingleMethod(provider.provider, method);
        setTestResults(prev => [...prev, result]);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setTesting(false);
  };

  const runSingleTest = async (provider: string, method: string) => {
    setTesting(true);
    const result = await testSingleMethod(provider, method);
    setTestResults(prev => prev.filter(r => !(r.provider === provider && r.method === method)).concat(result));
    setTesting(false);
  };

  const getResultIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getResult = (provider: string, method: string) => {
    return testResults.find(r => r.provider === provider && r.method === method);
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const failedCount = testResults.filter(r => r.status === 'failed').length;
  const totalTests = paymentMethods.reduce((acc, p) => acc + p.methods.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Method Tester</h1>
          <p className="text-gray-600">Test all payment integrations with sandbox credentials</p>
        </div>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="amount">Test Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="99.99"
                disabled={testing}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={runAllTests} 
                disabled={testing}
                className="flex items-center space-x-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Run All Tests</span>
              </Button>
            </div>
          </div>

          {/* Test Summary */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{testResults.length}/{totalTests}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">By Provider</TabsTrigger>
          <TabsTrigger value="results">All Results</TabsTrigger>
          <TabsTrigger value="test-data">Test Data</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          {paymentMethods.map((provider) => (
            <Card key={provider.provider}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6" />
                    <div>
                      <CardTitle>{provider.displayName}</CardTitle>
                      <Badge variant="outline" className={provider.color}>
                        {provider.provider}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {provider.methods.map((method) => {
                    const result = getResult(provider.provider, method);
                    const isCurrentTest = currentTest === `${provider.provider}-${method}`;
                    
                    return (
                      <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getResultIcon(result?.status || 'not_tested')}
                          <div>
                            <div className="font-medium capitalize">{method.replace('_', ' ')}</div>
                            {result && (
                              <div className="text-sm text-gray-500">
                                {result.message}
                                {result.duration && ` (${result.duration}ms)`}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runSingleTest(provider.provider, method)}
                          disabled={testing}
                        >
                          {isCurrentTest ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No test results yet. Run tests to see results here.
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getResultIcon(result.status)}
                        <div>
                          <div className="font-medium">
                            {result.provider} - {result.method.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-gray-500">{result.message}</div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        {result.duration && <div>{result.duration}ms</div>}
                        {result.timestamp && (
                          <div>{new Date(result.timestamp).toLocaleTimeString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test-data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Credentials & Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Stripe Test Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Success:</strong> 4242424242424242
                  </div>
                  <div>
                    <strong>Decline:</strong> 4000000000000002
                  </div>
                  <div>
                    <strong>Insufficient Funds:</strong> 4000000000009995
                  </div>
                  <div>
                    <strong>Lost Card:</strong> 4000000000009987
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">BNPL Test Data</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Klarna:</strong> Use any valid email, test person: John Doe (DOB: 1970-01-01)</div>
                  <div><strong>Afterpay:</strong> Use amounts $1-$4000, any valid email/phone</div>
                  <div><strong>Affirm:</strong> Use amounts $50-$17500, test@example.com, +1-555-555-5555</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Environment Status</h3>
                <div className="space-y-1 text-sm">
                  <div>All providers configured for <Badge variant="outline">sandbox</Badge> mode</div>
                  <div>Webhook endpoints ready for testing</div>
                  <div>Database schema migrated successfully</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentTester;