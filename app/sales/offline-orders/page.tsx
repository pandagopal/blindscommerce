'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Eye,
  Package,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/errorHandling';
import { format } from 'date-fns';

interface SalesStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
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
  item_count: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  'quote_requested': { label: 'Quote Requested', color: 'bg-gray-100 text-gray-700' },
  'order_paid': { label: 'Order Paid', color: 'bg-green-100 text-green-700' },
  'order_placed': { label: 'Order Placed', color: 'bg-blue-100 text-blue-700' },
  'order_in_production': { label: 'In Production', color: 'bg-yellow-100 text-yellow-700' },
  'order_finished': { label: 'Order Finished', color: 'bg-purple-100 text-purple-700' },
  'sent_to_shipping': { label: 'Sent to Shipping', color: 'bg-indigo-100 text-indigo-700' },
  'shipping_paid': { label: 'Shipping Paid', color: 'bg-green-100 text-green-700' },
  'sent_to_customer': { label: 'Sent to Customer', color: 'bg-blue-100 text-blue-700' },
  'order_received': { label: 'Order Received', color: 'bg-green-100 text-green-700' },
  'order_damaged': { label: 'Order Damaged', color: 'bg-red-100 text-red-700' },
  'missing_blind': { label: 'Missing Blind', color: 'bg-orange-100 text-orange-700' }
};

export default function SalesOfflineOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [orders, setOrders] = useState<OfflineOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchOrders();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/v2/offline-orders/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats({
          total_orders: data.data.stats.total_orders || 0,
          total_revenue: data.data.stats.total_revenue || 0,
          average_order_value: data.data.stats.average_order_value || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/offline-orders/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data.orders || []);
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
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Offline Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage your offline orders</p>
        </div>
        <Link href="/sales/offline-orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Order
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.average_order_value || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders by number, customer name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
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
                      </div>
                    </TableCell>
                    <TableCell>{order.item_count}</TableCell>
                    <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/sales/offline-orders/${order.order_id}`}>
                        <Button variant="ghost" size="sm" className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <Eye className="h-6 w-6" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}