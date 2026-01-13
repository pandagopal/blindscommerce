'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  ShoppingCart,
  Ruler,
  BookmarkIcon,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Shield,
  Heart,
  MapPin,
  Package,
  Wrench
} from 'lucide-react';

interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

function AccountLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const isAdminView = searchParams.get('admin_view') !== null;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
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

  if (!user) {
    return null;
  }

  const menuItems: Array<{ href: string; label: string; icon: React.ReactNode; highlight?: boolean }> = [
    { href: '/account', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/account/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/account/offline-orders', label: 'Local Orders', icon: <Package size={18} />, highlight: true },
    { href: '/account/measurements', label: 'Measurements', icon: <Ruler size={18} /> },
    { href: '/account/configurations', label: 'Saved Configs', icon: <BookmarkIcon size={18} /> },
    { href: '/account/wishlist', label: 'Wishlist', icon: <Heart size={18} /> },
    { href: '/account/addresses', label: 'Addresses', icon: <MapPin size={18} /> },
    { href: '/account/installation', label: 'Installation', icon: <Wrench size={18} /> },
    { href: '/account/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className={`rounded-lg shadow-sm border border-gray-200 overflow-hidden ${isAdminView ? 'bg-purple-50' : 'bg-white'}`}>
              <div className={`px-4 py-4 border-b border-gray-200 ${isAdminView ? 'bg-purple-100' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <Link href="/account" className="text-xl font-bold text-primary-red">
                    My Account
                  </Link>
                  {isAdminView && (
                    <Link
                      href="/admin/users"
                      className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      <Shield size={14} className="mr-1" />
                      ADMIN
                    </Link>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {user?.firstName && user?.lastName ? (
                        <span className="text-primary-red font-medium text-xs">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      ) : (
                        <User size={16} className="text-primary-red" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.firstName 
                        ? user.firstName 
                        : user?.email?.split('@')[0]}
                    </span>
                  </div>
                  <Link href="/" className="text-xs text-gray-500 hover:text-gray-700">
                    Store →
                  </Link>
                </div>
              </div>
              <nav className="mt-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 transition-colors ${
                      pathname === item.href
                        ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                        : item.highlight
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className={item.highlight ? 'font-semibold' : ''}>{item.label}</span>
                    {item.highlight && <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded">NEW</span>}
                    {pathname === item.href && !item.highlight && (
                      <ChevronRight size={16} className="ml-auto" />
                    )}
                  </Link>
                ))}

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span className="mr-3"><LogOut size={18} /></span>
                  <span>Logout</span>
                </button>
              </nav>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
              <h3 className="font-medium text-gray-800 mb-2">Quick Access</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/account/measurements" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">📏</span> View Measurements
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">📦</span> Track Orders
                  </Link>
                </li>
                <li>
                  <Link href="/account/recently-viewed" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">👁️</span> Recently Viewed
                  </Link>
                </li>
                <li>
                  <Link href="/account/warranty" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">🛡️</span> Warranty Info
                  </Link>
                </li>
              </ul>
            </div>

            {user?.role === 'admin' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                <h3 className="font-medium text-gray-800 mb-2">Admin Access</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Manage your site, users, and products in the admin dashboard.
                </p>
                <Link
                  href="/admin"
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                >
                  Go to Admin Dashboard
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            )}

            {user?.role === 'vendor' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                <h3 className="font-medium text-gray-800 mb-2">Vendor Access</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Manage your products and orders in the vendor dashboard.
                </p>
                <Link
                  href="/vendor"
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                >
                  Go to Vendor Dashboard
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
    </div>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded w-full max-w-md"></div>
        </div>
      </div>
    }>
      <AccountLayoutContent>
        {children}
      </AccountLayoutContent>
    </Suspense>
  );
}
