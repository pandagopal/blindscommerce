'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRoleAuth } from '@/lib/hooks/useRoleAuth';
import {
  LayoutDashboard,
  Package,
  Truck,
  MapPin,
  Clock,
  Calendar,
  FileText,
  BarChart,
  Settings,
  HelpCircle,
  Menu,
  X,
  Navigation,
  AlertCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/shipping', icon: LayoutDashboard },
  { name: 'Active Shipments', href: '/shipping/active', icon: Package },
  { name: 'Pickup Schedule', href: '/shipping/pickups', icon: Truck },
  { name: 'Delivery Routes', href: '/shipping/routes', icon: Navigation },
  { name: 'Tracking', href: '/shipping/tracking', icon: MapPin },
  { name: 'Schedule', href: '/shipping/schedule', icon: Calendar },
  { name: 'Pending Tasks', href: '/shipping/pending', icon: AlertCircle },
  { name: 'Delivery History', href: '/shipping/history', icon: Clock },
  { name: 'Reports', href: '/shipping/reports', icon: FileText },
  { name: 'Performance', href: '/shipping/performance', icon: BarChart },
  { name: 'Settings', href: '/shipping/settings', icon: Settings },
  { name: 'Help & Support', href: '/shipping/help', icon: HelpCircle },
];

export default function ShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthorized, isLoading, user } = useRoleAuth('shipping_agent');
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.push('/auth/login?redirect=/shipping');
    }
  }, [isAuthorized, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)}></div>
          </div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-xl font-bold text-primary-red">Shipping Portal</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <item.icon className="mr-4 flex-shrink-0 h-6 w-6" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-xl font-bold text-primary-red">Shipping Portal</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Shipping Agent Info */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                    Shipping Agent
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-red lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  {/* You can add a search bar here if needed */}
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Quick actions */}
              <Link
                href="/shipping/tracking/new"
                className="bg-primary-red text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-red-dark transition-colors"
              >
                Track Shipment
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}