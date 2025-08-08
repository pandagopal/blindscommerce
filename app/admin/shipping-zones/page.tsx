'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ShippingZone {
  zone_id: number;
  zone_name: string;
  zone_regions: string[];
  shipping_methods: ShippingMethod[];
  is_active: boolean;
}

interface ShippingMethod {
  method_id: number;
  method_name: string;
  base_cost: number;
  per_item_cost: number;
  free_shipping_threshold?: number;
  estimated_days: string;
}

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddZone, setShowAddZone] = useState(false);

  useEffect(() => {
    fetchShippingZones();
  }, []);

  const fetchShippingZones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/admin/shipping-zones');
      if (!response.ok) throw new Error('Failed to fetch shipping zones');
      
      const data = await response.json();
      setZones(data.data || []);
    } catch (err) {
      setError('Failed to load shipping zones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm('Are you sure you want to delete this shipping zone?')) return;

    try {
      const response = await fetch(`/api/v2/admin/shipping-zones/${zoneId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete zone');
      
      await fetchShippingZones();
    } catch (err) {
      setError('Failed to delete shipping zone');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) return <div>Loading shipping zones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Zones</h1>
          <p className="text-gray-600 mt-2">
            Manage shipping zones and methods for different regions
          </p>
        </div>
        <Dialog open={showAddZone} onOpenChange={setShowAddZone}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Shipping Zone</DialogTitle>
              <DialogDescription>
                Create a new shipping zone with custom rates and methods
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  Shipping zone configuration is coming soon. This will allow you to:
                  <ul className="list-disc list-inside mt-2">
                    <li>Define geographical zones (countries, states, zip codes)</li>
                    <li>Set different shipping methods per zone</li>
                    <li>Configure weight-based or price-based rates</li>
                    <li>Offer free shipping thresholds</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {zones.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shipping zones configured</h3>
              <p className="text-gray-600 mb-4">
                Create shipping zones to define delivery areas and rates
              </p>
              <Button onClick={() => setShowAddZone(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Zone
              </Button>
            </CardContent>
          </Card>
        ) : (
          zones.map((zone) => (
            <Card key={zone.zone_id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{zone.zone_name}</CardTitle>
                    <CardDescription>
                      {zone.zone_regions.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="outline" size="sm" className="p-1.5 hover:bg-blue-50 rounded-md transition-colors">
                      <Edit className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteZone(zone.zone_id)}
                      className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Base Cost</TableHead>
                      <TableHead>Per Item</TableHead>
                      <TableHead>Free Shipping</TableHead>
                      <TableHead>Delivery Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zone.shipping_methods.map((method) => (
                      <TableRow key={method.method_id}>
                        <TableCell className="font-medium">
                          {method.method_name}
                        </TableCell>
                        <TableCell>{formatCurrency(method.base_cost)}</TableCell>
                        <TableCell>{formatCurrency(method.per_item_cost)}</TableCell>
                        <TableCell>
                          {method.free_shipping_threshold
                            ? `Over ${formatCurrency(method.free_shipping_threshold)}`
                            : '-'}
                        </TableCell>
                        <TableCell>{method.estimated_days}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Default Shipping Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle>Default Shipping Configuration</CardTitle>
          <CardDescription>
            Currently using system-wide default shipping rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Standard Shipping:</span> $9.99 flat rate
            </p>
            <p className="text-sm">
              <span className="font-medium">Express Shipping:</span> $19.99 flat rate
            </p>
            <p className="text-sm">
              <span className="font-medium">Free Shipping:</span> Orders over $100
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}