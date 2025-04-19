'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, ShoppingBag, ShoppingCart, TrendingUp,
  Clock, ExternalLink, ChevronRight, Users, Calendar
} from 'lucide-react';

// Add a type for the recent orders at the top of the file
interface RecentOrder {
  id: string;
  date: string;
  customer: string;
  total: number;
  status: string;
  items: number;
}

export default function VendorDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });

  // Update the useState with the proper type
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, this would fetch data from an API
    const fetchDashboardData = async () => {
      try {
        // Mock data for demonstration
        setStats({
          totalSales: 12680.45,
          totalOrders: 53,
          totalProducts: 17,
          pendingOrders: 8,
        });

        // Mock recent orders
        setRecentOrders([
          {
            id: 'SBH-102948',
            date: '2023-10-15',
            customer: 'John Smith',
            total: 349.99,
            status: 'Processing',
            items: 2
          },
          {
            id: 'SBH-102936',
            date: '2023-10-12',
            customer: 'Jane Cooper',
            total: 628.50,
            status: 'Shipped',
            items: 3
          },
          {
            id: 'SBH-102925',
            date: '2023-10-10',
            customer: 'Robert Johnson',
            total: 179.99,
            status: 'Delivered',
            items: 1
          },
          {
            id: 'SBH-102919',
            date: '2023-10-08',
            customer: 'Emily Davis',
            total: 432.75,
            status: 'Delivered',
            items: 2
          },
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
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-blue-100 mr-4">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <h3 className="text-xl font-bold">{formatCurrency(stats.totalSales)}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={14} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+8.2%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-green-100 mr-4">
              <ShoppingCart size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-xl font-bold">{stats.totalOrders}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={14} className="text-green-500 mr-1" />
            <span className="text-green-500 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-purple-100 mr-4">
              <ShoppingBag size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <h3 className="text-xl font-bold">{stats.totalProducts}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Link
              href="/vendor/products"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center"
            >
              Manage Products
              <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-amber-100 mr-4">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <h3 className="text-xl font-bold">{stats.pendingOrders}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Link
              href="/vendor/orders?filter=pending"
              className="text-sm text-amber-600 hover:text-amber-800 font-medium flex items-center"
            >
              View Pending Orders
              <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Orders</h2>
          <Link
            href="/vendor/orders"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            View All Orders
            <ExternalLink size={14} className="ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order: RecentOrder) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.date)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/vendor/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Customers</h2>
            <Link
              href="/vendor/customers"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Users size={16} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">John Smith</h3>
                <p className="text-xs text-gray-500">2 orders • $349.99 total</p>
              </div>
              <div className="ml-auto text-xs text-gray-500">2 days ago</div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Users size={16} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Jane Cooper</h3>
                <p className="text-xs text-gray-500">3 orders • $628.50 total</p>
              </div>
              <div className="ml-auto text-xs text-gray-500">5 days ago</div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Users size={16} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Robert Johnson</h3>
                <p className="text-xs text-gray-500">1 order • $179.99 total</p>
              </div>
              <div className="ml-auto text-xs text-gray-500">1 week ago</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Upcoming Tasks</h2>
            <Link
              href="/vendor/calendar"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View Calendar
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                <Calendar size={16} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Process orders before shipment</h3>
                <p className="text-xs text-gray-500">5 orders ready to ship</p>
              </div>
              <div className="ml-auto">
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">Today</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <ShoppingBag size={16} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Update product inventory</h3>
                <p className="text-xs text-gray-500">3 products low on stock</p>
              </div>
              <div className="ml-auto">
                <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded">Tomorrow</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <DollarSign size={16} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Review monthly sales report</h3>
                <p className="text-xs text-gray-500">Review and analyze October sales</p>
              </div>
              <div className="ml-auto">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Oct 31</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
