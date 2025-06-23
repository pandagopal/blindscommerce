'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Eye, 
  Users, Package, Download, BarChart3, Star, Target
} from 'lucide-react';

interface VendorAnalytics {
  overview: {
    total_revenue: number;
    revenue_change: number;
    total_orders: number;
    orders_change: number;
    product_views: number;
    views_change: number;
    conversion_rate: number;
    conversion_change: number;
    avg_rating: number;
    commission_earned: number;
  };
  sales_data: any[];
  product_performance: any[];
  customer_insights: any[];
}

export default function VendorAnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/vendor/analytics');
        return;
      }
      if (user.role !== 'vendor' && user.role !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [user, loading, router]);

  // Lazy load analytics data only when this route is active
  const fetchAnalyticsData = async () => {
    const res = await fetch(`/api/vendor/analytics?range=${dateRange}`);
    if (!res.ok) {
      throw new Error('Failed to fetch analytics data');
    }
    return res.json();
  };

  const { 
    data: analyticsData, 
    loading: analyticsLoading, 
    error: analyticsError, 
    refetch 
  } = useLazyLoad(fetchAnalyticsData, {
    targetPath: '/vendor/analytics',
    dependencies: [dateRange]
  });

  const exportData = async (type: string) => {
    try {
      const res = await fetch(`/api/vendor/analytics/export?type=${type}&range=${dateRange}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendor-analytics-${type}-${dateRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  if (loading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor analytics...</p>
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
              Vendor Analytics
            </h1>
            <p className="text-gray-600">Track your performance and sales insights</p>
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
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analyticsData?.overview?.total_revenue || 0)}
              </div>
              <div className="mt-1">
                {formatChange(analyticsData?.overview?.revenue_change || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analyticsData?.overview?.total_orders || 0).toLocaleString()}
              </div>
              <div className="mt-1">
                {formatChange(analyticsData?.overview?.orders_change || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Product Views</CardTitle>
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analyticsData?.overview?.product_views || 0).toLocaleString()}
              </div>
              <div className="mt-1">
                {formatChange(analyticsData?.overview?.views_change || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analyticsData?.overview?.conversion_rate || 0).toFixed(1)}%
              </div>
              <div className="mt-1">
                {formatChange(analyticsData?.overview?.conversion_change || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-purple-100 shadow-lg">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Customer Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {(analyticsData?.overview?.avg_rating || 0).toFixed(1)}/5.0
              </div>
              <p className="text-sm text-gray-600">Average customer rating across all products</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Commission Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(analyticsData?.overview?.commission_earned || 0)}
              </div>
              <p className="text-sm text-gray-600">Total commission earned this period</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-purple-100">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sales">
              <TrendingUp className="h-4 w-4 mr-2" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="h-4 w-4 mr-2" />
              Customers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Sales Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Sales trend visualization</p>
                      <p className="text-sm">(Chart library integration needed)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div>
                        <div className="text-sm text-green-600 font-medium">Revenue Growth</div>
                        <div className="text-2xl font-bold text-green-700">
                          +{(analyticsData?.overview?.revenue_change || 0).toFixed(1)}%
                        </div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Order Growth</div>
                        <div className="text-2xl font-bold text-blue-700">
                          +{(analyticsData?.overview?.orders_change || 0).toFixed(1)}%
                        </div>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div>
                        <div className="text-sm text-purple-600 font-medium">View Growth</div>
                        <div className="text-2xl font-bold text-purple-700">
                          +{(analyticsData?.overview?.views_change || 0).toFixed(1)}%
                        </div>
                      </div>
                      <Eye className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Sales Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 font-medium">Daily Average</div>
                      <div className="text-2xl font-bold text-green-700">
                        {formatCurrency((analyticsData?.overview?.total_revenue || 0) / 30)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium">Weekly Average</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatCurrency((analyticsData?.overview?.total_revenue || 0) / 4)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium">Monthly Total</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {formatCurrency(analyticsData?.overview?.total_revenue || 0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-80 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Sales timeline chart</p>
                      <p className="text-sm">(Chart library integration needed)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Product Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Top Performing Products</h3>
                    <Button
                      variant="outline"
                      onClick={() => exportData('products')}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'Premium Wood Blinds', sales: 45, revenue: 4500, views: 890 },
                      { name: 'Cellular Shades', sales: 38, revenue: 3800, views: 756 },
                      { name: 'Roller Shades', sales: 32, revenue: 3200, views: 645 },
                      { name: 'Plantation Shutters', sales: 18, revenue: 5400, views: 432 },
                      { name: 'Vertical Blinds', sales: 15, revenue: 1500, views: 298 }
                    ].map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.sales} units sold • {product.views} views</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(product.revenue)}</div>
                          <div className="text-sm text-gray-600">{((product.sales / product.views) * 100).toFixed(1)}% conversion</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Customer Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {analyticsData?.customer_insights?.total_customers || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Customers</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analyticsData?.customer_insights?.repeat_purchase_rate ? 
                          `${(analyticsData.customer_insights.repeat_purchase_rate * 100).toFixed(1)}%` : '0%'}
                      </div>
                      <div className="text-sm text-gray-600">Repeat Purchase Rate</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency((analyticsData?.overview?.total_revenue || 0) / (analyticsData?.overview?.total_orders || 1))}
                      </div>
                      <div className="text-sm text-gray-600">Avg. Order Value</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {analyticsData?.customer_insights?.avg_orders_per_customer?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-sm text-gray-600">Avg. Orders per Customer</div>
                    </div>
                  </div>

                  <div className="h-80 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Customer segmentation charts</p>
                      <p className="text-sm">(Chart library integration needed)</p>
                    </div>
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