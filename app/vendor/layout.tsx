'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User, Package, LogOut, ChevronRight, Home,
  ShoppingBag, Settings, BarChart2, FileText,
  ShoppingCart, CreditCard, Truck, Bell
} from 'lucide-react';

interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function VendorLayout({
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

          // If user is not a vendor or admin, redirect to home
          if (data.user.role !== 'vendor' && data.user.role !== 'admin') {
            router.push('/');
          }
        } else {
          // Not authenticated, redirect to login
          router.push('/login?redirect=/vendor');
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
    router.push('/login?redirect=/vendor');
    return null;
  }

  const menuItems = [
    { href: '/vendor', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/vendor/products', label: 'Products', icon: <ShoppingBag size={18} /> },
    { href: '/vendor/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/vendor/payments', label: 'Payments', icon: <CreditCard size={18} /> },
    { href: '/vendor/shipments', label: 'Shipments', icon: <Truck size={18} /> },
    { href: '/vendor/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { href: '/vendor/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { href: '/vendor/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/vendor" className="text-xl font-bold text-blue-700">
                Vendor Portal
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Back to Store
              </Link>
              <div className="relative">
                <button className="flex items-center space-x-2 text-sm focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {user?.firstName && user?.lastName ? (
                      <span className="text-blue-700 font-medium">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    ) : (
                      <User size={16} className="text-blue-700" />
                    )}
                  </div>
                  <span className="hidden md:block text-gray-700">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <nav className="mt-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
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
