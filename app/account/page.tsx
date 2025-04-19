'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Heart, Ruler, Settings, ExternalLink, Clock } from 'lucide-react';

interface Order {
  order_id: number;
  order_number: string;
  created_at: string;
  total_amount: number;
  status: string;
  item_count: number;
}

export default function AccountDashboard() {
  const [user, setUser] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user and recent orders data
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();

        // Fetch recent orders
        const ordersRes = await fetch('/api/account/orders?limit=3');
        const ordersData = await ordersRes.json();

        setUser(userData.user);
        setRecentOrders(ordersData.orders || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>

      {/* Dashboard Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/account/orders"
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800">My Orders</h3>
              <p className="text-sm text-blue-600 mt-1">
                View and track your orders
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/account/measurements"
          className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start">
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <Ruler size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">My Measurements</h3>
              <p className="text-sm text-green-600 mt-1">
                Saved window measurements
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/account/wishlist"
          className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start">
            <div className="bg-purple-100 rounded-full p-2 mr-3">
              <Heart size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-purple-800">Saved Items</h3>
              <p className="text-sm text-purple-600 mt-1">
                Products saved for later
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/account/profile"
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start">
            <div className="bg-amber-100 rounded-full p-2 mr-3">
              <Settings size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800">Profile Settings</h3>
              <p className="text-sm text-amber-600 mt-1">
                Update your account info
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-primary-red hover:text-primary-red-dark text-sm flex items-center"
          >
            View All
            <ExternalLink size={14} className="ml-1" />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Order #</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">{order.order_number}</td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        order.status === 'Delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium">${order.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/account/orders/${order.order_id}`}
                        className="text-primary-red hover:text-primary-red-dark text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-4">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Link
              href="/products"
              className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>

      {/* Quick Help */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium mb-2">Installation Help</h3>
            <p className="text-sm text-gray-600 mb-2">
              Get installation instructions and video guides for your products.
            </p>
            <Link
              href="/help/installation"
              className="text-primary-red hover:underline text-sm"
            >
              View Installation Guides
            </Link>
          </div>
          <div>
            <h3 className="font-medium mb-2">Measuring Assistance</h3>
            <p className="text-sm text-gray-600 mb-2">
              Learn how to measure your windows for a perfect fit.
            </p>
            <Link
              href="/help/measuring"
              className="text-primary-red hover:underline text-sm"
            >
              View Measuring Guides
            </Link>
          </div>
          <div>
            <h3 className="font-medium mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600 mb-2">
              Get help from our customer service team for any questions.
            </p>
            <Link
              href="/contact"
              className="text-primary-red hover:underline text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
