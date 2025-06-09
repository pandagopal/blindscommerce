'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  DollarSign,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';

interface PaymentAnalytics {
  date: string;
  payment_method: string;
  provider: string;
  total_transactions: number;
  total_amount: number;
  successful_transactions: number;
  failed_transactions: number;
  conversion_rate: number;
}

interface PaymentMethod {
  id: string;
  provider: string;
  method_id: string;
  display_name: string;
  is_active: boolean;
  total_transactions: number;
  success_rate: number;
}

const PaymentDashboard = () => {
  const [analytics, setAnalytics] = useState<PaymentAnalytics[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    fetchPaymentData();
  }, [selectedTimeframe]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment analytics
      const analyticsResponse = await fetch(`/api/admin/payments/analytics?timeframe=${selectedTimeframe}`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.analytics || []);
      }

      // Fetch payment methods
      const methodsResponse = await fetch('/api/admin/payments/methods');
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json();
        setPaymentMethods(methodsData.payment_methods || []);
      }

    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalMetrics = () => {
    return analytics.reduce((acc, item) => ({
      totalTransactions: acc.totalTransactions + item.total_transactions,
      totalAmount: acc.totalAmount + item.total_amount,
      successfulTransactions: acc.successfulTransactions + item.successful_transactions,
      failedTransactions: acc.failedTransactions + item.failed_transactions
    }), {
      totalTransactions: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      failedTransactions: 0
    });
  };

  const metrics = getTotalMetrics();
  const successRate = metrics.totalTransactions > 0 
    ? (metrics.successfulTransactions / metrics.totalTransactions * 100).toFixed(1)
    : '0';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      stripe: 'bg-blue-100 text-blue-800',
      paypal: 'bg-yellow-100 text-yellow-800',
      klarna: 'bg-pink-100 text-pink-800',
      afterpay: 'bg-green-100 text-green-800',
      affirm: 'bg-purple-100 text-purple-800'
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="w-full h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-600">Monitor payment performance and analytics</p>
        </div>
        
        <div className="flex space-x-3">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button onClick={fetchPaymentData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{metrics.totalTransactions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed Payments</p>
                <p className="text-2xl font-bold">{metrics.failedTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="methods" className="space-y-6">
        <TabsList>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="analytics">Daily Analytics</TabsTrigger>
          <TabsTrigger value="disputes">Disputes & Refunds</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{method.display_name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getProviderColor(method.provider)}>
                            {method.provider}
                          </Badge>
                          <Badge variant={method.is_active ? "default" : "secondary"}>
                            {method.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {method.total_transactions || 0} transactions
                      </div>
                      <div className="text-sm text-gray-500">
                        {((method.success_rate || 0) * 100).toFixed(1)}% success rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Transaction Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No analytics data available for the selected timeframe
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Method</th>
                          <th className="text-left p-2">Provider</th>
                          <th className="text-right p-2">Transactions</th>
                          <th className="text-right p-2">Amount</th>
                          <th className="text-right p-2">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">{item.date}</td>
                            <td className="p-2 capitalize">{item.payment_method}</td>
                            <td className="p-2">
                              <Badge variant="outline" className={getProviderColor(item.provider)}>
                                {item.provider}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">{item.total_transactions}</td>
                            <td className="p-2 text-right">{formatCurrency(item.total_amount)}</td>
                            <td className="p-2 text-right">
                              {((item.conversion_rate || 0) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Disputes & Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No recent disputes or refunds
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentDashboard;