'use client';

import { useState, useEffect } from 'react';
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

export default function InstallerDashboard() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedToday: 0,
    scheduledToday: 0,
    pendingJobs: 0,
    completedJobs: 0
  });

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
      } finally {
        setLoading(false);
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
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Installer Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's your schedule for today.</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-blue-100 mr-4">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
              <h3 className="text-xl font-bold">{stats.scheduledToday}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link
              href="/installer/appointments?date=today"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              View all appointments
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-green-100 mr-4">
              <CheckSquare size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <h3 className="text-xl font-bold">{stats.completedToday}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link
              href="/installer/completed?date=today"
              className="text-green-600 hover:text-green-800 flex items-center"
            >
              View completed jobs
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-amber-100 mr-4">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Jobs</p>
              <h3 className="text-xl font-bold">{stats.pendingJobs}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link
              href="/installer/jobs?status=pending"
              className="text-amber-600 hover:text-amber-800 flex items-center"
            >
              View pending jobs
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-purple-100 mr-4">
              <Truck size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Completed</p>
              <h3 className="text-xl font-bold">{stats.completedJobs}</h3>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link
              href="/installer/reports"
              className="text-purple-600 hover:text-purple-800 flex items-center"
            >
              View your performance
              <ArrowUpRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow border border-gray-100 p-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Today's Appointments</h2>
          <Link
            href="/installer/appointments"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <Calendar size={14} className="mr-1" />
            View Calendar
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mb-4">
              <CheckSquare size={40} className="text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No appointments for today</h3>
            <p className="text-gray-500 mt-1">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map(appointment => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{appointment.customer}</h3>
                    <div className="text-sm text-gray-500 flex items-start mt-1">
                      <MapPin size={16} className="mr-1 flex-shrink-0 mt-0.5" />
                      <span>{appointment.address}</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getJobTypeColor(appointment.jobType)}`}>
                        {appointment.jobType.charAt(0).toUpperCase() + appointment.jobType.slice(1)}
                      </span>
                      <span className="mx-2">•</span>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{appointment.time}</div>
                    <div className="flex mt-4 space-x-2">
                      <Link
                        href={`/installer/appointments/${appointment.id}`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                      >
                        Details
                      </Link>
                      <Link
                        href={`tel:+1234567890`} // This would normally come from the API
                        className="p-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      >
                        <Phone size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Appointments and Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Upcoming Appointments</h2>
            <Link
              href="/installer/appointments"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map(appointment => (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{appointment.customer}</h3>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(appointment.date)} at {appointment.time}</p>
                    </div>
                    <div className="flex items-start">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getJobTypeColor(appointment.jobType)}`}>
                        {appointment.jobType.charAt(0).toUpperCase() + appointment.jobType.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Recent Jobs</h2>
            <Link
              href="/installer/jobs"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">No recent jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map(job => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium">{job.customer}</h3>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-sm text-gray-500">{job.id}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(job.date)}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  {job.status === 'issue' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md flex items-start">
                      <AlertTriangle size={16} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">
                        Reported issue with installation. Needs follow-up.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/installer/jobs/start"
          className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg p-4 transition-colors"
        >
          <Truck size={20} className="mr-2" />
          <span>Start New Job</span>
        </Link>

        <Link
          href="/installer/customers"
          className="flex items-center justify-center bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg p-4 transition-colors"
        >
          <Users size={20} className="mr-2" />
          <span>Customer Directory</span>
        </Link>

        <Link
          href="/installer/support"
          className="flex items-center justify-center bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg p-4 transition-colors"
        >
          <MessageSquare size={20} className="mr-2" />
          <span>Contact Support</span>
        </Link>
      </div>
    </div>
  );
}
