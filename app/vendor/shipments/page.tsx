'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Package, MapPin, Calendar, Clock,
  Search, Eye, Copy, ExternalLink, Ship,
  Plane, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react';

interface ShipmentLeg {
  leg_id: number;
  leg_order: number;
  carrier_name: string;
  carrier_type: string;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string;
  origin_location: string | null;
  destination_location: string | null;
}

interface Shipment {
  shipment_id: number;
  shipment_number: string;
  order_id: number;
  order_number: string;
  status: string;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_address: string | null;
  total_weight: number | null;
  total_packages: number;
  dimensions: string | null;
  ship_date: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  shipping_cost: number;
  created_at: string;
  customer_name?: string;
  legs?: ShipmentLeg[];
  source?: 'legacy' | 'new';
}

interface ShipmentEvent {
  event_id: number;
  event_type: string;
  event_description: string;
  location: string | null;
  event_time: string;
  carrier_name?: string;
}

const CARRIER_TYPE_LABELS: Record<string, string> = {
  domestic_origin: 'China',
  domestic_china: 'China',
  international: 'Intl',
  domestic_destination: 'US',
  domestic_us: 'US',
  last_mile: 'Last Mile',
  multi: 'Multi'
};

export default function VendorShipmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipmentEvents, setShipmentEvents] = useState<ShipmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/vendor/shipments');
        return;
      }
      if (user.role !== 'vendor' && user.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchShipments();
    }
  }, [user, authLoading, router]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/vendors/shipments');
      if (!response.ok) throw new Error('Failed to fetch shipments');

      const result = await response.json();
      const shipmentsData = result.data?.shipments || result.shipments || [];

      const shipmentsWithLegs = await Promise.all(
        shipmentsData.map(async (shipment: Shipment) => {
          // Skip fetching legs for legacy shipments (from order_fulfillment table)
          if (shipment.source === 'legacy') {
            return shipment;
          }
          try {
            const legsRes = await fetch(`/api/v2/vendors/shipments/${shipment.shipment_id}/legs`);
            if (legsRes.ok) {
              const legsData = await legsRes.json();
              return { ...shipment, legs: legsData.data?.legs || [] };
            }
          } catch (e) {
            console.error('Error fetching legs:', e);
          }
          return shipment;
        })
      );

      setShipments(shipmentsWithLegs);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShipmentEvents = async (shipment: Shipment) => {
    // Skip for legacy shipments
    if (shipment.source === 'legacy') {
      setShipmentEvents([]);
      return;
    }
    try {
      const response = await fetch(`/api/v2/vendors/shipments/${shipment.shipment_id}/events`);
      if (response.ok) {
        const result = await response.json();
        setShipmentEvents(result.data?.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      preparing: 'bg-red-100 text-red-800',
      in_transit: 'bg-red-100 text-red-800',
      customs: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      delayed: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
      picked_up: 'bg-red-100 text-red-800',
      arrived: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
  };

  const openShipmentDetails = async (shipment: Shipment) => {
    setSelectedShipment(shipment);
    await fetchShipmentEvents(shipment);
  };

  const filteredShipments = shipments.filter(shipment => {
    if (filterStatus !== 'all' && shipment.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        shipment.shipment_number.toLowerCase().includes(search) ||
        shipment.order_number?.toLowerCase().includes(search) ||
        shipment.customer_name?.toLowerCase().includes(search) ||
        shipment.legs?.some(leg => leg.tracking_number?.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const stats = {
    total: shipments.length,
    preparing: shipments.filter(s => s.status === 'preparing').length,
    inTransit: shipments.filter(s => ['in_transit', 'customs'].includes(s.status)).length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    delayed: shipments.filter(s => ['delayed', 'failed'].includes(s.status)).length
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipments</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1"><Package className="h-4 w-4" /> {stats.total}</span>
          <span className="flex items-center gap-1 text-red-600"><Clock className="h-4 w-4" /> {stats.preparing}</span>
          <span className="flex items-center gap-1 text-red-600"><Plane className="h-4 w-4" /> {stats.inTransit}</span>
          <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /> {stats.delivered}</span>
          {stats.delayed > 0 && <span className="flex items-center gap-1 text-yellow-600"><AlertCircle className="h-4 w-4" /> {stats.delayed}</span>}
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search shipment, order, or tracking..."
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
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="customs">Customs</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shipments Table */}
      {filteredShipments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Ship className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No shipments match your filters.' : 'No shipments yet.'}
            </p>
            <Link href="/vendor/orders">
              <Button size="sm" variant="outline">Go to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-2 px-3 font-medium">Shipment</th>
                <th className="text-left py-2 px-3 font-medium">Order</th>
                <th className="text-left py-2 px-3 font-medium">Route</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium">ETA</th>
                <th className="text-right py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredShipments.map((shipment) => (
                <tr key={shipment.shipment_id} className="hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <span className="font-medium">{shipment.shipment_number}</span>
                    {shipment.total_packages > 0 && (
                      <span className="text-gray-400 text-xs ml-1">({shipment.total_packages} pkg)</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <Link href={`/vendor/orders/${shipment.order_id}`} className="text-red-600 hover:underline">
                      #{shipment.order_number}
                    </Link>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{shipment.origin_city || shipment.origin_country}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>{shipment.destination_country}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <Badge className={`${getStatusBadgeColor(shipment.status)} text-xs`}>
                      {shipment.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {formatDate(shipment.estimated_delivery)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => openShipmentDetails(shipment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {selectedShipment?.shipment_number}
                            {selectedShipment && (
                              <Badge className={getStatusBadgeColor(selectedShipment.status)}>
                                {selectedShipment.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        {selectedShipment && (
                          <div className="space-y-4 text-sm">
                            {/* Quick Info */}
                            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="text-gray-500 text-xs">Order</div>
                                <div className="font-medium">#{selectedShipment.order_number}</div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-xs">Route</div>
                                <div className="font-medium">{selectedShipment.origin_city || selectedShipment.origin_country} → {selectedShipment.destination_country}</div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-xs">ETA</div>
                                <div className="font-medium">{formatDate(selectedShipment.estimated_delivery)}</div>
                              </div>
                            </div>

                            {/* Carrier Legs */}
                            {selectedShipment.legs && selectedShipment.legs.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-500 mb-2">Carriers</div>
                                <div className="space-y-2">
                                  {selectedShipment.legs.map((leg) => (
                                    <div key={leg.leg_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-medium">
                                        {leg.leg_order}
                                      </span>
                                      <span className="font-medium">{leg.carrier_name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {CARRIER_TYPE_LABELS[leg.carrier_type] || leg.carrier_type}
                                      </Badge>
                                      <Badge className={`${getStatusBadgeColor(leg.status)} text-xs`}>
                                        {leg.status.replace('_', ' ')}
                                      </Badge>
                                      {leg.tracking_number && (
                                        <div className="ml-auto flex items-center gap-1 text-gray-500">
                                          <span className="text-xs">{leg.tracking_number}</span>
                                          <button onClick={() => copyTrackingNumber(leg.tracking_number!)} className="hover:text-red-600">
                                            <Copy className="h-3 w-3" />
                                          </button>
                                          {leg.tracking_url && (
                                            <a href={leg.tracking_url} target="_blank" rel="noopener noreferrer" className="hover:text-red-600">
                                              <ExternalLink className="h-3 w-3" />
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Events */}
                            {shipmentEvents.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-500 mb-2">History</div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                  {shipmentEvents.map((event) => (
                                    <div key={event.event_id} className="flex gap-2 p-1.5 border-l-2 border-red-200 pl-3 text-xs">
                                      <div className="flex-1">
                                        <div className="font-medium">{event.event_description}</div>
                                        <div className="text-gray-500">
                                          {formatDateTime(event.event_time)}
                                          {event.location && ` • ${event.location}`}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Destination */}
                            {selectedShipment.destination_address && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Destination</div>
                                <div className="text-xs p-2 bg-gray-50 rounded">{selectedShipment.destination_address}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Compact Info */}
      <p className="text-xs text-gray-500">
        Create shipments from <Link href="/vendor/orders" className="text-red-600 hover:underline">Orders</Link> page.
      </p>
    </div>
  );
}
