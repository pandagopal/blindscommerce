'use client';

import Link from 'next/link';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { redirect, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home, ShoppingCart, Package, Users, MessageSquare,
  Settings, LogOut, BarChart3, UserCheck
} from 'lucide-react';

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !hasRole(currentUser, ['admin', 'sales'])) {
          router.push('/login?redirect=/sales');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        router.push('/login?redirect=/sales');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <Link href="/sales" className="flex items-center">
              <span className="font-bold text-xl text-primary-red">Sales Portal</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              <li>
                <Link href="/sales" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Home className="mr-3 h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/sales/leads" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Users className="mr-3 h-5 w-5" />
                  <span>Leads</span>
                </Link>
              </li>
              <li>
                <Link href="/sales/orders" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  <span>Orders</span>
                </Link>
              </li>
              <li>
                <Link href="/sales/quotes" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Package className="mr-3 h-5 w-5" />
                  <span>Quotes</span>
                </Link>
              </li>
              <li>
                <Link href="/sales/analytics" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <BarChart3 className="mr-3 h-5 w-5" />
                  <span>Analytics</span>
                </Link>
              </li>
              <li>
                <Link href="/sales/assistance" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <UserCheck className="mr-3 h-5 w-5" />
                  <span>Customer Assistance</span>
                </Link>
              </li>
              <li>
                <Link href="/sales/support" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <MessageSquare className="mr-3 h-5 w-5" />
                  <span>Support</span>
                </Link>
              </li>
            </ul>

            <hr className="my-4" />

            <ul className="space-y-1">
              <li>
                <Link href="/sales/settings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Settings className="mr-3 h-5 w-5" />
                  <span>Settings</span>
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Log out</span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-red text-white flex items-center justify-center">
                {user?.firstName?.charAt(0) || 'S'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Sales Representative</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <Link href="/sales" className="font-bold text-lg text-primary-red">
            Sales Portal
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
