'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag, Ruler, BookmarkIcon, Package, 
  DollarSign, Clock, CheckCircle, Truck, Settings
} from 'lucide-react';

interface UserProfile {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
}

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminViewUserId = searchParams.get('admin_view');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Authentication required');
        }
        const userData = await response.json();

        // Check if admin is viewing another user's dashboard
        if (adminViewUserId && userData.user.role === 'admin') {
          setIsAdminView(true);
          setUser(userData.user);
          
          // Store AdminViewId in session
          sessionStorage.setItem('AdminViewId', adminViewUserId);
          
          // Fetch the customer being viewed
          const customerRes = await fetch(`/api/admin/users/${adminViewUserId}`);
          if (customerRes.ok) {
            const customerData = await customerRes.json();
            if (customerData.user.role !== 'customer') {
              alert('Selected user is not a customer');
              router.push('/admin/users');
              return;
            }
            // Set the viewed customer as the active user for display
            setUser({
              userId: customerData.user.user_id,
              email: customerData.user.email,
              firstName: customerData.user.first_name || '',
              lastName: customerData.user.last_name || '',
              phone: customerData.user.phone || '',
              role: customerData.user.role
            });
          } else {
            alert('Failed to fetch customer information');
            router.push('/admin/users');
            return;
          }
        } else {
          // Regular customer viewing their own account
          setUser({
            userId: userData.user.userId,
            email: userData.user.email,
            firstName: userData.user.firstName || '',
            lastName: userData.user.lastName || '',
            phone: userData.user.phone || '',
            role: userData.user.role
          });
          sessionStorage.removeItem('AdminViewId');
        }

        // Mock order stats for now
        setOrderStats({
          totalOrders: 12,
          totalSpent: 2450.00,
          pendingOrders: 2,
          completedOrders: 10
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [adminViewUserId, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Admin View Banner */}
      {isAdminView && (
        <div className="mb-6 bg-blue-500 text-white px-4 py-3 rounded-lg flex items-center justify-between">
          <span>
            Viewing {user?.firstName} {user?.lastName}'s dashboard as administrator
          </span>
          <Link href="/admin/users" className="text-blue-100 hover:text-white underline">
            Back to Admin Users
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">Here's an overview of your account</p>
        </div>
        <Link href="/account/settings">
          <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${orderStats.totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.pendingOrders}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.completedOrders}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="orders" className="flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5" />
            <span>Recent Orders</span>
          </TabsTrigger>
          <TabsTrigger value="measurements" className="flex items-center">
            <Ruler className="mr-2 h-5 w-5" />
            <span>Measurements</span>
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center">
            <BookmarkIcon className="mr-2 h-5 w-5" />
            <span>Saved Configs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Recent Orders & Shipments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock recent orders */}
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Order #12345</h4>
                      <p className="text-sm text-gray-600">Roller Shades - White, 36" x 48"</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Shipped
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Ordered: Dec 15, 2024</span>
                    <span className="font-medium">$289.99</span>
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4 mr-1" />
                    Tracking: 1Z999AA1234567890
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Order #12344</h4>
                      <p className="text-sm text-gray-600">Venetian Blinds - Wood, 48" x 60"</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Delivered
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Ordered: Dec 10, 2024</span>
                    <span className="font-medium">$445.50</span>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <Link href="/account/orders" className="text-blue-600 hover:text-blue-700 font-medium">
                    View All Orders →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ruler className="mr-2 h-5 w-5" />
                My Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Ruler className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No measurements saved yet</p>
                <Link href="/account/measurements" className="text-blue-600 hover:text-blue-700 font-medium">
                  Add Your First Measurement →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurations" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookmarkIcon className="mr-2 h-5 w-5" />
                Saved Configurations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookmarkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No saved configurations yet</p>
                <Link href="/products" className="text-blue-600 hover:text-blue-700 font-medium">
                  Browse Products to Configure →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}