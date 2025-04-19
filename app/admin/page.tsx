'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, ShoppingBag, Users, ShoppingCart,
  ArrowUpRight, TrendingUp, TrendingDown, Box,
  UserPlus, Activity, AlertTriangle, CheckCircle2,
  Clock
} from 'lucide-react';

// Types
interface Order {
  id: string;
  date: string;
  customer: string;
  status: string;
  total: number;
  items: number;
}

interface SystemStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastChecked: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    newOrdersToday: 0,
    revenue7d: 0,
    revenuePrev7d: 0,
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a production app, this would fetch from the API
    const fetchDashboardData = async () => {
      try {
        // Mock data for demonstration
        setStats({
          totalRevenue: 86945.75,
          totalUsers: 527,
          totalProducts: 132,
          totalOrders: 1245,
          pendingOrders: 37,
          newOrdersToday: 12,
          revenue7d: 15640.25,
          revenuePrev7d: 14250.50,
        });

        // Mock recent orders
        setRecentOrders([
          {
            id: 'SBH-10465',
            date: '2023-10-15T10:32:00Z',
            customer: 'John Smith',
            status: 'Processing',
            total: 349.99,
            items: 2
          },
          {
            id: 'SBH-10464',
            date: '2023-10-15T09:15:00Z',
            customer: 'Emily Davis',
            status: 'Pending',
            total: 532.50,
            items: 3
          },
          {
            id: 'SBH-10463',
            date: '2023-10-14T16:28:00Z',
            customer: 'Michael Johnson',
            status: 'Shipped',
            total: 179.99,
            items: 1
          },
          {
            id: 'SBH-10462',
            date: '2023-10-14T14:42:00Z',
            customer: 'Sarah Williams',
            status: 'Delivered',
            total: 432.75,
            items: 2
          },
          {
            id: 'SBH-10461',
            date: '2023-10-14T11:05:00Z',
            customer: 'Robert Brown',
            status: 'Processing',
            total: 845.25,
            items: 4
          },
        ]);

        // Mock system status
        setSystemStatus([
          { name: 'Database', status: 'healthy', lastChecked: '2023-10-15T10:45:00Z' },
          { name: 'API Services', status: 'healthy', lastChecked: '2023-10-15T10:45:00Z' },
          { name: 'Payment Gateway', status: 'healthy', lastChecked: '2023-10-15T10:44:00Z' },
          { name: 'Inventory System', status: 'warning', lastChecked: '2023-10-15T10:43:00Z' },
          { name: 'Email Service', status: 'healthy', lastChecked: '2023-10-15T10:42:00Z' },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate revenue change percentage
  const revenueChangePercent = ((stats.revenue7d - stats.revenuePrev7d) / stats.revenuePrev7d) * 100;

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Link href="/admin/analytics" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              View detailed report
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              View all orders
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Products</p>
              <h3 className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <ShoppingBag size={20} className="text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Link href="/admin/products" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              Manage products
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              Manage users
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Orders & Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Revenue Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm lg:col-span-1">
          <h3 className="font-medium mb-4">Weekly Revenue</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Current Week</span>
                <span className="text-sm font-medium">{formatCurrency(stats.revenue7d)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Previous Week</span>
                <span className="text-sm font-medium">{formatCurrency(stats.revenuePrev7d)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-gray-500 h-2.5 rounded-full" style={{ width: `${(stats.revenuePrev7d / stats.revenue7d) * 100}%` }}></div>
              </div>
            </div>
            <div className="flex items-center pt-2">
              {revenueChangePercent >= 0 ? (
                <>
                  <TrendingUp size={16} className="text-green-600 mr-1" />
                  <span className="text-green-600 text-sm font-medium">+{revenueChangePercent.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown size={16} className="text-red-600 mr-1" />
                  <span className="text-red-600 text-sm font-medium">{revenueChangePercent.toFixed(1)}%</span>
                </>
              )}
              <span className="text-gray-500 text-sm ml-1">from last week</span>
            </div>
          </div>
        </div>

        {/* Order Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm lg:col-span-2">
          <h3 className="font-medium mb-4">Order Statistics</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Box size={16} className="text-blue-600 mr-1" />
                <span className="text-sm text-blue-800">New Orders</span>
              </div>
              <p className="text-xl font-bold">{stats.newOrdersToday}</p>
              <p className="text-xs text-blue-600">Today</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Clock size={16} className="text-amber-600 mr-1" />
                <span className="text-sm text-amber-800">Pending</span>
              </div>
              <p className="text-xl font-bold">{stats.pendingOrders}</p>
              <p className="text-xs text-amber-600">Need attention</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <ShoppingCart size={16} className="text-green-600 mr-1" />
                <span className="text-sm text-green-800">Processing</span>
              </div>
              <p className="text-xl font-bold">24</p>
              <p className="text-xs text-green-600">In progress</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <UserPlus size={16} className="text-purple-600 mr-1" />
                <span className="text-sm text-purple-800">New Users</span>
              </div>
              <p className="text-xl font-bold">8</p>
              <p className="text-xs text-purple-600">Today</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm">Available Actions</h4>
                <p className="text-xs text-gray-500">Quick access to common tasks</p>
              </div>
              <div className="flex space-x-2">
                <Link
                  href="/admin/orders?status=pending"
                  className="px-3 py-1 text-xs bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200"
                >
                  View Pending Orders
                </Link>
                <Link
                  href="/admin/orders/batch-process"
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  Batch Process Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              View All
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500">Order ID</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500">Date</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500">Customer</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500">Status</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-800">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{formatDate(order.date)}</td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/users?search=${encodeURIComponent(order.customer)}`} className="hover:text-blue-600">
                        {order.customer}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        order.status === 'Delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'Processing'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm lg:col-span-1">
          <h3 className="font-medium mb-4">System Status</h3>
          <div className="space-y-3">
            {systemStatus.map((system) => (
              <div key={system.name} className="flex items-center p-2 border border-gray-100 rounded-lg">
                {system.status === 'healthy' ? (
                  <CheckCircle2 size={16} className="text-green-500 mr-2 shrink-0" />
                ) : system.status === 'warning' ? (
                  <AlertTriangle size={16} className="text-amber-500 mr-2 shrink-0" />
                ) : (
                  <Activity size={16} className="text-red-500 mr-2 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium">{system.name}</p>
                  <p className="text-xs text-gray-500">
                    {system.status === 'healthy' ? 'Operational' : system.status === 'warning' ? 'Degraded' : 'Outage'}
                    <span className="mx-1">•</span>
                    {new Date(system.lastChecked).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              href="/admin/system/status"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              View system status dashboard
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
