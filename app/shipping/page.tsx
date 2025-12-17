'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  activeShipments: number;
  completedDeliveries: number;
  pendingPickups: number;
  todayDeliveries: number;
  weeklyDeliveries: number;
  onTimeRate: number;
  customerRating: number;
  totalDistance: number;
}

interface User {
  userId: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export default function ShippingDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeShipments: 12,
    completedDeliveries: 156,
    pendingPickups: 8,
    todayDeliveries: 5,
    weeklyDeliveries: 28,
    onTimeRate: 94.5,
    customerRating: 4.8,
    totalDistance: 1250,
  });

  const [recentShipments, setRecentShipments] = useState([]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await fetch('/api/v2/shipping/recent');
        if (response.ok) {
          const data = await response.json();
          setRecentShipments(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch shipments:', error);
      }
    };
    
    fetchShipments();
  }, []);

  const quickActions = [
    {
      name: 'Active Shipments',
      href: '/shipping/active',
      icon: Package,
      description: 'View and manage active deliveries',
      color: 'bg-blue-500',
    },
    {
      name: 'Pickup Schedule',
      href: '/shipping/pickups',
      icon: Truck,
      description: 'Manage pickup appointments',
      color: 'bg-green-500',
    },
    {
      name: 'Delivery Routes',
      href: '/shipping/routes',
      icon: MapPin,
      description: 'Optimize delivery routes',
      color: 'bg-purple-500',
    },
    {
      name: 'Track Shipments',
      href: '/shipping/tracking',
      icon: Clock,
      description: 'Real-time shipment tracking',
      color: 'bg-orange-500',
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (res.ok) {
          const result = await res.json();
          const data = result.data || result;
          if (data.user.role !== 'shipping_agent') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login?redirect=/shipping');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login?redirect=/shipping');
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
              Manage your shipping assignments and deliveries
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-blue-500" />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Shipping Agent</p>
              <p className="text-sm text-gray-500">On-Time Rate: {stats.onTimeRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Shipments</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.activeShipments}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Completed Deliveries</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.completedDeliveries}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Pickups</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.pendingPickups}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-primary-red" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Customer Rating</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.customerRating}/5.0</dd>
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
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Today's Schedule</h2>
            <Link
              href="/shipping/schedule"
              className="text-sm text-primary-red hover:underline"
            >
              View full schedule
            </Link>
          </div>
          <div className="flow-root">
            {recentShipments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-700 mb-2">No deliveries scheduled</h3>
                <p className="text-sm text-gray-500">
                  Your delivery schedule will appear here.
                </p>
              </div>
            ) : (
              <ul className="-mb-8">
                {recentShipments.map((shipment, index) => (
                <li key={shipment.id}>
                  <div className="relative pb-8">
                    {index !== recentShipments.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        {shipment.status === 'pickup' && <Package className="h-4 w-4 text-blue-600" />}
                        {shipment.status === 'delivery' && <Truck className="h-4 w-4 text-green-600" />}
                        {shipment.status === 'completed' && <CheckCircle className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <p className="text-sm text-gray-900">{shipment.description}</p>
                          <p className="text-xs text-gray-500">{shipment.time} - {shipment.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today's Deliveries</span>
              <span className="text-sm font-medium text-gray-900">{stats.todayDeliveries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Weekly Deliveries</span>
              <span className="text-sm font-medium text-gray-900">{stats.weeklyDeliveries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">On-Time Rate</span>
              <span className="text-sm font-medium text-green-600">{stats.onTimeRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Distance (This Week)</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalDistance} miles</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Customer Rating</span>
                <span className="text-sm font-medium text-yellow-600">★ {stats.customerRating}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Link
              href="/shipping/performance"
              className="w-full bg-primary-red text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-red-dark transition-colors text-center block"
            >
              View Detailed Performance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}