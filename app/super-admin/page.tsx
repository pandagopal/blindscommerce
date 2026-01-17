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
  AlertTriangle,
  Activity,
  Server,
  Lock,
  Globe,
  Zap,
  UserCheck,
  Building,
  ShoppingCart,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalVendors: number;
  totalOrders: number;
  totalRevenue: number;
  systemUptime: string;
  serverHealth: 'excellent' | 'good' | 'warning' | 'critical';
  databaseSize: string;
  lastBackup: string;
  securityAlerts: number;
  apiRequests24h: number;
}

interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface SecurityAlert {
  id: number;
  type: 'login_attempt' | 'permission_violation' | 'suspicious_activity' | 'system_error';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalOrders: 0,
    totalRevenue: 0,
    systemUptime: '0 days',
    serverHealth: 'good',
    databaseSize: '0 MB',
    lastBackup: 'Unknown',
    securityAlerts: 0,
    apiRequests24h: 0
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

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

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch system statistics
        const statsRes = await fetch('/api/v2/admin/stats');
        if (statsRes.ok) {
          const statsResult = await statsRes.json();
          if (statsResult.success) {
            setStats(statsResult.data);
          }
        }

        // Fetch security alerts
        const alertsRes = await fetch('/api/v2/admin/security-alerts');
        if (alertsRes.ok) {
          const alertsResult = await alertsRes.json();
          if (alertsResult.success) {
            setAlerts(alertsResult.data.alerts || []);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty stats on error
        setStats({
          totalUsers: 0,
          totalVendors: 0,
          totalOrders: 0,
          totalRevenue: 0,
          systemUptime: 'N/A',
          serverHealth: 'unknown',
          databaseSize: '0 GB',
          lastBackup: 'unknown',
          securityAlerts: 0,
          apiRequests24h: 0
        });

        // Fetch real alerts from API
        try {
          const alertsResponse = await fetch('/api/v2/admin/security-alerts');
          if (alertsResponse.ok) {
            const alertsData = await alertsResponse.json();
            setAlerts(alertsData.data || []);
          } else {
            setAlerts([]);
          }
        } catch (error) {
          console.error('Failed to fetch alerts:', error);
          setAlerts([]);
        }
      }
    };

    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const quickActions = [
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      description: 'Manage all users and permissions',
      color: 'bg-red-500'
    },
    {
      name: 'System Settings',
      href: '/super-admin/system',
      icon: Settings,
      description: 'Configure system-wide settings',
      color: 'bg-gray-500'
    },
    {
      name: 'Database Admin',
      href: '/super-admin/database',
      icon: Database,
      description: 'Database management and backups',
      color: 'bg-red-500'
    },
    {
      name: 'Security Center',
      href: '/super-admin/security',
      icon: Lock,
      description: 'Security monitoring and controls',
      color: 'bg-red-500'
    },
    {
      name: 'Financial Overview',
      href: '/super-admin/financials',
      icon: DollarSign,
      description: 'Revenue, commissions, and payments',
      color: 'bg-red-500'
    },
    {
      name: 'System Analytics',
      href: '/super-admin/analytics',
      icon: BarChart3,
      description: 'Platform performance and metrics',
      color: 'bg-orange-500'
    }
  ];

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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg shadow-sm text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Super Admin Dashboard
            </h1>
            <p className="text-red-100 mt-1">
              Welcome back, {user.firstName}! You have complete system control.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-12 w-12 text-white" />
            <div className="text-right">
              <p className="text-sm font-medium">System Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(stats.serverHealth)}`}>
                {stats.serverHealth.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => !a.resolved && a.severity === 'critical').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Critical Alerts Require Attention</h3>
          </div>
          <div className="mt-2 space-y-1">
            {alerts.filter(a => !a.resolved && a.severity === 'critical').map(alert => (
              <p key={alert.id} className="text-sm text-red-700">{alert.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVendors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-primary-red" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-red border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`${action.color} rounded-lg inline-flex p-3 text-white`}>
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <Server className="h-4 w-4 mr-2" />
                System Uptime
              </span>
              <span className="text-sm font-medium text-gray-900">{stats.systemUptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Database Size
              </span>
              <span className="text-sm font-medium text-gray-900">{stats.databaseSize}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Last Backup
              </span>
              <span className="text-sm font-medium text-gray-900">{stats.lastBackup}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                API Requests (24h)
              </span>
              <span className="text-sm font-medium text-gray-900">{stats.apiRequests24h.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Security Alerts</h2>
            <Link
              href="/super-admin/security"
              className="text-sm text-primary-red hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500">No security alerts</p>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {alert.type === 'login_attempt' && <UserCheck className="h-4 w-4 text-yellow-600" />}
                    {alert.type === 'suspicious_activity' && <Eye className="h-4 w-4 text-orange-600" />}
                    {alert.type === 'system_error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {alert.type === 'permission_violation' && <Lock className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{alert.timestamp}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {alert.resolved && (
                        <span className="text-xs text-green-600">Resolved</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}