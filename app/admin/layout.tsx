'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Users,
  Package,
  Database,
  BarChart2,
  AlertTriangle,
  Settings,
  User,
  ChevronRight,
  LogOut,
  FolderOpen,
  Monitor,
  Building
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
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'admin') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login?redirect=/admin');
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
      // Clear user state immediately
      setUser(null);
      // Trigger event to notify navbar
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      // Set storage event to notify other tabs
      localStorage.setItem('auth_logout', Date.now().toString());
      localStorage.removeItem('auth_logout');
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear state and redirect
      setUser(null);
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      router.push('/');
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

  if (!user || user.role !== 'admin') {
    return null;
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/admin/categories', label: 'Categories', icon: <FolderOpen size={18} /> },
    { href: '/admin/hero-banners', label: 'Hero Banners', icon: <Monitor size={18} /> },
    { href: '/admin/rooms', label: 'Rooms', icon: <Building size={18} /> },
    { href: '/admin/products', label: 'Products', icon: <ShoppingBag size={18} /> },
    { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { href: '/admin/vendors', label: 'Vendors', icon: <Package size={18} /> },
    { href: '/admin/database', label: 'Database', icon: <Database size={18} /> },
    { href: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    { href: '/admin/logs', label: 'System Logs', icon: <AlertTriangle size={18} /> },
    { href: '/admin/profiles', label: 'Company Profile', icon: <Settings size={18} /> },
    { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-200">
                <Link href="/admin" className="text-xl font-bold text-primary-red">
                  Admin Portal
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
                  <Link href="/admin/products/new" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">➕</span> Add New Product
                  </Link>
                </li>
                <li>
                  <Link href="/admin/vendors/new" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">➕</span> Add New Vendor
                  </Link>
                </li>
                <li>
                  <Link href="/admin/orders?status=pending" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">⏱️</span> View Pending Orders
                  </Link>
                </li>
                <li>
                  <Link href="/admin/users/new" className="text-primary-red hover:text-primary-dark flex items-center">
                    <span className="mr-2">➕</span> Add New User
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
