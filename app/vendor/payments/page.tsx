'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, CreditCard, Clock, CheckCircle, AlertCircle, 
  Download, Calendar, TrendingUp, Wallet, FileText
} from 'lucide-react';

interface PaymentData {
  overview: {
    total_earnings: number;
    pending_payments: number;
    paid_this_month: number;
    commission_rate: number;
    next_payout_date: string;
    last_payout_amount: number;
  };
  recent_payments: Payment[];
  payment_history: Payment[];
  commission_breakdown: CommissionItem[];
}

interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  date: string;
  payout_date?: string;
  method: string;
  reference: string;
  orders_count: number;
}

interface CommissionItem {
  id: string;
  order_id: string;
  customer_name: string;
  product_name: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  date: string;
  status: 'pending' | 'paid';
}

export default function VendorPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/vendor/payments');
        return;
      }
      if (user.role !== 'vendor' && user.role !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [user, authLoading, router]);

  // Lazy load payment data only when this route is active
  const fetchPaymentData = async () => {
    try {
      const res = await fetch(`/api/v2/vendors/financial-summary?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        console.error('Failed to fetch payment data:', res.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      return null;
    }
  };

  const { 
    data: fetchedData, 
    loading, 
    error, 
    refetch 
  } = useLazyLoad(fetchPaymentData, {
    targetPath: '/vendor/payments',
    dependencies: [dateRange]
  });

  useEffect(() => {
    if (fetchedData) {
      setPaymentData(fetchedData);
    }
  }, [fetchedData]);

  const exportData = async (type: string) => {
    try {
      const res = await fetch(`/api/v2/vendors/financial-summary/export?type=${type}&range=${dateRange}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendor-payments-${type}-${dateRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatCurrency = (amount: number | string | undefined) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'success',
      processing: 'secondary',
      pending: 'warning',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Payment Data</h2>
          <p className="text-gray-600 mb-4">Please check your connection and try again.</p>
          <Button onClick={() => refetch()} className="bg-purple-600 hover:bg-purple-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Payments & Earnings
            </h1>
            <p className="text-gray-600">Track your commissions and payment history</p>
          </div>
          
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => exportData('overview')}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentData?.overview?.total_earnings || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentData?.overview?.pending_payments || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Awaiting payout</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Paid This Month</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentData?.overview?.paid_this_month || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Current month</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Commission Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(Number(paymentData?.overview?.commission_rate) || 0).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Per sale</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Payout Info */}
        <Card className="border-purple-100 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Next Payout Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">Next Payout Date</div>
                <div className="text-xl font-bold text-blue-700">
                  {formatDate(paymentData?.overview?.next_payout_date || '')}
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 font-medium">Amount to be Paid</div>
                <div className="text-xl font-bold text-green-700">
                  {formatCurrency(paymentData?.overview?.pending_payments || 0)}
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600 font-medium">Last Payout</div>
                <div className="text-xl font-bold text-purple-700">
                  {formatCurrency(paymentData?.overview?.last_payout_amount || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-purple-100">
            <TabsTrigger value="overview">
              <Wallet className="h-4 w-4 mr-2" />
              Recent Payments
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <FileText className="h-4 w-4 mr-2" />
              Commission Breakdown
            </TabsTrigger>
            <TabsTrigger value="history">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentData?.recent_payments?.length > 0 ? (
                    paymentData.recent_payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{payment.reference}</h4>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Payment Date: {formatDate(payment.date)} • {payment.orders_count} orders
                          </div>
                          <div className="text-sm text-gray-600">
                            Method: {payment.method}
                          </div>
                          {payment.payout_date && (
                            <div className="text-sm text-green-600">
                              Paid: {formatDate(payment.payout_date)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{formatCurrency(payment.amount)}</div>
                          <div className="text-sm text-gray-600">Commission</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No payment records found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Commission Breakdown
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => exportData('commissions')}
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentData?.commission_breakdown?.length > 0 ? (
                    paymentData.commission_breakdown.map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">Order #{commission.order_id}</h4>
                            {getStatusBadge(commission.status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Customer: {commission.customer_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Product: {commission.product_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Date: {formatDate(commission.date)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-lg font-bold">{formatCurrency(commission.commission_amount)}</div>
                          <div className="text-sm text-gray-600">
                            {commission.commission_rate}% of {formatCurrency(commission.order_amount)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No commission records found for the selected period</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Payment History
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => exportData('history')}
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-60 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Complete payment history</p>
                    <p className="text-sm">All payments and transactions will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}