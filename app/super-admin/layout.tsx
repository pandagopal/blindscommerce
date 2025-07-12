'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Users,
  Database,
  Settings,
  BarChart3,
  DollarSign,
  Lock,
  Server,
  Activity,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/super-admin',
    icon: Shield,
    current: true
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    current: false
  },
  {
    name: 'System Settings',
    href: '/super-admin/system',
    icon: Settings,
    current: false
  },
  {
    name: 'Database Admin',
    href: '/super-admin/database',
    icon: Database,
    current: false
  },
  {
    name: 'Security Center',
    href: '/super-admin/security',
    icon: Lock,
    current: false
  },
  {
    name: 'Financial Overview',
    href: '/super-admin/financials',
    icon: DollarSign,
    current: false
  },
  {
    name: 'System Analytics',
    href: '/super-admin/analytics',
    icon: BarChart3,
    current: false
  },
  {
    name: 'Server Monitor',
    href: '/super-admin/monitoring',
    icon: Server,
    current: false
  },
  {
    name: 'Activity Logs',
    href: '/super-admin/logs',
    icon: FileText,
    current: false
  }
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (res.ok) {
          const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'super_admin') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login?redirect=/super-admin');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login?redirect=/super-admin');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Super Admin Portal</h1>
                <p className="text-sm text-gray-500">Complete system control and monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.firstName 
                    ? user.firstName 
                    : user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <Link
                href="/admin"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-red"
              >
                Regular Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <nav className="w-64 flex-shrink-0 mr-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-3 py-2 text-sm font-medium rounded-md border border-transparent transition-colors`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                        } flex-shrink-0 -ml-1 mr-3 h-5 w-5`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* System Status Widget */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Server</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Database</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Security</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    3 Alerts
                  </span>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}