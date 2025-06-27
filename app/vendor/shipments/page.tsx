'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, Package, MapPin, Calendar, Clock, User, 
  Search, Download, Plus, Edit, Eye, Copy
} from 'lucide-react';

interface Shipment {
  id: string;
  order_id: string;
  customer_name: string;
  shipping_address: string;
  tracking_number: string;
  carrier: 'ups' | 'fedex' | 'usps' | 'dhl' | 'local';
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'delayed' | 'failed';
  created_date: string;
  shipped_date?: string;
  estimated_delivery: string;
  actual_delivery?: string;
  items: ShipmentItem[];
  weight: number;
  dimensions: string;
  shipping_cost: number;
  notes?: string;
}

interface ShipmentItem {
  id: string;
  product_name: string;
  quantity: number;
  sku: string;
}

export default function VendorShipmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCarrier, setFilterCarrier] = useState<string>('all');

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
    }
  }, [user, authLoading, router]);

  // Lazy load shipments data only when this route is active
  const fetchShipmentsData = async () => {
    try {
      const response = await fetch('/api/v2/vendor/shipments');
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      const data = await response.json();
      return { shipments: data.shipments || [] };
    } catch (error) {
      console.error('Error fetching shipments:', error);
      return { shipments: [] };
    }
  };

  const { 
    data: fetchedData, 
    loading, 
    error, 
    refetch 
  } = useLazyLoad(fetchShipmentsData, {
    targetPath: '/vendor/shipments',
    dependencies: []
  });

  useEffect(() => {
    if (fetchedData) {
      setShipments(fetchedData.shipments || []);
    }
  }, [fetchedData]);

  const updateShipmentStatus = async (shipmentId: string, status: Shipment['status']) => {
    try {
      const response = await fetch(`/api/vendor/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update shipment status');
      }
      
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error updating shipment status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      picked_up: 'secondary',
      in_transit: 'secondary',
      out_for_delivery: 'warning',
      delivered: 'success',
      delayed: 'warning',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getCarrierBadge = (carrier: string) => {
    const colors = {
      ups: 'bg-yellow-100 text-yellow-800',
      fedex: 'bg-purple-100 text-purple-800',
      usps: 'bg-blue-100 text-blue-800',
      dhl: 'bg-red-100 text-red-800',
      local: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant="outline" className={colors[carrier as keyof typeof colors]}>
        {carrier.toUpperCase()}
      </Badge>
    );
  };

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    alert('Tracking number copied to clipboard!');
  };

  const filteredShipments = shipments.filter(shipment => {
    if (filterStatus !== 'all' && shipment.status !== filterStatus) return false;
    if (filterCarrier !== 'all' && shipment.carrier !== filterCarrier) return false;
    if (searchTerm && !shipment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !shipment.order_id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Shipments & Fulfillment
            </h1>
            <p className="text-gray-600">Manage your order shipments and tracking</p>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold">{shipments.length}</div>
              <div className="text-sm text-gray-600">Total Shipments</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <Truck className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold">
                {shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length}
              </div>
              <div className="text-sm text-gray-600">In Transit</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {shipments.filter(s => s.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Delivered</div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600">
                {shipments.filter(s => s.status === 'pending' || s.status === 'delayed').length}
              </div>
              <div className="text-sm text-gray-600">Pending/Delayed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-purple-100 shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search shipments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCarrier} onValueChange={setFilterCarrier}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="usps">USPS</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Shipments List */}
        <Card className="border-purple-100 shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Shipment Tracking ({filteredShipments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredShipments.map((shipment) => (
                <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-lg">{shipment.id}</h4>
                      {getStatusBadge(shipment.status)}
                      {getCarrierBadge(shipment.carrier)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{shipment.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>Order: {shipment.order_id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Est. Delivery: {formatDate(shipment.estimated_delivery)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        <span>{shipment.tracking_number}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTrackingNumber(shipment.tracking_number)}
                          className="h-auto p-1"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{shipment.weight} lbs • {shipment.dimensions}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{formatCurrency(shipment.shipping_cost)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>{shipment.shipping_address}</span>
                    </div>
                    {shipment.notes && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Notes:</strong> {shipment.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedShipment(shipment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Shipment Details - {selectedShipment?.id}</DialogTitle>
                        </DialogHeader>
                        {selectedShipment && (
                          <div className="space-y-6">
                            {/* Shipment Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div><strong>Order ID:</strong> {selectedShipment.order_id}</div>
                              <div><strong>Customer:</strong> {selectedShipment.customer_name}</div>
                              <div><strong>Tracking:</strong> {selectedShipment.tracking_number}</div>
                              <div><strong>Carrier:</strong> {selectedShipment.carrier.toUpperCase()}</div>
                              <div><strong>Weight:</strong> {selectedShipment.weight} lbs</div>
                              <div><strong>Dimensions:</strong> {selectedShipment.dimensions}</div>
                              <div><strong>Shipping Cost:</strong> {formatCurrency(selectedShipment.shipping_cost)}</div>
                              <div><strong>Status:</strong> {getStatusBadge(selectedShipment.status)}</div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <h3 className="font-medium mb-2">Shipping Address</h3>
                              <p className="p-3 bg-gray-50 rounded">{selectedShipment.shipping_address}</p>
                            </div>

                            {/* Items */}
                            <div>
                              <h3 className="font-medium mb-2">Items ({selectedShipment.items.length})</h3>
                              <div className="space-y-2">
                                {selectedShipment.items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="font-medium">{item.product_name}</div>
                                      <div className="text-sm text-gray-600">SKU: {item.sku}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">Qty: {item.quantity}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status Updates */}
                            <div>
                              <h3 className="font-medium mb-2">Update Status</h3>
                              <div className="flex gap-2">
                                {selectedShipment.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateShipmentStatus(selectedShipment.id, 'picked_up')}
                                  >
                                    Mark as Picked Up
                                  </Button>
                                )}
                                {selectedShipment.status === 'picked_up' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateShipmentStatus(selectedShipment.id, 'in_transit')}
                                  >
                                    Mark as In Transit
                                  </Button>
                                )}
                                {selectedShipment.status === 'in_transit' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateShipmentStatus(selectedShipment.id, 'out_for_delivery')}
                                  >
                                    Out for Delivery
                                  </Button>
                                )}
                                {selectedShipment.status === 'out_for_delivery' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateShipmentStatus(selectedShipment.id, 'delivered')}
                                  >
                                    Mark as Delivered
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Select
                      value={shipment.status}
                      onValueChange={(value: Shipment['status']) => updateShipmentStatus(shipment.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {filteredShipments.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Shipments Found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== 'all' || filterCarrier !== 'all'
                    ? 'No shipments match your current filters.'
                    : 'You haven\'t created any shipments yet.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}