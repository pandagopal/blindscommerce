'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Truck,
  BarChart2,
  Bell,
  Settings,
  User,
  ChevronRight,
  LogOut,
  Store
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
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'vendor' && data.user.role !== 'admin') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
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

  if (!user) {
    return null;
  }

  const menuItems = [
    { href: '/vendor', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/vendor/products', label: 'Products', icon: <ShoppingBag size={18} /> },
    { href: '/vendor/storefront', label: 'Storefront', icon: <Store size={18} /> },
    { href: '/vendor/sales-team', label: 'Sales Team', icon: <User size={18} /> },
    { href: '/vendor/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/vendor/payments', label: 'Payments', icon: <CreditCard size={18} /> },
    { href: '/vendor/shipments', label: 'Shipments', icon: <Truck size={18} /> },
    { href: '/vendor/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { href: '/vendor/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { href: '/vendor/profile', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Portal Title */}
              <div className="px-4 py-4 border-b border-gray-200">
                <Link href="/vendor" className="text-xl font-bold text-primary-red">
                  Vendor Portal
                </Link>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-default flex items-center justify-center">
                      {user?.firstName && user?.lastName ? (
                        <span className="text-primary-red font-medium text-xs">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      ) : (
                        <User size={16} className="text-primary-red" />
                      )}
                    </div>
                    <span className="text-sm text-primary">
                      {user?.firstName ? `${user.firstName}` : user?.email?.split('@')[0]}
                    </span>
                  </div>
                  <Link href="/" className="text-xs text-secondary hover:text-primary">
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
                        ? 'bg-default text-primary-red border-l-4 border-primary-red'
                        : 'text-secondary hover:bg-default'
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
                  className="flex items-center w-full px-4 py-3 text-secondary hover:bg-default transition-colors"
                >
                  <span className="mr-3"><LogOut size={18} /></span>
                  <span>Logout</span>
                </button>
              </nav>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
              <h3 className="font-medium text-primary mb-2">Quick Access</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/vendor/products/new" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">➕</span> Add New Product
                  </Link>
                </li>
                <li>
                  <Link href="/vendor/orders?status=pending" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">⏱️</span> View Pending Orders
                  </Link>
                </li>
                <li>
                  <Link href="/vendor/analytics" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">📊</span> View Sales Report
                  </Link>
                </li>
              </ul>
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
