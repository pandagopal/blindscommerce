'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Home, Calendar, Hammer, Map, CheckSquare,
  FileText, Settings, LogOut, Users, User, ChevronRight, Shield
} from 'lucide-react';

interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

function InstallerLayoutContent({
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
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/installer');
        return;
      }
      if (user.role !== 'installer' && user.role !== 'admin') {
        router.push('/');
        return;
      }
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

  if (!user || (user.role !== 'installer' && user.role !== 'admin')) {
    return null;
  }

  const menuItems = [
    { href: '/installer', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/installer/appointments', label: 'Appointments', icon: <Calendar size={18} /> },
    { href: '/installer/jobs', label: 'Jobs', icon: <Hammer size={18} /> },
    { href: '/installer/routes', label: 'Routes', icon: <Map size={18} /> },
    { href: '/installer/customers', label: 'Customers', icon: <Users size={18} /> },
    { href: '/installer/completed', label: 'Completed Jobs', icon: <CheckSquare size={18} /> },
    { href: '/installer/reports', label: 'Reports', icon: <FileText size={18} /> },
    { href: '/installer/settings', label: 'Settings', icon: <Settings size={18} /> },
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
                  <Link href="/installer" className="text-xl font-bold text-primary-red">
                    Installer Portal
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
                      {user?.firstName ? `${user.firstName}` : user?.email?.split('@')[0]}
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
                        : 'text-gray-600 hover:bg-gray-50'
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
                  <Link href="/installer/appointments" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">📅</span> View Appointments
                  </Link>
                </li>
                <li>
                  <Link href="/installer/jobs" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">🔨</span> Active Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/installer/routes" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">🗺️</span> Plan Routes
                  </Link>
                </li>
                <li>
                  <Link href="/installer/reports" className="text-red-600 hover:text-red-700 flex items-center">
                    <span className="mr-2">📊</span> View Reports
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

export default function InstallerLayout({
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
      <InstallerLayoutContent>
        {children}
      </InstallerLayoutContent>
    </Suspense>
  );
}