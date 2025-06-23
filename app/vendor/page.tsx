'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  DollarSign, ShoppingBag, ShoppingCart, TrendingUp,
  Clock, ExternalLink, ChevronRight, Users, Calendar, Shield
} from 'lucide-react';

interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface RecentOrder {
  id: string;
  date: string;
  customer: string;
  total: number;
  status: string;
  items: number;
}

function VendorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const adminViewUserId = searchParams.get('admin_view');
  const [isAdminView, setIsAdminView] = useState(false);
  const [viewedVendor, setViewedVendor] = useState<User | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [vendorInfoId, setVendorInfoId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (!loading && user) {
      const setupVendorView = async () => {
        try {
          // Check if admin is viewing another user's dashboard
          if (adminViewUserId && user.role === 'admin') {
            setIsAdminView(true);
            
            // Store AdminViewId in session
            sessionStorage.setItem('AdminViewId', adminViewUserId);
            
            // Fetch the vendor being viewed
            const vendorRes = await fetch(`/api/admin/users/${adminViewUserId}`);
            if (vendorRes.ok) {
              const vendorData = await vendorRes.json();
              if (vendorData.user.role !== 'vendor') {
                alert('Selected user is not a vendor');
                router.push('/admin/users');
                return;
              }
              setViewedVendor(vendorData.user);
              
              // Fetch vendor_info_id for this user
              const vendorInfoRes = await fetch(`/api/vendor/info?user_id=${adminViewUserId}`);
              if (vendorInfoRes.ok) {
                const vendorInfoData = await vendorInfoRes.json();
                setVendorInfoId(vendorInfoData.vendor_info_id);
              }
            } else {
              alert('Failed to fetch vendor information');
              router.push('/admin/users');
              return;
            }
          } else if (user.role !== 'vendor') {
            router.push('/');
            return;
          } else {
            setViewedVendor(user);
            // Clear admin view session if not in admin mode
            sessionStorage.removeItem('AdminViewId');
          }
        } catch (error) {
          console.error('Error setting up vendor view:', error);
        } finally {
          setDashboardLoading(false);
        }
      };

      setupVendorView();
    } else if (!loading && !user) {
      router.push('/login?redirect=/vendor');
    }
  }, [user, loading, router, adminViewUserId]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!viewedVendor) return;
      
      try {
        setDashboardLoading(true);
        const apiUrl = '/api/vendor/dashboard';
          
        const adminViewId = sessionStorage.getItem('AdminViewId');
        const headers: HeadersInit = {};
        if (isAdminView && adminViewId) {
          headers['x-admin-view-id'] = adminViewId;
        }
        
        const res = await fetch(apiUrl, { headers });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || {
            totalSales: 0,
            totalOrders: 0,
            totalProducts: 0,
            pendingOrders: 0,
          });
          setRecentOrders(data.recentOrders || []);
        } else {
          console.error('Failed to fetch dashboard data:', res.status);
          setStats({
            totalSales: 0,
            totalOrders: 0,
            totalProducts: 0,
            pendingOrders: 0,
          });
          setRecentOrders([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({
          totalSales: 0,
          totalOrders: 0,
          totalProducts: 0,
          pendingOrders: 0,
        });
        setRecentOrders([]);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [viewedVendor, isAdminView]);

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

  if (loading || dashboardLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (!user || !viewedVendor) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {isAdminView ? `${viewedVendor.first_name} ${viewedVendor.last_name}'s ` : ''}Vendor Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Products</h3>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Listings</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalSales)}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
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

      </div>

      {/* Upcoming Activities */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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

export default function VendorDashboard() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    }>
      <VendorDashboardContent />
    </Suspense>
  );
}
