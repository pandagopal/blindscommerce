'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ShoppingCart, Package, Truck, CheckCircle, Clock,
  DollarSign, Eye, Download, Search
} from 'lucide-react';

interface SalesOrder {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  total_amount: number;
  commission_amount: number;
  commission_rate: number;
  items: OrderItem[];
  shipping_address: string;
  order_date: string;
  expected_delivery: string;
  sales_rep: string;
  vendor: string;
  notes: string;
  tracking_number?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku: string;
  customizations?: string;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  monthly_revenue: number;
  commission_earned: number;
  avg_order_value: number;
  conversion_rate: number;
}

export default function SalesOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    pending_orders: 0,
    monthly_revenue: 0,
    commission_earned: 0,
    avg_order_value: 0,
    conversion_rate: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/sales/orders');
          return;
        }
        const result = await res.json();
        const data = result.data || result;
        if (data.user.role !== 'sales' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/sales/orders');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/sales/orders');
      if (res.ok) {
        const result = await res.json();
        if (!result.success) throw new Error(result.message || 'API request failed');
        setOrders(result.data.orders || []);
        setStats(result.data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: SalesOrder['status']) => {
    try {
      const res = await fetch(`/api/v2/sales/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const exportOrders = async (type: string) => {
    try {
      const res = await fetch(`/api/v2/sales/orders/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-orders-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting orders:', error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (searchTerm && !order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(order.order_number || order.id).toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Sales Orders</h1>
          <Button onClick={() => exportOrders('all')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Orders</p>
                <p className="text-lg font-bold">{stats.total_orders}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-lg font-bold">{stats.pending_orders}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-lg font-bold">{formatCurrency(stats.monthly_revenue)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary-red" />
              <div>
                <p className="text-xs text-gray-500">Commission</p>
                <p className="text-lg font-bold">{formatCurrency(stats.commission_earned)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Avg Value</p>
                <p className="text-lg font-bold">{formatCurrency(stats.avg_order_value)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Conversion</p>
                <p className="text-lg font-bold">{stats.conversion_rate}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Grid Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Order</th>
                  <th className="text-left p-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left p-3 font-medium text-gray-600">Date</th>
                  <th className="text-left p-3 font-medium text-gray-600">Items</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-right p-3 font-medium text-gray-600">Amount</th>
                  <th className="text-right p-3 font-medium text-gray-600">Commission</th>
                  <th className="text-center p-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-medium text-gray-900">{order.order_number || order.id}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_email}</div>
                    </td>
                    <td className="p-3 text-gray-600">{formatDate(order.order_date)}</td>
                    <td className="p-3 text-gray-600">{order.items.length}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-gray-900">{formatCurrency(order.total_amount)}</td>
                    <td className="p-3 text-right text-green-600 font-medium">{formatCurrency(order.commission_amount)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order {selectedOrder?.order_number || selectedOrder?.id}</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-gray-500">Customer</p>
                                    <p className="font-medium">{selectedOrder.customer_name}</p>
                                    <p className="text-gray-600">{selectedOrder.customer_email}</p>
                                    <p className="text-gray-600">{selectedOrder.customer_phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Shipping</p>
                                    <p className="font-medium">{selectedOrder.shipping_address}</p>
                                    {selectedOrder.tracking_number && (
                                      <p className="text-primary-red">Track: {selectedOrder.tracking_number}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium mb-2">Items ({selectedOrder.items.length})</p>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item) => (
                                      <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                                        <div>
                                          <p className="font-medium">{item.product_name}</p>
                                          <p className="text-xs text-gray-500">SKU: {item.sku} × {item.quantity}</p>
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t">
                                  <Select
                                    value={selectedOrder.status}
                                    onValueChange={(value: SalesOrder['status']) => handleUpdateOrderStatus(selectedOrder.id, value)}
                                  >
                                    <SelectTrigger className="w-36 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="text-right">
                                    <p className="text-lg font-bold">{formatCurrency(selectedOrder.total_amount)}</p>
                                    <p className="text-sm text-green-600">Commission: {formatCurrency(selectedOrder.commission_amount)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Select
                          value={order.status}
                          onValueChange={(value: SalesOrder['status']) => handleUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
