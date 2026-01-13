'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, MapPin, Phone, Mail, Calendar, Clock,
  User, Search, Filter, ChevronRight, AlertCircle,
  CheckCircle, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingOrder {
  order_id: number;
  order_number: string;
  status: string;
  total_amount: number;
  shipped_at: string;
  ready_for_installation_date: string;
  days_since_shipped: number;
  has_appointment: boolean;
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
}

interface TimeSlot {
  slot_id: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  display: string;
}

export default function InstallerPendingOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [serviceZipCodes, setServiceZipCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Scheduling dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
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
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/pending-orders');
          return;
        }
        const result = await res.json();
        const data = result.data || result;
        if (data.user.role !== 'installer' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/installer/pending-orders');
        return;
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    fetchPendingOrders();
    fetchTimeSlots();
  }, [activeTab, search]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter: activeTab });
      if (search) params.append('search', search);

      const res = await fetch(`/api/v2/installer/pending-orders?${params}`);
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch pending orders');
      }

      setOrders(result.data.orders || []);
      setServiceZipCodes(result.data.service_zip_codes || []);
    } catch (error: any) {
      console.error('Error fetching pending orders:', error);
      setError(error.message || 'Failed to load pending orders');
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

  const openScheduleDialog = (order: PendingOrder) => {
    setSelectedOrder(order);
    // Calculate minimum date (7 days after shipment)
    const minDate = new Date(order.ready_for_installation_date);
    const today = new Date();
    const effectiveMinDate = minDate > today ? minDate : today;
    setAppointmentDate(effectiveMinDate.toISOString().split('T')[0]);
    setTimeSlotId('');
    setSpecialRequirements('');
    setScheduleDialogOpen(true);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedOrder || !appointmentDate || !timeSlotId) return;

    try {
      setScheduling(true);
      const res = await fetch(`/api/v2/installer/pending-orders/${selectedOrder.order_id}/schedule`, {
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
      setSelectedOrder(null);
      fetchPendingOrders(); // Refresh the list
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      alert(error.message || 'Failed to schedule appointment');
    } finally {
      setScheduling(false);
    }
  };

  const openDiyDialog = (order: PendingOrder) => {
    setSelectedOrder(order);
    setDiyReason('');
    setDiyDialogOpen(true);
  };

  const handleMarkAsDiy = async () => {
    if (!selectedOrder) return;

    try {
      setMarkingDiy(true);
      const res = await fetch(`/api/v2/installer/pending-orders/${selectedOrder.order_id}/mark-diy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: diyReason })
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to mark as DIY');
      }

      setDiyDialogOpen(false);
      setSelectedOrder(null);
      fetchPendingOrders(); // Refresh the list
    } catch (error: any) {
      console.error('Error marking as DIY:', error);
      alert(error.message || 'Failed to mark as DIY');
    } finally {
      setMarkingDiy(false);
    }
  };

  const formatAddress = (addr: PendingOrder['shipping_address']) => {
    const parts = [
      addr.address_line1,
      addr.address_line2,
      `${addr.city}, ${addr.state} ${addr.postal_code}`
    ].filter(Boolean);
    return parts.join(', ');
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPendingOrders}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Orders</h1>
        <p className="text-gray-600 mt-1">
          Shipped orders in your service area ready for installation scheduling
        </p>
        {serviceZipCodes.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Service Area: {serviceZipCodes.slice(0, 5).join(', ')}
            {serviceZipCodes.length > 5 && ` +${serviceZipCodes.length - 5} more`}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by order #, customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({orders.filter(o => o.status === 'shipped').length})
          </TabsTrigger>
          <TabsTrigger value="diy">
            DIY ({orders.filter(o => o.status === 'diy').length})
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {activeTab === 'pending'
                      ? 'No pending orders in your service area'
                      : activeTab === 'diy'
                      ? 'No DIY orders'
                      : 'No orders found'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.order_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            Order #{order.order_number}
                          </h3>
                          <Badge variant={order.status === 'shipped' ? 'default' : 'secondary'}>
                            {order.status === 'shipped' ? 'Ready for Scheduling' : 'DIY'}
                          </Badge>
                          {order.has_appointment && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          )}
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{order.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${order.customer.email}`} className="hover:text-blue-600">
                              {order.customer.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${order.customer.phone}`} className="hover:text-blue-600">
                              {order.customer.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{formatAddress(order.shipping_address)}</span>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Shipped: {formatDate(order.shipped_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{order.days_since_shipped} days ago</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:ml-4 lg:shrink-0">
                        {order.status === 'shipped' && !order.has_appointment && (
                          <>
                            <Button
                              onClick={() => openScheduleDialog(order)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Schedule Appointment
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => openDiyDialog(order)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark as DIY
                            </Button>
                          </>
                        )}
                        {order.status === 'diy' && (
                          <Button
                            onClick={() => openScheduleDialog(order)}
                            variant="outline"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Anyway
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/installer/pending-orders/${order.order_id}`)}
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Schedule Appointment Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Installation Appointment</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <>
                  Order #{selectedOrder.order_number} for {selectedOrder.customer.name}
                </>
              )}
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
                min={selectedOrder?.ready_for_installation_date?.split('T')[0]}
              />
              {selectedOrder && (
                <p className="text-xs text-gray-500">
                  Earliest available: {formatDate(selectedOrder.ready_for_installation_date)}
                </p>
              )}
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
              {selectedOrder && (
                <>
                  Customer {selectedOrder.customer.name} has declined professional installation.
                  They will install the product themselves.
                </>
              )}
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
