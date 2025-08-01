'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed toast import - using alert instead
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  DollarSign,
  Edit,
  MessageSquare,
  Clock,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/lib/errorHandling';
import { format } from 'date-fns';

interface OrderItem {
  item_id: number;
  product_name: string;
  product_type: string;
  room_location?: string;
  width_inches: number;
  height_inches: number;
  width_cm: number;
  height_cm: number;
  fabric?: string;
  color?: string;
  mount_type?: string;
  control_type?: string;
  valance_type?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  square_meters: number;
  price_per_sqm: number;
  item_status: string;
  vendor_name?: string;
  notes?: string;
}

interface OrderNote {
  note_id: number;
  note_text: string;
  note_type: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

interface StatusHistory {
  history_id: number;
  old_status?: string;
  new_status: string;
  change_reason?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

interface OrderDetails {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
  items: OrderItem[];
  notes: OrderNote[];
  statusHistory: StatusHistory[];
}

const statusOptions = [
  'quote_requested',
  'order_paid',
  'order_placed',
  'order_in_production',
  'order_finished',
  'sent_to_shipping',
  'shipping_paid',
  'sent_to_customer',
  'order_received',
  'order_damaged',
  'missing_blind'
];

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

export default function OfflineOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [newNote, setNewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/v2/offline-orders/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data);
      } else {
        alert('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order || order.status === newStatus) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/v2/offline-orders/orders/${order.order_id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('Order status updated successfully');
        fetchOrderDetails();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateItemStatus = async (itemId: number, newStatus: string) => {
    if (!order) return;

    try {
      const response = await fetch(`/api/v2/offline-orders/orders/${order.order_id}/items/${itemId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('Item status updated successfully');
        fetchOrderDetails();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      alert('Failed to update item status');
    }
  };

  const addNote = async () => {
    if (!order || !newNote.trim()) return;

    setAddingNote(true);
    try {
      const response = await fetch(`/api/v2/offline-orders/orders/${order.order_id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText: newNote, noteType: 'internal' }),
      });

      if (response.ok) {
        alert('Note added successfully');
        setNewNote('');
        fetchOrderDetails();
      } else {
        throw new Error('Failed to add note');
      }
    } catch (error) {
      alert('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/admin/offline-orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-gray-600 mt-1">Order Details</p>
          </div>
        </div>
        <Link href={`/admin/offline-orders/${order.order_id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {order.customer_name}
              </div>
              {order.customer_email && (
                <div>
                  <span className="font-medium">Email:</span> {order.customer_email}
                </div>
              )}
              {order.customer_phone && (
                <div>
                  <span className="font-medium">Phone:</span> {order.customer_phone}
                </div>
              )}
              {order.customer_address && (
                <div>
                  <span className="font-medium">Address:</span> {order.customer_address}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.item_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">{item.product_type}</p>
                        {item.room_location && (
                          <p className="text-sm text-gray-500">Location: {item.room_location}</p>
                        )}
                      </div>
                      <Select
                        value={item.item_status}
                        onValueChange={(value) => updateItemStatus(item.item_id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {statusConfig[status].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Dimensions:</span>
                        <p>{item.width_inches}" × {item.height_inches}"</p>
                        <p className="text-xs text-gray-500">({item.width_cm} × {item.height_cm} cm)</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Area:</span>
                        <p>{item.square_meters} sq.m</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <p>{item.quantity}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                      </div>
                    </div>

                    {(item.fabric || item.color || item.mount_type || item.control_type) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm pt-2 border-t">
                        {item.fabric && (
                          <div>
                            <span className="text-gray-500">Fabric:</span> {item.fabric}
                          </div>
                        )}
                        {item.color && (
                          <div>
                            <span className="text-gray-500">Color:</span> {item.color}
                          </div>
                        )}
                        {item.mount_type && (
                          <div>
                            <span className="text-gray-500">Mount:</span> {item.mount_type}
                          </div>
                        )}
                        {item.control_type && (
                          <div>
                            <span className="text-gray-500">Control:</span> {item.control_type}
                          </div>
                        )}
                      </div>
                    )}

                    {item.vendor_name && (
                      <div className="text-sm">
                        <span className="text-gray-500">Vendor:</span> {item.vendor_name}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-500">Notes:</span> {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.notes.map((note) => (
                  <div key={note.note_id} className="border-l-4 border-gray-200 pl-4">
                    <p className="text-sm">{note.note_text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.first_name} {note.last_name} • {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                />
                <Button onClick={addNote} disabled={addingNote || !newNote.trim()}>
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium text-lg">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="pt-3 border-t">
                <Label>Order Status</Label>
                <Select
                  value={order.status}
                  onValueChange={updateOrderStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusConfig[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Created:</span>
                <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Updated:</span>
                <span>{format(new Date(order.updated_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Created by:</span>
                <span>{order.created_by_first_name} {order.created_by_last_name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.statusHistory.map((history) => (
                  <div key={history.history_id} className="text-sm">
                    <div className="flex items-center gap-2">
                      {history.old_status && (
                        <>
                          <Badge className={statusConfig[history.old_status]?.color || ''}>
                            {statusConfig[history.old_status]?.label || history.old_status}
                          </Badge>
                          <span>→</span>
                        </>
                      )}
                      <Badge className={statusConfig[history.new_status]?.color || ''}>
                        {statusConfig[history.new_status]?.label || history.new_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {history.first_name} {history.last_name} • {format(new Date(history.created_at), 'MMM d, h:mm a')}
                    </p>
                    {history.change_reason && (
                      <p className="text-xs text-gray-600 mt-1">{history.change_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}