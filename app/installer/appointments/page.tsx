'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Phone, CheckCircle, XCircle, Play } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string;
  customerName: string;
  address: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'installation' | 'measurement' | 'repair';
  phone?: string;
  notes?: string;
}

export default function InstallerAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/appointments');
          return;
        }
        const result = await res.json();
        const data = result.data || result;
        if (data.user.role !== 'installer') {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/installer/appointments');
        return;
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/installer/appointments');
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch appointments');
      }
      const data = result.data;
      if (Array.isArray(data)) {
        setAppointments(data);
      } else if (data?.profileMissing) {
        setError(data.message || 'Your installer profile is not set up yet. Please contact an administrator.');
        setAppointments([]);
      } else {
        setAppointments(data?.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: Appointment['status']) => {
    try {
      const res = await fetch(`/api/installer/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        throw new Error('Failed to update appointment status');
      }

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === id ? { ...apt, status } : apt
        )
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment status');
    }
  };

  const filterAppointmentsByStatus = (status: string) => {
    if (status === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return appointments.filter(apt => apt.date === today && apt.status !== 'cancelled');
    }
    if (status === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      return appointments.filter(apt => apt.date > today && apt.status !== 'cancelled');
    }
    return appointments.filter(apt => apt.status === status);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'installation': 'bg-purple-100 text-purple-800',
      'measurement': 'bg-indigo-100 text-indigo-800',
      'repair': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAppointments}>Try Again</Button>
        </div>
      </div>
    );
  }

  const todayCount = filterAppointmentsByStatus('today').length;
  const upcomingCount = filterAppointmentsByStatus('upcoming').length;
  const completedCount = filterAppointmentsByStatus('completed').length;
  const cancelledCount = filterAppointmentsByStatus('cancelled').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-lg font-bold">{todayCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Upcoming</p>
                <p className="text-lg font-bold">{upcomingCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-lg font-bold">{completedCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="text-lg font-bold">{cancelledCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs with Tables */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="today" className="text-sm">Today ({todayCount})</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-sm">Upcoming ({upcomingCount})</TabsTrigger>
            <TabsTrigger value="completed" className="text-sm">Completed ({completedCount})</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-sm">Cancelled ({cancelledCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <AppointmentsTable
              appointments={filterAppointmentsByStatus('today')}
              onStatusUpdate={handleStatusUpdate}
              showActions={true}
              getStatusColor={getStatusColor}
              getTypeColor={getTypeColor}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="upcoming">
            <AppointmentsTable
              appointments={filterAppointmentsByStatus('upcoming')}
              onStatusUpdate={handleStatusUpdate}
              showActions={false}
              getStatusColor={getStatusColor}
              getTypeColor={getTypeColor}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="completed">
            <AppointmentsTable
              appointments={filterAppointmentsByStatus('completed')}
              onStatusUpdate={handleStatusUpdate}
              showActions={false}
              getStatusColor={getStatusColor}
              getTypeColor={getTypeColor}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="cancelled">
            <AppointmentsTable
              appointments={filterAppointmentsByStatus('cancelled')}
              onStatusUpdate={handleStatusUpdate}
              showActions={false}
              getStatusColor={getStatusColor}
              getTypeColor={getTypeColor}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AppointmentsTableProps {
  appointments: Appointment[];
  onStatusUpdate: (id: string, status: Appointment['status']) => void;
  showActions: boolean;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
  formatDate: (date: string) => string;
}

function AppointmentsTable({ appointments, onStatusUpdate, showActions, getStatusColor, getTypeColor, formatDate }: AppointmentsTableProps) {
  if (appointments.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No appointments found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Customer</th>
              <th className="text-left p-3 font-medium text-gray-600">Address</th>
              <th className="text-left p-3 font-medium text-gray-600">Date</th>
              <th className="text-left p-3 font-medium text-gray-600">Time</th>
              <th className="text-left p-3 font-medium text-gray-600">Type</th>
              <th className="text-left p-3 font-medium text-gray-600">Status</th>
              <th className="text-left p-3 font-medium text-gray-600">Phone</th>
              {showActions && <th className="text-center p-3 font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((apt) => (
              <tr key={apt.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-gray-900">{apt.customerName}</div>
                  {apt.notes && (
                    <div className="text-xs text-gray-500 truncate max-w-[150px]" title={apt.notes}>
                      {apt.notes}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[200px]" title={apt.address}>{apt.address}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-600">{formatDate(apt.date)}</td>
                <td className="p-3 text-gray-600">{apt.time}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(apt.type)}`}>
                    {apt.type}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </td>
                <td className="p-3">
                  {apt.phone && (
                    <a href={`tel:${apt.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-primary-red">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs">{apt.phone}</span>
                    </a>
                  )}
                </td>
                {showActions && (
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {apt.status === 'scheduled' && (
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => onStatusUpdate(apt.id, 'in-progress')}
                        >
                          <Play className="h-3 w-3 mr-1" /> Start
                        </Button>
                      )}
                      {apt.status === 'in-progress' && (
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => onStatusUpdate(apt.id, 'completed')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Complete
                        </Button>
                      )}
                      {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => onStatusUpdate(apt.id, 'cancelled')}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
