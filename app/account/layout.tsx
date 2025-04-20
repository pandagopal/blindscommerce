'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User, Package, Heart, Settings, LogOut,
  ChevronRight, Home, Ruler, Bell, Shield
} from 'lucide-react';

interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user data
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Not authenticated, redirect to login
          router.push('/login?redirect=/account');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded w-full max-w-md"></div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (should be handled by middleware, but this is a fallback)
  if (!user && !loading) {
    router.push('/login?redirect=/account');
    return null;
  }

  const menuItems = [
    { href: '/account', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/account/orders', label: 'My Orders', icon: <Package size={18} /> },
    { href: '/account/measurements', label: 'My Measurements', icon: <Ruler size={18} /> },
    { href: '/account/wishlist', label: 'Saved Items', icon: <Heart size={18} /> },
    { href: '/account/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { href: '/account/profile', label: 'Profile Settings', icon: <User size={18} /> },
    { href: '/account/security', label: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                {user?.firstName && user?.lastName ? (
                  <span className="text-xl font-semibold text-gray-700">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </div>
              <h3 className="font-bold text-gray-800">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {user?.role === 'admin' ? 'Admin' :
                 user?.role === 'vendor' ? 'Vendor' : 'Customer'}
              </p>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-primary-red text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                  {pathname === item.href && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <span className="mr-3"><LogOut size={18} /></span>
                <span>Logout</span>
              </button>
            </nav>
          </div>

          {user?.role === 'vendor' && (
            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
              <h3 className="font-medium text-blue-800 mb-2">Vendor Portal</h3>
              <p className="text-sm text-blue-600 mb-3">
                Manage your product listings and orders in the vendor portal.
              </p>
              <Link
                href="/vendor"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                Go to Vendor Portal
                <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-200 p-4">
              <h3 className="font-medium text-purple-800 mb-2">Admin Dashboard</h3>
              <p className="text-sm text-purple-600 mb-3">
                Manage your site, users, and products in the admin dashboard.
              </p>
              <Link
                href="/admin"
                className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center"
              >
                Go to Admin Dashboard
                <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
