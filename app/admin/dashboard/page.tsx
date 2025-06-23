'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Package,
  UserCheck,
  AlertTriangle,
  Clock,
  Database,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw } from 'lucide-react';
import { useSocket } from '@/lib/hooks/useSocket';
import { toast } from 'sonner';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  pendingOrders: number;
  activeCustomers: number;
  stockAlerts: number;
  recentSales: {
    date: string;
    amount: number;
  }[];
  customerGrowth: {
    date: string;
    total: number;
  }[];
}

// Cache Management Dashboard
export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const socket = useSocket();

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchDashboardStats();
      fetchCacheStats();
    }
  }, [session]);

  useEffect(() => {
    if (socket) {
      socket.on('order_created', fetchDashboardStats);
      socket.on('order_updated', fetchDashboardStats);
      socket.on('stock_updated', fetchDashboardStats);

      return () => {
        socket.off('order_created');
        socket.off('order_updated');
        socket.off('stock_updated');
      };
    }
  }, [socket]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshingCache(true);
    try {
      const response = await fetch('/api/admin/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('All caches refreshed successfully!', {
          description: `Cleared ${result.refreshResult.clearedEntries} cache entries`
        });
        setCacheStats(result.currentStats);
        console.log('Cache refresh result:', result);
      } else {
        toast.error('Failed to refresh caches');
      }
    } catch (error) {
      console.error('Cache refresh error:', error);
      toast.error('Error refreshing caches');
    } finally {
      setRefreshingCache(false);
    }
  };

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/cache/refresh');
      if (response.ok) {
        const data = await response.json();
        setCacheStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={fetchDashboardStats}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Cache Management Section - Prominently at top */}
      <Card className="mb-6 border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-6 w-6 text-blue-600" />
                Cache Management System
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Manual cache refresh for Products, Categories, Pricing, Discounts & Coupons
              </CardDescription>
            </div>
            <Button
              onClick={handleRefreshCache}
              disabled={refreshingCache}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
              variant={refreshingCache ? "secondary" : "default"}
            >
              <Zap className={`h-5 w-5 ${refreshingCache ? 'animate-spin' : ''}`} />
              {refreshingCache ? 'Refreshing...' : 'Refresh All Caches'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cacheStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">Homepage Cache</p>
                <p className="text-lg font-semibold text-blue-600">{cacheStats.homepage?.totalEntries || 0} entries</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">Products Cache</p>
                <p className="text-lg font-semibold text-blue-600">{cacheStats.products?.totalEntries || 0} entries</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">Pricing Cache</p>
                <p className="text-lg font-semibold text-blue-600">{cacheStats.pricing?.totalEntries || 0} entries</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">Discounts Cache</p>
                <p className="text-lg font-semibold text-blue-600">{cacheStats.discounts?.totalEntries || 0} entries</p>
              </div>
            </div>
          )}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚡ Important:</strong> Caches no longer expire automatically. Click the "Refresh All Caches" button above after making changes to products, categories, pricing, or discounts to see the updates on your website.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">${(stats?.totalRevenue || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <ShoppingBag className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-purple-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold">{stats?.totalCustomers || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold">${(stats?.averageOrderValue || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
            <p className="text-xs text-gray-600">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Customers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCustomers || 0}</div>
            <p className="text-xs text-gray-600">In the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stockAlerts || 0}</div>
            <p className="text-xs text-gray-600">Items need restock</p>
          </CardContent>
        </Card>
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats?.recentSales && stats.recentSales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.recentSales}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No revenue data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>New customers over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats?.customerGrowth && stats.customerGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.customerGrowth}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No customer growth data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
