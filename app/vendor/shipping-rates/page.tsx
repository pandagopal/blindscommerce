'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Package, Truck } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ShippingRate {
  rate_id: number;
  name: string;
  base_cost: number;
  per_pound_cost: number;
  per_item_cost: number;
  min_order_value?: number;
  max_weight?: number;
  estimated_days: string;
  is_active: boolean;
}

export default function ShippingRatesPage() {
  const [rates, setRates] = useState<ShippingRate[]>([
    {
      rate_id: 1,
      name: 'Standard Shipping',
      base_cost: 9.99,
      per_pound_cost: 0.50,
      per_item_cost: 0,
      estimated_days: '5-7 business days',
      is_active: true,
    },
    {
      rate_id: 2,
      name: 'Express Shipping',
      base_cost: 19.99,
      per_pound_cost: 0.75,
      per_item_cost: 0,
      estimated_days: '2-3 business days',
      is_active: true,
    },
    {
      rate_id: 3,
      name: 'Free Shipping',
      base_cost: 0,
      per_pound_cost: 0,
      per_item_cost: 0,
      min_order_value: 100,
      estimated_days: '5-7 business days',
      is_active: true,
    },
  ]);
  const [showAddRate, setShowAddRate] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSaveRate = () => {
    // Implementation for saving rate
    setShowAddRate(false);
    setEditingRate(null);
  };

  const handleDeleteRate = (rateId: number) => {
    if (confirm('Are you sure you want to delete this shipping rate?')) {
      setRates(rates.filter(r => r.rate_id !== rateId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Rates</h1>
          <p className="text-gray-600 mt-2">
            Configure shipping options and pricing for your products
          </p>
        </div>
        <Dialog open={showAddRate} onOpenChange={setShowAddRate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Shipping Rate</DialogTitle>
              <DialogDescription>
                Create a new shipping option for your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rate Name</Label>
                <Input placeholder="e.g., Next Day Delivery" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Cost ($)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Per Pound Cost ($)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estimated Delivery Time</Label>
                <Input placeholder="e.g., 1-2 business days" />
              </div>
              <div className="space-y-2">
                <Label>Minimum Order Value (Optional)</Label>
                <Input type="number" step="0.01" placeholder="Leave empty for no minimum" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddRate(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRate}>Save Rate</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {rates.map((rate) => (
          <Card key={rate.rate_id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <div>
                    <CardTitle className="text-lg">{rate.name}</CardTitle>
                    <CardDescription>{rate.estimated_days}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rate.is_active ? 'default' : 'secondary'}>
                    {rate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRate(rate)}
                    className="p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRate(rate.rate_id)}
                    className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Base Cost</p>
                  <p className="font-semibold">{formatCurrency(rate.base_cost)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Per Pound</p>
                  <p className="font-semibold">{formatCurrency(rate.per_pound_cost)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Per Item</p>
                  <p className="font-semibold">{formatCurrency(rate.per_item_cost)}</p>
                </div>
                {rate.min_order_value && (
                  <div>
                    <p className="text-gray-600">Min. Order</p>
                    <p className="font-semibold">{formatCurrency(rate.min_order_value)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Calculator Example</CardTitle>
          <CardDescription>
            Preview how shipping costs are calculated for customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                Example: For a 10 lb order with Standard Shipping:
                <br />
                Base cost: $9.99 + (10 lbs × $0.50) = $14.99
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Shipping Options at Checkout:</h4>
              <div className="space-y-2">
                {rates.filter(r => r.is_active).map((rate) => (
                  <div key={rate.rate_id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{rate.name}</p>
                      <p className="text-sm text-gray-600">{rate.estimated_days}</p>
                    </div>
                    <p className="font-semibold">
                      {rate.base_cost === 0 && rate.min_order_value
                        ? `Free (orders over ${formatCurrency(rate.min_order_value)})`
                        : `From ${formatCurrency(rate.base_cost)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          <strong>Note:</strong> These shipping rates apply to all your products. 
          For product-specific shipping costs, you can set individual shipping classes 
          in your product settings.
        </AlertDescription>
      </Alert>
    </div>
  );
}