'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, MapPin, Phone, Mail, Calendar, Clock,
  User, ArrowLeft, AlertCircle, CheckCircle, XCircle,
  CreditCard, Truck, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderDetails {
  order: {
    order_id: number;
    order_number: string;
    status: string;
    total_amount: number;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    created_at: string;
    shipped_at: string;
    notes: string | null;
  };
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  shipping_address: {
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    order_item_id: number;
    product_id: number;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration: any;
  }>;
  appointment: {
    appointment_id: number;
    appointment_date: string;
    slot_name: string;
    time_range: string;
    status: string;
    special_requirements: string | null;
  } | null;
}

interface TimeSlot {
  slot_id: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  display: string;
}

export default function InstallerPendingOrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scheduling dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // DIY dialog state
  const [diyDialogOpen, setDiyDialogOpen] = useState(false);
  const [diyReason, setDiyReason] = useState('');
  const [markingDiy, setMarkingDiy] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    fetchTimeSlots();
  }, [resolvedParams.orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v2/installer/pending-orders/${resolvedParams.orderId}`);
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch order details');
      }

      setOrderDetails(result.data);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await fetch('/api/v2/commerce/installation/time-slots');
      const result = await res.json();
      if (result.success) {
        // API returns { time_slots: [...] }
        const slots = result.data?.time_slots || result.data || [];
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const openScheduleDialog = () => {
    if (!orderDetails) return;
    // Calculate minimum date (7 days after shipment)
    const shippedDate = new Date(orderDetails.order.shipped_at);
    const minDate = new Date(shippedDate);
    minDate.setDate(minDate.getDate() + 7);
    const today = new Date();
    const effectiveMinDate = minDate > today ? minDate : today;
    setAppointmentDate(effectiveMinDate.toISOString().split('T')[0]);
    setTimeSlotId('');
    setSpecialRequirements('');
    setScheduleDialogOpen(true);
  };

  const handleScheduleAppointment = async () => {
    if (!orderDetails || !appointmentDate || !timeSlotId) return;

    try {
      setScheduling(true);
      const res = await fetch(`/api/v2/installer/pending-orders/${resolvedParams.orderId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_date: appointmentDate,
          time_slot_id: parseInt(timeSlotId),
          special_requirements: specialRequirements || undefined
        })
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to schedule appointment');
      }

      setScheduleDialogOpen(false);
      fetchOrderDetails(); // Refresh the details
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      alert(error.message || 'Failed to schedule appointment');
    } finally {
      setScheduling(false);
    }
  };

  const handleMarkAsDiy = async () => {
    if (!orderDetails) return;

    try {
      setMarkingDiy(true);
      const res = await fetch(`/api/v2/installer/pending-orders/${resolvedParams.orderId}/mark-diy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: diyReason })
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to mark as DIY');
      }

      setDiyDialogOpen(false);
      fetchOrderDetails(); // Refresh the details
    } catch (error: any) {
      console.error('Error marking as DIY:', error);
      alert(error.message || 'Failed to mark as DIY');
    } finally {
      setMarkingDiy(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Button onClick={() => router.push('/installer/pending-orders')}>
            Back to Pending Orders
          </Button>
        </div>
      </div>
    );
  }

  const { order, customer, shipping_address, items, appointment } = orderDetails;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/installer/pending-orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.order_number}
            </h1>
            <p className="text-gray-600">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={order.status === 'shipped' ? 'default' : 'secondary'}>
            {order.status === 'shipped' ? 'Ready for Scheduling' : order.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.order_item_id} className="flex items-start justify-between py-3 border-b last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name}</h4>
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      {item.configuration && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <pre className="whitespace-pre-wrap">
                            {typeof item.configuration === 'string'
                              ? item.configuration
                              : JSON.stringify(item.configuration, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.total_price)}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.unit_price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping_amount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Status */}
          {appointment ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Appointment Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p>{formatDate(appointment.appointment_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p>{appointment.time_range || appointment.slot_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant="outline" className="bg-green-100">
                      {appointment.status}
                    </Badge>
                  </div>
                  {appointment.special_requirements && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Special Requirements</p>
                      <p>{appointment.special_requirements}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Installation Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Contact the customer to schedule an installation appointment.
                  The appointment must be at least 7 days after the shipment date
                  ({formatDate(order.shipped_at)}).
                </p>
                <div className="flex gap-3">
                  <Button onClick={openScheduleDialog} className="bg-green-600 hover:bg-green-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  {order.status !== 'diy' && (
                    <Button
                      variant="outline"
                      onClick={() => setDiyDialogOpen(true)}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark as DIY
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                  {customer.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                  {customer.phone}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Installation Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <address className="not-italic text-sm text-gray-600">
                <p>{shipping_address.address_line1}</p>
                {shipping_address.address_line2 && (
                  <p>{shipping_address.address_line2}</p>
                )}
                <p>
                  {shipping_address.city}, {shipping_address.state} {shipping_address.postal_code}
                </p>
                <p>{shipping_address.country}</p>
              </address>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  const addr = `${shipping_address.address_line1}, ${shipping_address.city}, ${shipping_address.state} ${shipping_address.postal_code}`;
                  window.open(`https://maps.google.com/?q=${encodeURIComponent(addr)}`, '_blank');
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Open in Maps
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Shipped On</span>
                <span>{formatDate(order.shipped_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ready For Install</span>
                <span>{formatDate(new Date(new Date(order.shipped_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Appointment Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Installation Appointment</DialogTitle>
            <DialogDescription>
              Order #{order.order_number} for {customer.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Appointment Date</Label>
              <Input
                id="appointment_date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={(() => {
                  const shippedDate = new Date(order.shipped_at);
                  shippedDate.setDate(shippedDate.getDate() + 7);
                  return shippedDate.toISOString().split('T')[0];
                })()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_slot">Time Slot</Label>
              <Select value={timeSlotId} onValueChange={setTimeSlotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.slot_id} value={slot.slot_id.toString()}>
                      {slot.name} ({slot.display})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_requirements">Special Requirements (Optional)</Label>
              <Textarea
                id="special_requirements"
                placeholder="Any special instructions or requirements..."
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleAppointment}
              disabled={scheduling || !appointmentDate || !timeSlotId}
              className="bg-green-600 hover:bg-green-700"
            >
              {scheduling ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as DIY Dialog */}
      <Dialog open={diyDialogOpen} onOpenChange={setDiyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Order as DIY</DialogTitle>
            <DialogDescription>
              Customer {customer.name} has declined professional installation.
              They will install the product themselves.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="diy_reason">Reason (Optional)</Label>
              <Textarea
                id="diy_reason"
                placeholder="Why did the customer decline installation?"
                value={diyReason}
                onChange={(e) => setDiyReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDiyDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsDiy}
              disabled={markingDiy}
              variant="destructive"
            >
              {markingDiy ? 'Saving...' : 'Mark as DIY'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
