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
  Search,
  Eye,
  Package,
  DollarSign,
  TrendingUp,
  Truck,
  Clock,
  CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/errorHandling';
import { format } from 'date-fns';
// Removed toast import - using alert instead

interface VendorOfflineOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  status: string;
  item_id: number;
  product_name: string;
  product_type: string;
  room_location?: string;
  width_inches: number;
  height_inches: number;
  quantity: number;
  total_price: number;
  item_status: string;
  created_at: string;
}

interface VendorStats {
  total_items: number;
  total_revenue: number;
  pending_items: number;
  completed_items: number;
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

export default function VendorOfflineOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VendorOfflineOrder[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchVendorItems();
  }, [statusFilter]);

  const fetchVendorItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/v2/offline-orders/vendor-orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.data.items || []);
        
        // Calculate stats
        const totalItems = data.data.items.length;
        const totalRevenue = data.data.items.reduce((sum: number, item: VendorOfflineOrder) => sum + item.total_price, 0);
        const pendingItems = data.data.items.filter((item: VendorOfflineOrder) => 
          ['quote_requested', 'order_paid', 'order_placed'].includes(item.item_status)
        ).length;
        const completedItems = data.data.items.filter((item: VendorOfflineOrder) => 
          ['order_received', 'sent_to_customer'].includes(item.item_status)
        ).length;
        
        setStats({
          total_items: totalItems,
          total_revenue: totalRevenue,
          pending_items: pendingItems,
          completed_items: completedItems
        });
      }
    } catch (error) {
      console.error('Failed to fetch vendor items:', error);
      alert('Failed to load offline orders');
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (orderId: number, itemId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/v2/offline-orders/orders/${orderId}/items/${itemId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('Item status updated successfully');
        fetchVendorItems();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      alert('Failed to update item status');
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.order_number.toLowerCase().includes(search) ||
      item.customer_name.toLowerCase().includes(search) ||
      item.product_name.toLowerCase().includes(search)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Offline Orders</h1>
        <p className="text-gray-600 mt-1">Manage your offline order items</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_items || 0}</div>
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
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_items || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed_items || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order number, customer, or product..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="quote_requested">Quote Requested</SelectItem>
                <SelectItem value="order_paid">Order Paid</SelectItem>
                <SelectItem value="order_placed">Order Placed</SelectItem>
                <SelectItem value="order_in_production">In Production</SelectItem>
                <SelectItem value="order_finished">Order Finished</SelectItem>
                <SelectItem value="sent_to_shipping">Sent to Shipping</SelectItem>
                <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
                <SelectItem value="order_received">Order Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading items...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-medium">
                      {item.order_number}
                    </TableCell>
                    <TableCell>{item.customer_name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.product_type}</div>
                        {item.room_location && (
                          <div className="text-xs text-gray-400">{item.room_location}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.width_inches}" × {item.height_inches}"
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.total_price)}</TableCell>
                    <TableCell>
                      <Select
                        value={item.item_status}
                        onValueChange={(value) => updateItemStatus(item.order_id, item.item_id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quote_requested">Quote Requested</SelectItem>
                          <SelectItem value="order_paid">Order Paid</SelectItem>
                          <SelectItem value="order_placed">Order Placed</SelectItem>
                          <SelectItem value="order_in_production">In Production</SelectItem>
                          <SelectItem value="order_finished">Order Finished</SelectItem>
                          <SelectItem value="sent_to_shipping">Sent to Shipping</SelectItem>
                          <SelectItem value="shipping_paid">Shipping Paid</SelectItem>
                          <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
                          <SelectItem value="order_received">Order Received</SelectItem>
                          <SelectItem value="order_damaged">Order Damaged</SelectItem>
                          <SelectItem value="missing_blind">Missing Blind</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/vendor/offline-orders/${item.order_id}`}>
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