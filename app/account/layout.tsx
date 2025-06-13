'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  MapPin,
  User,
  Settings,
  Ruler,
  BookmarkIcon,
  ChevronRight,
  LogOut
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
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
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

  if (!user) {
    return null;
  }

  const menuItems = [
    { href: '/account', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/account/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/account/measurements', label: 'Measurements', icon: <Ruler size={18} /> },
    { href: '/account/configurations', label: 'Saved Configs', icon: <BookmarkIcon size={18} /> },
    { href: '/account/settings', label: 'Settings', icon: <Settings size={18} /> },
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
                <Link href="/account" className="text-xl font-bold text-primary-red">
                  My Account
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
                  <Link href="/account/measurements/new" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">📏</span> Add New Measurement
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">📦</span> Track Orders
                  </Link>
                </li>
              </ul>
            </div>

            {user?.role === 'admin' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                <h3 className="font-medium text-primary mb-2">Admin Access</h3>
                <p className="text-sm text-secondary mb-3">
                  Manage your site, users, and products in the admin dashboard.
                </p>
                <Link
                  href="/admin"
                  className="text-primary-red hover:text-primary-dark text-sm font-medium flex items-center"
                >
                  Go to Admin Dashboard
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            )}

            {user?.role === 'vendor' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                <h3 className="font-medium text-primary mb-2">Vendor Access</h3>
                <p className="text-sm text-secondary mb-3">
                  Manage your products and orders in the vendor dashboard.
                </p>
                <Link
                  href="/vendor"
                  className="text-primary-red hover:text-primary-dark text-sm font-medium flex items-center"
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
