'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Package, Wrench, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Appointment {
  id: string;
  customerName: string;
  address: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'installation' | 'measurement' | 'repair';
}

interface Job {
  id: string;
  customerName: string;
  address: string;
  status: 'pending' | 'in-progress' | 'completed';
  type: 'installation' | 'repair';
  materials: Material[];
  notes: string;
  createdAt: string;
  completedAt?: string;
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  status: 'in stock' | 'low stock' | 'out of stock';
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matForm, setMatForm] = useState<Partial<Material>>({ name: '', quantity: 1, status: 'in stock' });
  const [editingMatId, setEditingMatId] = useState<string | null>(null);

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
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch appointments
      const appointmentsRes = await fetch('/api/installer/appointments');
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        // Handle both array and object responses
        const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.appointments || []);
        
        const today = new Date().toISOString().split('T')[0];
        const todayApps = appointments.filter((app: Appointment) => 
          app.date === today && app.status !== 'cancelled'
        );
        const upcomingApps = appointments.filter((app: Appointment) => 
          app.date > today && app.status !== 'cancelled'
        );

        setTodayAppointments(todayApps);
        setUpcomingAppointments(upcomingApps);
      }

      // Fetch jobs
      const jobsRes = await fetch('/api/installer/jobs');
      if (jobsRes.ok) {
        const jobsResponse = await jobsRes.json();
        // Handle both array and object responses
        const jobsData = Array.isArray(jobsResponse) ? jobsResponse : (jobsResponse.jobs || []);
        setRecentJobs(jobsData);

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const completedToday = jobsData.filter((job: Job) => 
          job.status === 'completed' && 
          job.completedAt && new Date(job.completedAt).toISOString().split('T')[0] === today
        ).length;

        const pendingJobs = jobsData.filter((job: Job) => 
          job.status === 'pending'
        ).length;

        const completedJobs = jobsData.filter((job: Job) => 
          job.status === 'completed'
        ).length;

        const todayApps = (await fetch('/api/installer/appointments').then(res => res.json()).catch(() => [])) || [];
        
        setStats({
          completedToday,
          scheduledToday: Array.isArray(todayApps) ? todayApps.filter((app: any) => 
            app.date === today && app.status !== 'cancelled'
          ).length : 0,
          pendingJobs,
          completedJobs
        });
      }

      // Fetch materials
      const materialsRes = await fetch('/api/installer/materials');
      if (materialsRes.ok) {
        const materialsData = await materialsRes.json();
        // Handle both array and object responses
        const materials = Array.isArray(materialsData) ? materialsData : (materialsData.materials || []);
        setMaterials(materials);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty defaults on error
      setTodayAppointments([]);
      setUpcomingAppointments([]);
      setRecentJobs([]);
      setMaterials([]);
      setStats({
        completedToday: 0,
        scheduledToday: 0,
        pendingJobs: 0,
        completedJobs: 0
      });
    }
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMatId 
        ? `/api/installer/materials/${editingMatId}`
        : '/api/installer/materials';
      
      const method = editingMatId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matForm)
      });

      if (res.ok) {
        fetchDashboardData();
        setMatForm({ name: '', quantity: 1, status: 'in stock' });
        setEditingMatId(null);
      }
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleMaterialEdit = (material: Material) => {
    setMatForm(material);
    setEditingMatId(material.id);
  };

  const handleMaterialDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/installer/materials/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      const res = await fetch(`/api/installer/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleJobStatus = async (id: string, status: Job['status']) => {
    try {
      const res = await fetch(`/api/installer/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : undefined
        })
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading installer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto p-6">
      <div className="grid gap-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.scheduledToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingJobs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedJobs || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(todayAppointments || []).map(appointment => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{appointment.customerName}</h4>
                          <Badge variant={
                            appointment.status === 'scheduled' ? 'default' :
                            appointment.status === 'in-progress' ? 'secondary' :
                            appointment.status === 'completed' ? 'success' : 'destructive'
                          }>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.time}</span>
                          <MapPin className="h-4 w-4 ml-2" />
                          <span>{appointment.address}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {appointment.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            onClick={() => handleAppointmentStatus(appointment.id, 'in-progress')}
                          >
                            Start
                          </Button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <Button
                            variant="outline"
                            onClick={() => handleAppointmentStatus(appointment.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                        {appointment.status !== 'completed' && (
                          <Button
                            variant="outline"
                            onClick={() => handleAppointmentStatus(appointment.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(upcomingAppointments || []).map(appointment => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{appointment.customerName}</h4>
                          <Badge variant="default">{appointment.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{appointment.date}</span>
                          <Clock className="h-4 w-4 ml-2" />
                          <span>{appointment.time}</span>
                          <MapPin className="h-4 w-4 ml-2" />
                          <span>{appointment.address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(recentJobs || []).map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{job.customerName}</h4>
                          <Badge variant={
                            job.status === 'pending' ? 'default' :
                            job.status === 'in-progress' ? 'secondary' :
                            'success'
                          }>
                            {job.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{job.address}</span>
                          <Package className="h-4 w-4 ml-2" />
                          <span>{job.type}</span>
                        </div>
                        {job.notes && (
                          <p className="text-sm text-muted-foreground">{job.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {job.status === 'pending' && (
                          <Button
                            variant="outline"
                            onClick={() => handleJobStatus(job.id, 'in-progress')}
                          >
                            Start
                          </Button>
                        )}
                        {job.status === 'in-progress' && (
                          <Button
                            variant="outline"
                            onClick={() => handleJobStatus(job.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Materials Management</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMaterialSubmit} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Material name"
                      value={matForm.name}
                      onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={matForm.quantity}
                      onChange={(e) => setMatForm({ ...matForm, quantity: parseInt(e.target.value) })}
                    />
                    <Select
                      value={matForm.status}
                      onValueChange={(value: Material['status']) => 
                        setMatForm({ ...matForm, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in stock">In Stock</SelectItem>
                        <SelectItem value="low stock">Low Stock</SelectItem>
                        <SelectItem value="out of stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit">
                    {editingMatId ? 'Update Material' : 'Add Material'}
                  </Button>
                </form>

                <div className="space-y-4">
                  {(materials || []).map(material => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{material.name}</h4>
                          <Badge variant={
                            material.status === 'in stock' ? 'success' :
                            material.status === 'low stock' ? 'warning' :
                            'destructive'
                          }>
                            {material.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {material.quantity}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleMaterialEdit(material)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMaterialDelete(material.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}
