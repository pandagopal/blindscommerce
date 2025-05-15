'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, CheckSquare, MapPin, Clock,
  ArrowUpRight, Truck, AlertTriangle,
  Phone, MessageSquare, Users
} from 'lucide-react';

// Types for the installer dashboard
interface Appointment {
  id: number;
  customer: string;
  address: string;
  date: string;
  time: string;
  jobType: 'measurement' | 'installation' | 'repair';
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
}

interface Job {
  id: string;
  customer: string;
  address: string;
  date: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'issue';
  products: string[];
}

interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function InstallerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    completedToday: 0,
    scheduledToday: 0,
    pendingJobs: 0,
    completedJobs: 0
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'installer') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login?redirect=/installer');
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
        // Mock data for today's appointments
        const mockTodayAppointments = [
          {
            id: 1,
            customer: 'John Smith',
            address: '123 Main St, Seattle, WA 98101',
            date: '2023-10-20',
            time: '09:00 AM',
            jobType: 'installation' as const,
            status: 'scheduled' as const
          },
          {
            id: 2,
            customer: 'Emily Johnson',
            address: '456 Oak Ave, Seattle, WA 98102',
            date: '2023-10-20',
            time: '11:30 AM',
            jobType: 'measurement' as const,
            status: 'scheduled' as const
          },
          {
            id: 3,
            customer: 'Michael Davis',
            address: '789 Pine St, Seattle, WA 98103',
            date: '2023-10-20',
            time: '02:00 PM',
            jobType: 'installation' as const,
            status: 'in-progress' as const
          }
        ];
        setTodayAppointments(mockTodayAppointments);

        // Mock data for upcoming appointments
        const mockUpcomingAppointments = [
          {
            id: 4,
            customer: 'Sarah Wilson',
            address: '321 Elm St, Seattle, WA 98104',
            date: '2023-10-21',
            time: '10:00 AM',
            jobType: 'installation' as const,
            status: 'scheduled' as const
          },
          {
            id: 5,
            customer: 'Robert Brown',
            address: '654 Maple Ave, Seattle, WA 98105',
            date: '2023-10-22',
            time: '01:30 PM',
            jobType: 'repair' as const,
            status: 'scheduled' as const
          },
          {
            id: 6,
            customer: 'Jennifer Miller',
            address: '987 Cedar Blvd, Seattle, WA 98106',
            date: '2023-10-23',
            time: '09:30 AM',
            jobType: 'measurement' as const,
            status: 'scheduled' as const
          }
        ];
        setUpcomingAppointments(mockUpcomingAppointments);

        // Mock data for recent jobs
        const mockRecentJobs = [
          {
            id: 'JOB-10245',
            customer: 'Lisa Taylor',
            address: '753 Birch St, Seattle, WA 98107',
            date: '2023-10-19',
            description: 'Install 4 cellular shades in bedroom and living room',
            status: 'completed' as const,
            products: ['Premium Cellular Shades (2)', 'Blackout Cellular Shades (2)']
          },
          {
            id: 'JOB-10243',
            customer: 'Daniel Wilson',
            address: '159 Spruce Ave, Seattle, WA 98108',
            date: '2023-10-18',
            description: 'Install wooden blinds in kitchen and dining room',
            status: 'completed' as const,
            products: ['Premium Wooden Blinds (3)']
          },
          {
            id: 'JOB-10240',
            customer: 'Karen Martinez',
            address: '357 Oak Lane, Seattle, WA 98109',
            date: '2023-10-17',
            description: 'Repair motorized blinds in home office',
            status: 'issue' as const,
            products: ['Motorized Roller Blinds (1)']
          }
        ];
        setRecentJobs(mockRecentJobs);

        // Mock statistics
        setStats({
          completedToday: 1,
          scheduledToday: 3,
          pendingJobs: 8,
          completedJobs: 42
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-purple-100 text-purple-800';
      case 'issue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get job type badge color
  const getJobTypeColor = (jobType: string) => {
    switch (jobType.toLowerCase()) {
      case 'measurement':
        return 'bg-purple-100 text-purple-800';
      case 'installation':
        return 'bg-blue-100 text-blue-800';
      case 'repair':
        return 'bg-amber-100 text-amber-800';
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
      <h1 className="text-3xl font-bold mb-8">Installer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Pending Jobs</h3>
          <p className="text-3xl font-bold">{stats.pendingJobs}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Completed Jobs</h3>
          <p className="text-3xl font-bold">{stats.completedJobs}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Today's Schedule</h3>
          <p className="text-3xl font-bold">{stats.scheduledToday}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Rating</h3>
          <p className="text-3xl font-bold">5.0</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Installations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Upcoming Installations</h2>
          <p className="text-gray-500">No installations scheduled</p>
        </div>

        {/* Recent Completions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Completions</h2>
          <p className="text-gray-500">No recent completions</p>
        </div>
      </div>
    </div>
  );
}
