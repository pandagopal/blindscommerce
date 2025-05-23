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

interface Material {
  id: number;
  name: string;
  quantity: number;
  status: string;
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
  const [editingMatId, setEditingMatId] = useState<number | null>(null);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const m = localStorage.getItem('installer_materials');
      if (m) setMaterials(JSON.parse(m));
    }
  }, []);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('installer_materials', JSON.stringify(materials)); }, [materials]);

  // Material handlers
  const handleMatChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setMatForm({ ...matForm, [e.target.name]: e.target.value });
  const handleMatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matForm.name || !matForm.quantity) return;
    if (editingMatId) {
      setMaterials((prev) => prev.map((m) => m.id === editingMatId ? { ...m, ...matForm, quantity: Number(matForm.quantity) } as Material : m));
      setEditingMatId(null);
    } else {
      setMaterials((prev) => [...prev, { ...matForm, id: Date.now(), quantity: Number(matForm.quantity) } as Material]);
    }
    setMatForm({ name: '', quantity: 1, status: 'in stock' });
  };
  const handleMatEdit = (id: number) => { const m = materials.find((m) => m.id === id); if (m) { setMatForm(m); setEditingMatId(id); } };
  const handleMatDelete = (id: number) => { setMaterials((prev) => prev.filter((m) => m.id !== id)); if (editingMatId === id) { setMatForm({ name: '', quantity: 1, status: 'in stock' }); setEditingMatId(null); } };

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

      {/* Material Tracking Section */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Material Tracking</h2>
        <form onSubmit={handleMatSubmit} className="flex gap-2 mb-4 flex-wrap">
          <input name="name" value={matForm.name || ''} onChange={handleMatChange} placeholder="Material Name" className="border p-2 rounded" required />
          <input name="quantity" type="number" min="1" value={matForm.quantity || 1} onChange={handleMatChange} placeholder="Quantity" className="border p-2 rounded w-24" required />
          <select name="status" value={matForm.status || 'in stock'} onChange={handleMatChange} className="border p-2 rounded">
            <option value="in stock">In Stock</option>
            <option value="used">Used</option>
            <option value="ordered">Ordered</option>
          </select>
          <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark">{editingMatId ? 'Update' : 'Add'}</button>
          {editingMatId && <button type="button" onClick={() => { setMatForm({ name: '', quantity: 1, status: 'in stock' }); setEditingMatId(null); }} className="text-gray-600 underline ml-2">Cancel</button>}
        </form>
        {materials.length === 0 ? <p className="text-gray-600">No materials tracked.</p> : (
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="flex gap-4 items-center">
                <span className="font-medium w-48">{m.name}</span>
                <span>Qty: {m.quantity}</span>
                <span className="text-xs text-gray-500">{m.status}</span>
                <button onClick={() => handleMatEdit(m.id)} className="text-blue-600 hover:underline ml-2">Edit</button>
                <button onClick={() => handleMatDelete(m.id)} className="text-red-600 hover:underline ml-2">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
