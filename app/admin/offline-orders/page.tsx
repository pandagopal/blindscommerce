'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/lib/errorHandling';
import { format } from 'date-fns';

interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  total_amount: number;
}

interface OfflineOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
  vendor_count: number;
  item_count: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  'quote_requested': { label: 'Quote Requested', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
  'order_paid': { label: 'Order Paid', color: 'bg-green-100 text-green-700', icon: DollarSign },
  'order_placed': { label: 'Order Placed', color: 'bg-blue-100 text-blue-700', icon: Package },
  'order_in_production': { label: 'In Production', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  'order_finished': { label: 'Order Finished', color: 'bg-purple-100 text-primary-dark', icon: CheckCircle },
  'sent_to_shipping': { label: 'Sent to Shipping', color: 'bg-indigo-100 text-primary-dark', icon: Truck },
  'shipping_paid': { label: 'Shipping Paid', color: 'bg-green-100 text-green-700', icon: DollarSign },
  'sent_to_customer': { label: 'Sent to Customer', color: 'bg-blue-100 text-blue-700', icon: Truck },
  'order_received': { label: 'Order Received', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'order_damaged': { label: 'Order Damaged', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  'missing_blind': { label: 'Missing Blind', color: 'bg-orange-100 text-orange-700', icon: AlertCircle }
};

export default function OfflineOrdersDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [orders, setOrders] = useState<OfflineOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDashboardData();
    fetchOrders();
  }, [statusFilter, page]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/v2/offline-orders/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        setStatusBreakdown(data.data.statusBreakdown || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/v2/offline-orders/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data.orders || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(search) ||
      order.customer_name.toLowerCase().includes(search) ||
      order.customer_email?.toLowerCase().includes(search) ||
      order.customer_phone?.includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offline Orders</h1>
          <p className="text-gray-600 mt-1">Manage orders created by sales staff</p>
        </div>
        <Link href="/admin/offline-orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Order
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.average_order_value || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unique_customers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {statusBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {statusBreakdown.map((item) => {
                const config = statusConfig[item.status] || { label: item.status, color: 'bg-gray-100', icon: AlertCircle };
                const Icon = config.icon;
                return (
                  <div key={item.status} className="text-center">
                    <div className={`rounded-lg p-3 ${config.color.split(' ')[0]}`}>
                      <Icon className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{item.count}</div>
                      <div className="text-sm">{config.label}</div>
                      <div className="text-xs mt-1">{formatCurrency(item.total_amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        {order.customer_email && (
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        )}
                        {order.customer_phone && (
                          <div className="text-sm text-gray-500">{order.customer_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{order.item_count} items</div>
                        <div className="text-gray-500">{order.vendor_count} vendors</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.created_by_first_name} {order.created_by_last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/offline-orders/${order.order_id}`}>
                          <Button variant="ghost" size="sm" className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                            <Eye className="h-6 w-6" />
                          </Button>
                        </Link>
                        <Link href={`/admin/offline-orders/${order.order_id}/edit`}>
                          <Button variant="ghost" size="sm" className="p-1.5 hover:bg-blue-50 rounded-md transition-colors">
                            <Edit className="h-6 w-6" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}