'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"; // For Add Leg dialog
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Package, Truck, MapPin, Calendar, Plus, CheckCircle,
  Plane, Ship, Clock, ExternalLink, AlertCircle
} from 'lucide-react';

interface ShipmentLeg {
  leg_id?: number;
  leg_order: number;
  carrier_name: string;
  carrier_type: 'domestic_origin' | 'international' | 'domestic_destination' | 'last_mile';
  tracking_number?: string;
  tracking_url?: string;
  origin_location?: string;
  destination_location?: string;
  status: string;
  pickup_date?: string;
  estimated_arrival?: string;
}

interface Carrier {
  carrier_id: number;
  carrier_code: string;
  carrier_name: string;
  carrier_type: string;
  tracking_url_template?: string;
}

interface Shipment {
  shipment_id: number;
  shipment_number: string;
  status: string;
  origin_city?: string;
  estimated_delivery?: string;
  legs?: ShipmentLeg[];
}

const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const CARRIER_TYPE_LABELS: Record<string, string> = {
  domestic_origin: 'China Domestic',
  international: 'International',
  domestic_destination: 'US Domestic',
  last_mile: 'Last Mile Delivery'
};

export default function VendorOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Shipment state
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [carriers, setCarriers] = useState<{ grouped: Record<string, Carrier[]> }>({ grouped: {} });
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [showAddLegDialog, setShowAddLegDialog] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentError, setShipmentError] = useState('');

  // New shipment form
  const [newShipment, setNewShipment] = useState({
    originCity: '',
    originWarehouse: '',
    totalWeight: '',
    totalPackages: '1',
    dimensions: '',
    estimatedDelivery: '',
    vendorNotes: '',
  });

  // New leg form
  const [newLeg, setNewLeg] = useState({
    carrierName: '',
    carrierType: 'domestic_origin' as const,
    trackingNumber: '',
    originLocation: '',
    destinationLocation: '',
  });

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
    fetchCarriers();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v2/vendors/orders/${orderId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch order');
      }
      const result = await res.json();
      const orderData = result.data || result.order || result;
      setOrder(orderData);

      // Also fetch shipment info
      await fetchShipmentInfo();
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const fetchShipmentInfo = async () => {
    try {
      const res = await fetch(`/api/v2/vendors/orders/${orderId}/shippable`);
      if (res.ok) {
        const result = await res.json();
        if (result.data?.existingShipment) {
          setShipment(result.data.existingShipment);
          // Fetch legs if shipment exists
          const legsRes = await fetch(`/api/v2/vendors/shipments/${result.data.existingShipment.shipment_id}/legs`);
          if (legsRes.ok) {
            const legsResult = await legsRes.json();
            setShipment(prev => prev ? { ...prev, legs: legsResult.data?.legs || [] } : null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching shipment info:', error);
    }
  };

  const fetchCarriers = async () => {
    try {
      const res = await fetch('/api/v2/vendors/shipments/carriers');
      if (res.ok) {
        const result = await res.json();
        setCarriers(result.data || { grouped: {} });
      }
    } catch (error) {
      console.error('Error fetching carriers:', error);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;

    // If trying to change to "Shipped", show the Ship Order dialog instead
    if (newStatus.toLowerCase() === 'shipped' && !shipment) {
      setShowShipDialog(true);
      // Reset the select to current status
      e.target.value = order.status_name || order.status;
      return;
    }

    setStatusUpdating(true);
    setStatusError('');
    try {
      const res = await fetch(`/api/v2/vendors/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      // Just update the status field in the existing order, don't replace the whole object
      setOrder((prevOrder: any) => ({
        ...prevOrder,
        status: newStatus.toLowerCase(),
        status_name: newStatus
      }));
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update status');
      // Reset select to previous value on error
      e.target.value = order.status_name || order.status;
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    setShipmentLoading(true);
    setShipmentError('');
    try {
      const res = await fetch('/api/v2/vendors/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(orderId as string),
          originCity: newShipment.originCity || 'Shenzhen',
          originWarehouse: newShipment.originWarehouse,
          totalWeight: newShipment.totalWeight ? parseFloat(newShipment.totalWeight) : null,
          totalPackages: parseInt(newShipment.totalPackages) || 1,
          dimensions: newShipment.dimensions,
          estimatedDelivery: newShipment.estimatedDelivery || null,
          vendorNotes: newShipment.vendorNotes,
          // Include first leg if carrier selected
          initialLeg: newLeg.carrierName ? {
            carrierName: newLeg.carrierName,
            carrierType: newLeg.carrierType,
            trackingNumber: newLeg.trackingNumber,
            originLocation: newLeg.originLocation || newShipment.originCity,
            destinationLocation: newLeg.destinationLocation,
          } : undefined
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create shipment');
      }

      const result = await res.json();
      setShowShipDialog(false);
      // Refresh order and shipment data
      await fetchOrder();
    } catch (err: any) {
      setShipmentError(err.message || 'Failed to create shipment');
    } finally {
      setShipmentLoading(false);
    }
  };

  const handleAddLeg = async () => {
    if (!shipment) return;
    setShipmentLoading(true);
    setShipmentError('');
    try {
      const res = await fetch(`/api/v2/vendors/shipments/${shipment.shipment_id}/legs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierName: newLeg.carrierName,
          carrierType: newLeg.carrierType,
          trackingNumber: newLeg.trackingNumber,
          originLocation: newLeg.originLocation,
          destinationLocation: newLeg.destinationLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add carrier leg');
      }

      setShowAddLegDialog(false);
      setNewLeg({ carrierName: '', carrierType: 'domestic_origin', trackingNumber: '', originLocation: '', destinationLocation: '' });
      await fetchShipmentInfo();
    } catch (err: any) {
      setShipmentError(err.message || 'Failed to add carrier leg');
    } finally {
      setShipmentLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      preparing: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-blue-100 text-blue-800',
      customs: 'bg-orange-100 text-orange-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Order not found.</div>
      </div>
    );
  }

  const isFinalStatus = (order.status_name || order.status)?.toLowerCase() === 'delivered' ||
                        (order.status_name || order.status)?.toLowerCase() === 'cancelled';
  const canShip = !shipment && ['pending', 'processing'].includes((order.status_name || order.status)?.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/vendor/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Order #{order.order_number || order.orderNumber}</h1>
              <p className="text-gray-600 text-sm">
                Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : order.orderDate}
              </p>
            </div>
          </div>

          {/* Ship Order Button */}
          {canShip && !showShipDialog && (
            <Button
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-600 hover:to-red-700"
              onClick={() => setShowShipDialog(true)}
            >
              <Truck className="h-4 w-4 mr-2" />
              Ship Order
            </Button>
          )}
        </div>

        {/* Embedded Ship Form */}
        {showShipDialog && canShip && (
          <Card className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg">Create Shipment</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowShipDialog(false)}>
                  Cancel
                </Button>
              </div>
              <p className="text-sm text-gray-600">Ship from China to US. You can add multiple carrier legs for the journey.</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="origin">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="origin">Origin</TabsTrigger>
                  <TabsTrigger value="package">Package</TabsTrigger>
                  <TabsTrigger value="carrier">First Carrier</TabsTrigger>
                </TabsList>

                <TabsContent value="origin" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Origin City (China)</Label>
                      <Input
                        placeholder="e.g., Shenzhen, Guangzhou"
                        value={newShipment.originCity}
                        onChange={(e) => setNewShipment({ ...newShipment, originCity: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Warehouse/Facility</Label>
                      <Input
                        placeholder="e.g., Warehouse A"
                        value={newShipment.originWarehouse}
                        onChange={(e) => setNewShipment({ ...newShipment, originWarehouse: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Estimated Delivery to US</Label>
                    <Input
                      type="date"
                      value={newShipment.estimatedDelivery}
                      onChange={(e) => setNewShipment({ ...newShipment, estimatedDelivery: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Shipping Notes</Label>
                    <Textarea
                      placeholder="Any special handling instructions..."
                      value={newShipment.vendorNotes}
                      onChange={(e) => setNewShipment({ ...newShipment, vendorNotes: e.target.value })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="package" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Weight (lbs)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 2.5"
                        value={newShipment.totalWeight}
                        onChange={(e) => setNewShipment({ ...newShipment, totalWeight: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Packages</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newShipment.totalPackages}
                        onChange={(e) => setNewShipment({ ...newShipment, totalPackages: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Dimensions (LxWxH)</Label>
                      <Input
                        placeholder="e.g., 12x8x4"
                        value={newShipment.dimensions}
                        onChange={(e) => setNewShipment({ ...newShipment, dimensions: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="carrier" className="space-y-4">
                  <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800">
                    <Plane className="inline-block h-4 w-4 mr-2" />
                    Optional: Add the first carrier leg. You can add more legs later as the shipment progresses.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Carrier Type</Label>
                      <Select
                        value={newLeg.carrierType}
                        onValueChange={(v) => setNewLeg({ ...newLeg, carrierType: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="domestic_origin">China Domestic</SelectItem>
                          <SelectItem value="international">International</SelectItem>
                          <SelectItem value="domestic_destination">US Domestic</SelectItem>
                          <SelectItem value="last_mile">Last Mile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Carrier Name</Label>
                      <Select
                        value={newLeg.carrierName}
                        onValueChange={(v) => setNewLeg({ ...newLeg, carrierName: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          {(carriers.grouped?.[newLeg.carrierType === 'domestic_origin' ? 'domestic_china' :
                            newLeg.carrierType === 'domestic_destination' ? 'domestic_us' :
                            newLeg.carrierType] || []).map((c: Carrier) => (
                            <SelectItem key={c.carrier_code} value={c.carrier_name}>
                              {c.carrier_name}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Tracking Number (optional)</Label>
                    <Input
                      placeholder="Enter tracking number if available"
                      value={newLeg.trackingNumber}
                      onChange={(e) => setNewLeg({ ...newLeg, trackingNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Origin Location</Label>
                      <Input
                        placeholder="e.g., Shenzhen"
                        value={newLeg.originLocation}
                        onChange={(e) => setNewLeg({ ...newLeg, originLocation: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Destination Location</Label>
                      <Input
                        placeholder="e.g., Los Angeles Port"
                        value={newLeg.destinationLocation}
                        onChange={(e) => setNewLeg({ ...newLeg, destinationLocation: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {shipmentError && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {shipmentError}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowShipDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateShipment}
                  disabled={shipmentLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {shipmentLoading ? 'Creating...' : 'Create Shipment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Status:</span>
                <Badge className={getStatusBadgeColor(order.status_name || order.status)}>
                  {order.status_name || order.status}
                </Badge>
                {!isFinalStatus && (
                  <select
                    defaultValue=""
                    onChange={handleStatusChange}
                    disabled={statusUpdating}
                    className="ml-2 border p-1 rounded text-sm"
                  >
                    <option value="" disabled>Select</option>
                    {ORDER_STATUSES.filter(s => {
                      // Remove "Shipped" from dropdown if no shipment exists - use Ship Order button instead
                      if (s.toLowerCase() === 'shipped' && !shipment) return false;
                      return true;
                    }).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                {statusUpdating && <span className="text-xs text-gray-500">Updating...</span>}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">My Items Total</div>
                <div className="text-xl font-bold text-green-600">
                  ${(parseFloat(order.vendor_items_total) || 0).toFixed(2)}
                </div>
              </div>
            </div>
            {statusError && <div className="text-red-600 text-sm mt-2">{statusError}</div>}
          </CardContent>
        </Card>

        {/* Shipment Info (if exists) */}
        {shipment && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ship className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg">Shipment {shipment.shipment_number}</CardTitle>
                  <Badge className={getStatusBadgeColor(shipment.status)}>
                    {shipment.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <Dialog open={showAddLegDialog} onOpenChange={setShowAddLegDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Carrier Leg
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Carrier Leg</DialogTitle>
                      <DialogDescription>
                        Add another carrier for the next segment of the journey.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Carrier Type</Label>
                          <Select
                            value={newLeg.carrierType}
                            onValueChange={(v) => setNewLeg({ ...newLeg, carrierType: v as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="domestic_origin">China Domestic</SelectItem>
                              <SelectItem value="international">International</SelectItem>
                              <SelectItem value="domestic_destination">US Domestic</SelectItem>
                              <SelectItem value="last_mile">Last Mile</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Carrier Name</Label>
                          <Select
                            value={newLeg.carrierName}
                            onValueChange={(v) => setNewLeg({ ...newLeg, carrierName: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                            <SelectContent>
                              {(carriers.grouped?.[newLeg.carrierType === 'domestic_origin' ? 'domestic_china' :
                                newLeg.carrierType === 'domestic_destination' ? 'domestic_us' :
                                newLeg.carrierType] || []).map((c: Carrier) => (
                                <SelectItem key={c.carrier_code} value={c.carrier_name}>
                                  {c.carrier_name}
                                </SelectItem>
                              ))}
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Tracking Number</Label>
                        <Input
                          placeholder="Enter tracking number"
                          value={newLeg.trackingNumber}
                          onChange={(e) => setNewLeg({ ...newLeg, trackingNumber: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>From</Label>
                          <Input
                            placeholder="Origin location"
                            value={newLeg.originLocation}
                            onChange={(e) => setNewLeg({ ...newLeg, originLocation: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>To</Label>
                          <Input
                            placeholder="Destination"
                            value={newLeg.destinationLocation}
                            onChange={(e) => setNewLeg({ ...newLeg, destinationLocation: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {shipmentError && (
                      <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg">
                        {shipmentError}
                      </div>
                    )}

                    <DialogFooter className="mt-6">
                      <Button variant="outline" onClick={() => setShowAddLegDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddLeg}
                        disabled={shipmentLoading || !newLeg.carrierName}
                      >
                        {shipmentLoading ? 'Adding...' : 'Add Leg'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Carrier Legs Timeline */}
              {shipment.legs && shipment.legs.length > 0 ? (
                <div className="space-y-3">
                  {shipment.legs.map((leg, idx) => (
                    <div key={leg.leg_id || idx} className="flex items-center gap-4 p-3 bg-white rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                        {leg.leg_order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{leg.carrier_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {CARRIER_TYPE_LABELS[leg.carrier_type] || leg.carrier_type}
                          </Badge>
                          <Badge className={getStatusBadgeColor(leg.status)} variant="secondary">
                            {leg.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        {leg.tracking_number && (
                          <div className="text-sm text-gray-600 mt-1">
                            Tracking: {leg.tracking_number}
                            {leg.tracking_url && (
                              <a href={leg.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-red-600 hover:underline">
                                <ExternalLink className="inline h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                        {(leg.origin_location || leg.destination_location) && (
                          <div className="text-sm text-gray-500 mt-1">
                            {leg.origin_location} → {leg.destination_location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No carrier legs added yet. Add the first carrier to start tracking.
                </div>
              )}

              {shipment.estimated_delivery && (
                <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Estimated Delivery: {new Date(shipment.estimated_delivery).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><span className="text-gray-600">Name:</span> {order.customer_name || order.customerName}</div>
              <div><span className="text-gray-600">Email:</span> {order.customer_email || order.customerEmail}</div>
              {order.customer_phone && (
                <div><span className="text-gray-600">Phone:</span> {order.customer_phone}</div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const firstName = order.shipping_first_name || order.billing_first_name || order.customer_name?.split(' ')[0] || '';
                const lastName = order.shipping_last_name || order.billing_last_name || order.customer_name?.split(' ').slice(1).join(' ') || '';
                const addressLine1 = order.shipping_address_line_1 || order.billing_address_line_1;
                const addressLine2 = order.shipping_address_line_2 || order.billing_address_line_2;
                const city = order.shipping_city || order.billing_city;
                const state = order.shipping_state || order.billing_state;
                const postalCode = order.shipping_postal_code || order.billing_postal_code;
                const country = order.shipping_country || order.billing_country;

                if (addressLine1 && city) {
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{firstName} {lastName}</div>
                      <div>{addressLine1}</div>
                      {addressLine2 && <div>{addressLine2}</div>}
                      <div>{city}, {state} {postalCode}</div>
                      {country && <div>{country}</div>}
                    </div>
                  );
                }
                return <div className="text-gray-500">No shipping information available</div>;
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(order.items || []).map((item: any, idx: number) => (
                    <tr key={item.order_item_id || idx}>
                      <td className="px-4 py-3">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.width && <span>W: {item.width} </span>}
                        {item.height && <span>H: {item.height} </span>}
                        {item.color_name && <span>Color: {item.color_name} </span>}
                        {item.material_name && <span>Material: {item.material_name}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${(parseFloat(item.unit_price) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium">My Items Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      ${(parseFloat(order.vendor_items_total) || 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
