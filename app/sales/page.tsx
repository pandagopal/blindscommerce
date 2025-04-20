'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, Users, Phone, Mail,
  ArrowUpRight, TrendingUp, Calendar,
  BarChart3, ShoppingCart, Clock
} from 'lucide-react';

// Types for the leads and sales data
interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
  date: string;
  source: string;
}

interface SalesPerformance {
  dailyTarget: number;
  dailyAchieved: number;
  monthlyTarget: number;
  monthlyAchieved: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: string;
}

export default function SalesDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [performance, setPerformance] = useState<SalesPerformance>({
    dailyTarget: 0,
    dailyAchieved: 0,
    monthlyTarget: 0,
    monthlyAchieved: 0,
    conversionRate: 0,
    averageOrderValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch data from an API
    const fetchDashboardData = async () => {
      try {
        // Mock leads data
        const mockLeads = [
          {
            id: 1,
            name: 'John Davis',
            email: 'john@example.com',
            phone: '(555) 123-4567',
            status: 'new' as const,
            date: '2023-10-18',
            source: 'Website'
          },
          {
            id: 2,
            name: 'Emily Wilson',
            email: 'emily@example.com',
            phone: '(555) 987-6543',
            status: 'contacted' as const,
            date: '2023-10-17',
            source: 'Referral'
          },
          {
            id: 3,
            name: 'Michael Brown',
            email: 'michael@example.com',
            phone: '(555) 456-7890',
            status: 'qualified' as const,
            date: '2023-10-16',
            source: 'Google Ads'
          },
          {
            id: 4,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '(555) 321-6547',
            status: 'proposal' as const,
            date: '2023-10-15',
            source: 'Facebook'
          },
          {
            id: 5,
            name: 'Robert Miller',
            email: 'robert@example.com',
            phone: '(555) 889-7410',
            status: 'closed' as const,
            date: '2023-10-14',
            source: 'Direct Mail'
          },
        ];
        setLeads(mockLeads);

        // Mock recent orders
        const mockOrders = [
          {
            id: 'SBH-10584',
            customer: 'Robert Miller',
            date: '2023-10-14',
            total: 849.99,
            status: 'Completed'
          },
          {
            id: 'SBH-10572',
            customer: 'Jennifer Adams',
            date: '2023-10-13',
            total: 1245.50,
            status: 'Processing'
          },
          {
            id: 'SBH-10568',
            customer: 'William Clark',
            date: '2023-10-12',
            total: 478.75,
            status: 'Shipped'
          },
        ];
        setRecentOrders(mockOrders);

        // Mock performance data
        setPerformance({
          dailyTarget: 5000,
          dailyAchieved: 3250,
          monthlyTarget: 100000,
          monthlyAchieved: 85450,
          conversionRate: 28,
          averageOrderValue: 785.50
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-purple-100 text-purple-800';
      case 'qualified':
        return 'bg-amber-100 text-amber-800';
      case 'proposal':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
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
        <div>
          <h1 className="text-2xl font-bold mb-1">Sales Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="rounded-full p-3 bg-green-100 mr-4">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Daily Sales</p>
              <h3 className="text-xl font-bold">{formatCurrency(performance.dailyAchieved)}</h3>
            </div>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-green-600">
                  {Math.round((performance.dailyAchieved / performance.dailyTarget) * 100)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-gray-600">
                  Target: {formatCurrency(performance.dailyTarget)}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
              <div
                style={{ width: `${Math.min(100, (performance.dailyAchieved / performance.dailyTarget) * 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="rounded-full p-3 bg-blue-100 mr-4">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Sales</p>
              <h3 className="text-xl font-bold">{formatCurrency(performance.monthlyAchieved)}</h3>
            </div>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {Math.round((performance.monthlyAchieved / performance.monthlyTarget) * 100)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-gray-600">
                  Target: {formatCurrency(performance.monthlyTarget)}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${Math.min(100, (performance.monthlyAchieved / performance.monthlyTarget) * 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <div className="flex items-center">
                <h3 className="text-xl font-bold">{performance.conversionRate}%</h3>
                <TrendingUp size={16} className="text-green-500 ml-2" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
              <h3 className="text-xl font-bold">{formatCurrency(performance.averageOrderValue)}</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/sales/analytics"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              View detailed analytics
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Leads & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Leads</h2>
            <Link
              href="/sales/leads"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              View All Leads
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs font-medium text-gray-500 bg-gray-50 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-gray-500">
                          <Mail size={14} className="mr-1" />
                          {lead.email}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Phone size={14} className="mr-1" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {lead.source}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {formatDate(lead.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/sales/leads/${lead.id}`}
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

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Upcoming Tasks</h2>
            <Link
              href="/sales/calendar"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Calendar size={14} className="mr-1" />
              View Calendar
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Follow up with Emily Wilson</h3>
                  <p className="text-sm text-gray-500 mt-1">Discuss product options and pricing</p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded">Today</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Send quote to Michael Brown</h3>
                  <p className="text-sm text-gray-500 mt-1">Include specs and installation details</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Tomorrow</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Team sales meeting</h3>
                  <p className="text-sm text-gray-500 mt-1">Weekly targets and strategies</p>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">Oct 22</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Check inventory updates</h3>
                  <p className="text-sm text-gray-500 mt-1">Review new products and availability</p>
                </div>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">Oct 23</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow border border-gray-100 p-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Orders</h2>
          <Link
            href="/sales/orders"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <ShoppingCart size={14} className="mr-1" />
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs font-medium text-gray-500 bg-gray-50 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{order.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{order.customer}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatDate(order.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/sales/orders/${order.id}`}
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

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/sales/leads/new"
          className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg p-4 transition-colors"
        >
          <Users size={20} className="mr-2" />
          <span>Add New Lead</span>
        </Link>

        <Link
          href="/sales/quotes/new"
          className="flex items-center justify-center bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg p-4 transition-colors"
        >
          <DollarSign size={20} className="mr-2" />
          <span>Create Quote</span>
        </Link>

        <Link
          href="/sales/orders/new"
          className="flex items-center justify-center bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg p-4 transition-colors"
        >
          <ShoppingCart size={20} className="mr-2" />
          <span>Create Order</span>
        </Link>

        <Link
          href="/sales/calendar"
          className="flex items-center justify-center bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg p-4 transition-colors"
        >
          <Clock size={20} className="mr-2" />
          <span>Schedule Follow-up</span>
        </Link>
      </div>
    </div>
  );
}
