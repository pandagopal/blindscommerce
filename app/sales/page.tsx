'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign, Users, Phone, Mail,
  ArrowUpRight, TrendingUp, Calendar,
  BarChart3, ShoppingCart, Clock, Shield
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

interface Appointment {
  id: number;
  customer: string;
  date: string;
  time: string;
  status: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

function SalesDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminViewUserId = searchParams.get('admin_view');
  const [user, setUser] = useState<User | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [viewedSalesPerson, setViewedSalesPerson] = useState<User | null>(null);
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
  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptForm, setApptForm] = useState<Partial<Appointment>>({ customer: '', date: '', time: '', status: 'scheduled' });
  const [editingApptId, setEditingApptId] = useState<number | null>(null);
  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custForm, setCustForm] = useState<Partial<Customer>>({ name: '', email: '', phone: '' });
  const [editingCustId, setEditingCustId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (res.ok) {
          const result = await res.json();
        const data = result.data || result;// Check if admin is viewing another user's dashboard
          if (adminViewUserId && data.user.role === 'admin') {
            setIsAdminView(true);
            setUser(data.user); // Keep admin user for permissions
            
            // Store AdminViewId in session
            sessionStorage.setItem('AdminViewId', adminViewUserId);
            
            // Fetch the sales person being viewed
            const salesRes = await fetch(`/api/v2/admin/users/${adminViewUserId}`);
            if (salesRes.ok) {
              const salesData = await salesRes.json();
              if (salesData.user.role !== 'sales') {
                alert('Selected user is not a sales person');
                router.push('/admin/users');
                return;
              }
              setViewedSalesPerson(salesData.user);
            } else {
              alert('Failed to fetch sales person information');
              router.push('/admin/users');
              return;
            }
          } else if (data.user.role !== 'sales') {
            router.push('/');
            return;
          } else {
            setUser(data.user);
            setViewedSalesPerson(data.user);
            // Clear admin view session if not in admin mode
            sessionStorage.removeItem('AdminViewId');
          }
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
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard data from API
        const response = await fetch('/api/v2/sales/dashboard');
        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads || []);
          setRecentOrders(data.recentOrders || []);
          setPerformance(data.performance || {
            dailyTarget: 0,
            dailyAchieved: 0,
            monthlyTarget: 0,
            monthlyAchieved: 0,
            conversionRate: 0,
            averageOrderValue: 0
          });
        } else {
          console.error('Failed to fetch dashboard data');
          setLeads([]);
          setRecentOrders([]);
          setPerformance({
            dailyTarget: 0,
            dailyAchieved: 0,
            monthlyTarget: 0,
            monthlyAchieved: 0,
            conversionRate: 0,
            averageOrderValue: 0
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const a = localStorage.getItem('sales_appointments');
      if (a) setAppointments(JSON.parse(a));
      const c = localStorage.getItem('sales_customers');
      if (c) setCustomers(JSON.parse(c));
    }
  }, []);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('sales_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('sales_customers', JSON.stringify(customers)); }, [customers]);

  // Appointment handlers
  const handleApptChange = (e: React.ChangeEvent<HTMLInputElement>) => setApptForm({ ...apptForm, [e.target.name]: e.target.value });
  const handleApptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptForm.customer || !apptForm.date || !apptForm.time) return;
    if (editingApptId) {
      setAppointments((prev) => prev.map((a) => a.id === editingApptId ? { ...a, ...apptForm } as Appointment : a));
      setEditingApptId(null);
    } else {
      setAppointments((prev) => [...prev, { ...apptForm, id: Date.now() } as Appointment]);
    }
    setApptForm({ customer: '', date: '', time: '', status: 'scheduled' });
  };
  const handleApptEdit = (id: number) => { const a = appointments.find((a) => a.id === id); if (a) { setApptForm(a); setEditingApptId(id); } };
  const handleApptDelete = (id: number) => { setAppointments((prev) => prev.filter((a) => a.id !== id)); if (editingApptId === id) { setApptForm({ customer: '', date: '', time: '', status: 'scheduled' }); setEditingApptId(null); } };

  // Customer handlers
  const handleCustChange = (e: React.ChangeEvent<HTMLInputElement>) => setCustForm({ ...custForm, [e.target.name]: e.target.value });
  const handleCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name || !custForm.email || !custForm.phone) return;
    if (editingCustId) {
      setCustomers((prev) => prev.map((c) => c.id === editingCustId ? { ...c, ...custForm } as Customer : c));
      setEditingCustId(null);
    } else {
      setCustomers((prev) => [...prev, { ...custForm, id: Date.now() } as Customer]);
    }
    setCustForm({ name: '', email: '', phone: '' });
  };
  const handleCustEdit = (id: number) => { const c = customers.find((c) => c.id === id); if (c) { setCustForm(c); setEditingCustId(id); } };
  const handleCustDelete = (id: number) => { setCustomers((prev) => prev.filter((c) => c.id !== id)); if (editingCustId === id) { setCustForm({ name: '', email: '', phone: '' }); setEditingCustId(null); } };

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
        return 'bg-red-100 text-red-800';
      case 'contacted':
        return 'bg-red-100 text-primary-dark';
      case 'qualified':
        return 'bg-amber-100 text-amber-800';
      case 'proposal':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-red-100 text-primary-dark';
      case 'shipped':
        return 'bg-red-100 text-red-800';
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
      <h1 className="text-3xl font-bold mb-8">
        {isAdminView ? `${viewedSalesPerson?.first_name} ${viewedSalesPerson?.last_name}'s ` : ''}Sales Dashboard
      </h1>
      
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

      {/* Appointments Section */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Appointments</h2>
        <form onSubmit={handleApptSubmit} className="flex gap-2 mb-4 flex-wrap">
          <input name="customer" value={apptForm.customer || ''} onChange={handleApptChange} placeholder="Customer Name" className="border p-2 rounded" required />
          <input name="date" type="date" value={apptForm.date || ''} onChange={handleApptChange} className="border p-2 rounded" required />
          <input name="time" type="time" value={apptForm.time || ''} onChange={handleApptChange} className="border p-2 rounded" required />
          <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark">{editingApptId ? 'Update' : 'Add'}</button>
          {editingApptId && <button type="button" onClick={() => { setApptForm({ customer: '', date: '', time: '', status: 'scheduled' }); setEditingApptId(null); }} className="text-gray-600 underline ml-2">Cancel</button>}
        </form>
        {appointments.length === 0 ? <p className="text-gray-600">No appointments scheduled.</p> : (
          <ul className="space-y-2">
            {appointments.map((a) => (
              <li key={a.id} className="flex gap-4 items-center">
                <span className="font-medium w-48">{a.customer}</span>
                <span>{a.date} {a.time}</span>
                <span className="text-xs text-gray-500">{a.status}</span>
                <button onClick={() => handleApptEdit(a.id)} className="text-red-600 hover:underline ml-2">Edit</button>
                <button onClick={() => handleApptDelete(a.id)} className="text-red-600 hover:underline ml-2">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* Customers Section */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Customers</h2>
        <form onSubmit={handleCustSubmit} className="flex gap-2 mb-4 flex-wrap">
          <input name="name" value={custForm.name || ''} onChange={handleCustChange} placeholder="Name" className="border p-2 rounded" required />
          <input name="email" type="email" value={custForm.email || ''} onChange={handleCustChange} placeholder="Email" className="border p-2 rounded" required />
          <input name="phone" value={custForm.phone || ''} onChange={handleCustChange} placeholder="Phone" className="border p-2 rounded" required />
          <button type="submit" className="bg-primary-red text-white px-4 py-2 rounded hover:bg-primary-red-dark">{editingCustId ? 'Update' : 'Add'}</button>
          {editingCustId && <button type="button" onClick={() => { setCustForm({ name: '', email: '', phone: '' }); setEditingCustId(null); }} className="text-gray-600 underline ml-2">Cancel</button>}
        </form>
        {customers.length === 0 ? <p className="text-gray-600">No customers found.</p> : (
          <ul className="space-y-2">
            {customers.map((c) => (
              <li key={c.id} className="flex gap-4 items-center">
                <span className="font-medium w-48">{c.name}</span>
                <span>{c.email}</span>
                <span>{c.phone}</span>
                <button onClick={() => handleCustEdit(c.id)} className="text-red-600 hover:underline ml-2">Edit</button>
                <button onClick={() => handleCustDelete(c.id)} className="text-red-600 hover:underline ml-2">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function SalesDashboard() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-red"></div>
      </div>
    }>
      <SalesDashboardContent />
    </Suspense>
  );
}
