'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        const data = result.data || result;if (data.user.role !== 'installer') {
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
      // Handle both array and object response formats
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

      // Update local state
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
    switch (status) {
      case 'scheduled': return 'default';
      case 'in-progress': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAppointments}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
            Appointments
          </h1>
          <p className="text-gray-600">Manage your installation and service appointments</p>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="bg-white border border-red-100">
            <TabsTrigger value="today">Today ({filterAppointmentsByStatus('today').length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({filterAppointmentsByStatus('upcoming').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({filterAppointmentsByStatus('completed').length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({filterAppointmentsByStatus('cancelled').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Today's Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentsList 
                  appointments={filterAppointmentsByStatus('today')} 
                  onStatusUpdate={handleStatusUpdate}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentsList 
                  appointments={filterAppointmentsByStatus('upcoming')} 
                  onStatusUpdate={handleStatusUpdate}
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Completed Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentsList 
                  appointments={filterAppointmentsByStatus('completed')} 
                  onStatusUpdate={handleStatusUpdate}
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled">
            <Card className="border-red-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-r from-primary-red to-primary-dark bg-clip-text text-transparent">
                  Cancelled Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentsList 
                  appointments={filterAppointmentsByStatus('cancelled')} 
                  onStatusUpdate={handleStatusUpdate}
                  showActions={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AppointmentsListProps {
  appointments: Appointment[];
  onStatusUpdate: (id: string, status: Appointment['status']) => void;
  showActions: boolean;
}

function AppointmentsList({ appointments, onStatusUpdate, showActions }: AppointmentsListProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No appointments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map(appointment => (
        <div
          key={appointment.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold text-lg">{appointment.customerName}</h3>
              <Badge variant={getStatusColor(appointment.status) as any}>
                {appointment.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{appointment.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{appointment.address}</span>
              </div>
            </div>

            {appointment.phone && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{appointment.phone}</span>
              </div>
            )}

            {appointment.notes && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Notes:</strong> {appointment.notes}
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 ml-4">
              {appointment.status === 'scheduled' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusUpdate(appointment.id, 'in-progress')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                >
                  Start
                </Button>
              )}
              {appointment.status === 'in-progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusUpdate(appointment.id, 'completed')}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                >
                  Complete
                </Button>
              )}
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusUpdate(appointment.id, 'cancelled')}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: string): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'scheduled': return 'default';
    case 'in-progress': return 'secondary';
    case 'completed': return 'success';
    case 'cancelled': return 'destructive';
    default: return 'default';
  }
}