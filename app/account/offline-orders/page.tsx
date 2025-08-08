'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search,
  Eye,
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/errorHandling';
import { format } from 'date-fns';

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
  vendor_count: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'quote_requested': { label: 'Quote Requested', color: 'bg-gray-100 text-gray-700', icon: <Clock className="h-4 w-4" /> },
  'order_paid': { label: 'Order Paid', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
  'order_placed': { label: 'Order Placed', color: 'bg-blue-100 text-blue-700', icon: <Package className="h-4 w-4" /> },
  'order_in_production': { label: 'In Production', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-4 w-4" /> },
  'order_finished': { label: 'Order Finished', color: 'bg-purple-100 text-purple-700', icon: <CheckCircle className="h-4 w-4" /> },
  'sent_to_shipping': { label: 'Sent to Shipping', color: 'bg-indigo-100 text-indigo-700', icon: <Truck className="h-4 w-4" /> },
  'shipping_paid': { label: 'Shipping Paid', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
  'sent_to_customer': { label: 'Sent to Customer', color: 'bg-blue-100 text-blue-700', icon: <Truck className="h-4 w-4" /> },
  'order_received': { label: 'Order Received', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
  'order_damaged': { label: 'Order Damaged', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-4 w-4" /> },
  'missing_blind': { label: 'Missing Blind', color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="h-4 w-4" /> }
};

export default function CustomerOfflineOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OfflineOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

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
      order.customer_name.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { 
      label: status, 
      color: 'bg-gray-100 text-gray-700',
      icon: <Clock className="h-4 w-4" />
    };
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Offline Orders</h1>
        <p className="text-gray-600 mt-1">Track your orders placed by our sales team</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => ['order_placed', 'order_in_production', 'sent_to_shipping'].includes(o.status)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'order_received').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(orders.reduce((sum, o) => sum + o.total_amount, 0))}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Vendors</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
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
                    No offline orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{order.item_count}</TableCell>
                    <TableCell>{order.vendor_count}</TableCell>
                    <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Link href={`/account/offline-orders/${order.order_id}`}>
                        <button className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-md transition-colors">
                          <Eye className="h-6 w-6" />
                        </button>
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