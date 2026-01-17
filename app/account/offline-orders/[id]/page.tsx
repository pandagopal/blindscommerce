'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  DollarSign,
  MessageSquare,
  Clock,
  Truck,
  MapPin,
  Phone,
  Mail
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
  item_id?: number;
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

const statusConfig: Record<string, { label: string; color: string }> = {
  'quote_requested': { label: 'Quote Requested', color: 'bg-gray-100 text-gray-700' },
  'order_paid': { label: 'Order Paid', color: 'bg-green-100 text-green-700' },
  'order_placed': { label: 'Order Placed', color: 'bg-red-100 text-red-700' },
  'order_in_production': { label: 'In Production', color: 'bg-yellow-100 text-yellow-700' },
  'order_finished': { label: 'Order Finished', color: 'bg-red-100 text-primary-dark' },
  'sent_to_shipping': { label: 'Sent to Shipping', color: 'bg-red-100 text-primary-dark' },
  'shipping_paid': { label: 'Shipping Paid', color: 'bg-green-100 text-green-700' },
  'sent_to_customer': { label: 'Sent to Customer', color: 'bg-red-100 text-red-700' },
  'order_received': { label: 'Order Received', color: 'bg-green-100 text-green-700' },
  'order_damaged': { label: 'Order Damaged', color: 'bg-red-100 text-red-700' },
  'missing_blind': { label: 'Missing Blind', color: 'bg-orange-100 text-orange-700' }
};

export default function CustomerOfflineOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);

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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/offline-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-gray-600 mt-1">Order placed on {format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge className={statusConfig[order.status]?.color || 'bg-gray-100 text-gray-700'}>
                  {statusConfig[order.status]?.label || order.status}
                </Badge>
                <span className="text-sm text-gray-600">
                  Last updated: {format(new Date(order.updated_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
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
                      <Badge className={statusConfig[item.item_status]?.color || 'bg-gray-100 text-gray-700'}>
                        {statusConfig[item.item_status]?.label || item.item_status}
                      </Badge>
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
          {order.notes.filter(note => note.note_type !== 'internal').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Order Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.notes
                    .filter(note => note.note_type !== 'internal')
                    .map((note) => (
                      <div key={note.note_id} className="border-l-4 border-gray-200 pl-4">
                        <p className="text-sm">{note.note_text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium text-lg">{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{order.customer_email}</span>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
              {order.customer_address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{order.customer_address}</span>
                </div>
              )}
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
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Created by:</span>
                <span>{order.created_by_first_name} {order.created_by_last_name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Information */}
          {order.items.some(item => ['sent_to_shipping', 'sent_to_customer', 'order_received'].includes(item.item_status)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Contact your sales representative for tracking information.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}