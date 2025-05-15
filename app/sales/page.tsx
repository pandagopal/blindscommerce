'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign, Users, Phone, Mail,
  ArrowUpRight, TrendingUp, Calendar,
  BarChart3, ShoppingCart, Clock
} from 'lucide-react';

// Types for the leads and sales data
interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
  date: string;
  source: string;
}

interface SalesPerformance {
  dailyTarget: number;
  dailyAchieved: number;
  monthlyTarget: number;
  monthlyAchieved: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: string;
}

interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function SalesDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [performance, setPerformance] = useState<SalesPerformance>({
    dailyTarget: 0,
    dailyAchieved: 0,
    monthlyTarget: 0,
    monthlyAchieved: 0,
    conversionRate: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'sales') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login?redirect=/sales');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    // In a real app, this would fetch data from an API
    const fetchDashboardData = async () => {
      try {
        // Mock leads data
        const mockLeads = [
          {
            id: 1,
            name: 'John Davis',
            email: 'john@example.com',
            phone: '(555) 123-4567',
            status: 'new' as const,
            date: '2023-10-18',
            source: 'Website'
          },
          {
            id: 2,
            name: 'Emily Wilson',
            email: 'emily@example.com',
            phone: '(555) 987-6543',
            status: 'contacted' as const,
            date: '2023-10-17',
            source: 'Referral'
          },
          {
            id: 3,
            name: 'Michael Brown',
            email: 'michael@example.com',
            phone: '(555) 456-7890',
            status: 'qualified' as const,
            date: '2023-10-16',
            source: 'Google Ads'
          },
          {
            id: 4,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '(555) 321-6547',
            status: 'proposal' as const,
            date: '2023-10-15',
            source: 'Facebook'
          },
          {
            id: 5,
            name: 'Robert Miller',
            email: 'robert@example.com',
            phone: '(555) 889-7410',
            status: 'closed' as const,
            date: '2023-10-14',
            source: 'Direct Mail'
          },
        ];
        setLeads(mockLeads);

        // Mock recent orders
        const mockOrders = [
          {
            id: 'SBH-10584',
            customer: 'Robert Miller',
            date: '2023-10-14',
            total: 849.99,
            status: 'Completed'
          },
          {
            id: 'SBH-10572',
            customer: 'Jennifer Adams',
            date: '2023-10-13',
            total: 1245.50,
            status: 'Processing'
          },
          {
            id: 'SBH-10568',
            customer: 'William Clark',
            date: '2023-10-12',
            total: 478.75,
            status: 'Shipped'
          },
        ];
        setRecentOrders(mockOrders);

        // Mock performance data
        setPerformance({
          dailyTarget: 5000,
          dailyAchieved: 3250,
          monthlyTarget: 100000,
          monthlyAchieved: 85450,
          conversionRate: 28,
          averageOrderValue: 785.50
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-purple-100 text-purple-800';
      case 'qualified':
        return 'bg-amber-100 text-amber-800';
      case 'proposal':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Sales Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
          <p className="text-3xl font-bold">{formatCurrency(performance.dailyAchieved)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Monthly Target</h3>
          <p className="text-3xl font-bold">{formatCurrency(performance.monthlyTarget)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Leads</h3>
          <p className="text-3xl font-bold">{leads.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold">{performance.conversionRate}%</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
          <p className="text-gray-500">No recent sales</p>
        </div>

        {/* Active Leads */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Active Leads</h2>
          <p className="text-gray-500">No active leads</p>
        </div>
      </div>
    </div>
  );
}
