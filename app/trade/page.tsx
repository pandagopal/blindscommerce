'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  FileText,
  Award,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  monthlyVolume: number;
  activeProjects: number;
  totalClients: number;
  tradeDiscount: number;
  pendingOrders: number;
  completedOrders: number;
  totalSavings: number;
  creditLimit: number;
}

interface User {
  userId: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export default function TradeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    monthlyVolume: 45280,
    activeProjects: 12,
    totalClients: 28,
    tradeDiscount: 15,
    pendingOrders: 8,
    completedOrders: 156,
    totalSavings: 8420,
    creditLimit: 25000,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'order',
      description: 'Order #TR-2024-156 shipped to Marriott Hotel Project',
      date: '2 hours ago',
      status: 'shipped',
    },
    {
      id: 2,
      type: 'proposal',
      description: 'Proposal approved for Downtown Office Complex',
      date: '5 hours ago',
      status: 'approved',
    },
    {
      id: 3,
      type: 'client',
      description: 'New client registration: Pacific Design Group',
      date: '1 day ago',
      status: 'new',
    },
    {
      id: 4,
      type: 'payment',
      description: 'Payment received for Order #TR-2024-148',
      date: '2 days ago',
      status: 'completed',
    },
  ]);

  const quickActions = [
    {
      name: 'Create Proposal',
      href: '/trade/proposals/new',
      icon: FileText,
      description: 'Generate a new client proposal',
      color: 'bg-blue-500',
    },
    {
      name: 'Bulk Order',
      href: '/trade/bulk-orders/new',
      icon: ShoppingCart,
      description: 'Place a bulk order for projects',
      color: 'bg-green-500',
    },
    {
      name: 'Add Client',
      href: '/trade/clients/new',
      icon: Users,
      description: 'Register a new client',
      color: 'bg-purple-500',
    },
    {
      name: 'View Catalog',
      href: '/trade/catalog',
      icon: Package,
      description: 'Browse trade products',
      color: 'bg-orange-500',
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (res.ok) {
          const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'trade_professional') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login?redirect=/trade');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login?redirect=/trade');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your trade account and projects from your dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-8 w-8 text-yellow-500" />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Trade Professional</p>
              <p className="text-sm text-gray-500">{stats.tradeDiscount}% Discount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Monthly Volume</dt>
                <dd className="text-lg font-medium text-gray-900">
                  ${stats.monthlyVolume.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.activeProjects}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalClients}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Savings</dt>
                <dd className="text-lg font-medium text-gray-900">
                  ${stats.totalSavings.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-red border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`${action.color} rounded-lg inline-flex p-3 text-white`}>
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <Link
              href="/trade/activity"
              className="text-sm text-primary-red hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivity.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index !== recentActivity.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        {activity.type === 'order' && <ShoppingCart className="h-4 w-4 text-gray-600" />}
                        {activity.type === 'proposal' && <FileText className="h-4 w-4 text-gray-600" />}
                        {activity.type === 'client' && <Users className="h-4 w-4 text-gray-600" />}
                        {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trade Discount Level</span>
              <span className="text-sm font-medium text-green-600">{stats.tradeDiscount}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Credit Limit</span>
              <span className="text-sm font-medium text-gray-900">
                ${stats.creditLimit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Orders</span>
              <span className="text-sm font-medium text-orange-600">{stats.pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed Orders</span>
              <span className="text-sm font-medium text-green-600">{stats.completedOrders}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Payment Terms</span>
                <span className="text-sm text-gray-600">Net 30</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Link
              href="/trade/payment"
              className="w-full bg-primary-red text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-red-dark transition-colors text-center block"
            >
              Manage Payment Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}