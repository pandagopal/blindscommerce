'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User, Package, LogOut, ChevronRight, Home,
  ShoppingBag, Settings, BarChart2, FileText,
  ShoppingCart, Users, Database, AlertTriangle
} from 'lucide-react';

interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function AdminLayout({
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
        if (!res.ok) {
          // Not authenticated, redirect to login
          if (pathname !== '/login') {
            router.replace('/login?redirect=/admin');
          }
          return;
        }

        const data = await res.json();
        if (data.user.role !== 'admin') {
          // Not an admin, redirect to home
          router.replace('/');
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
        if (pathname !== '/login') {
          router.replace('/login?redirect=/admin');
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch user data if we're not already on the login page
    if (pathname !== '/login') {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded w-full max-w-md"></div>
        </div>
      </div>
    );
  }

  // If not authenticated or not an admin, don't render anything
  // The useEffect above will handle the redirect
  if (!user || user.role !== 'admin') {
    return null;
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/admin/products', label: 'Products', icon: <ShoppingBag size={18} /> },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { href: '/admin/vendors', label: 'Vendors', icon: <Package size={18} /> },
    { href: '/admin/database', label: 'Database', icon: <Database size={18} /> },
    { href: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { href: '/admin/logs', label: 'System Logs', icon: <AlertTriangle size={18} /> },
    { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-purple-800 text-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold">
                Admin Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-white hover:text-purple-100">
                Back to Store
              </Link>
              <div className="relative">
                <button className="flex items-center space-x-2 text-sm focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center">
                    {user?.firstName && user?.lastName ? (
                      <span className="text-white font-medium">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    ) : (
                      <User size={16} className="text-white" />
                    )}
                  </div>
                  <span className="hidden md:block text-white">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <nav className="mt-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 transition-colors ${
                      pathname === item.href
                        ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
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
                  className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="mr-3"><LogOut size={18} /></span>
                  <span>Logout</span>
                </button>
              </nav>
            </div>

            {/* Quick Access */}
            <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-100 p-4 mt-6">
              <h3 className="font-medium text-purple-800 mb-2">Quick Access</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/admin/products/new" className="text-purple-600 hover:text-purple-800 flex items-center">
                    <span className="mr-2">➕</span> Add New Product
                  </Link>
                </li>
                <li>
                  <Link href="/admin/vendors/new" className="text-purple-600 hover:text-purple-800 flex items-center">
                    <span className="mr-2">➕</span> Add New Vendor
                  </Link>
                </li>
                <li>
                  <Link href="/admin/orders?status=pending" className="text-purple-600 hover:text-purple-800 flex items-center">
                    <span className="mr-2">⏱️</span> View Pending Orders
                  </Link>
                </li>
                <li>
                  <Link href="/admin/users/new" className="text-purple-600 hover:text-purple-800 flex items-center">
                    <span className="mr-2">➕</span> Add New User
                  </Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
