'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Save, Calculator } from 'lucide-react';
// Removed toast import - using alert instead

interface OrderItem {
  productName: string;
  productType: string;
  roomLocation: string;
  widthInches: number;
  heightInches: number;
  fabric: string;
  color: string;
  mountType: string;
  controlType: string;
  valanceType: string;
  quantity: number;
  unitPrice: number;
  vendorId?: number;
  notes: string;
}

interface Vendor {
  vendor_info_id: number;
  business_name: string;
}

export default function OfflineOrderForm() {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerPassword: '',
  });

  const [orderNotes, setOrderNotes] = useState('');
  
  const [items, setItems] = useState<OrderItem[]>([{
    productName: '',
    productType: 'Roller Blinds',
    roomLocation: '',
    widthInches: 0,
    heightInches: 0,
    fabric: '',
    color: '',
    mountType: 'inside',
    controlType: 'Manual',
    valanceType: '',
    quantity: 1,
    unitPrice: 0,
    vendorId: undefined,
    notes: '',
  }]);

  // Product types available
  const productTypes = [
    'Roller Blinds',
    'Zebra Blinds',
    'Honeycomb Blinds',
    'Vertical Blinds',
    'Venetian Blinds',
    'Roman Shades',
    'Cellular Shades',
    'Pleated Shades'
  ];

  const mountTypes = ['inside', 'outside'];
  const controlTypes = ['Manual', 'Motorized', 'Cordless', 'Plastic Beads'];

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/v2/vendors/list');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const addItem = () => {
    setItems([...items, {
      productName: '',
      productType: 'Roller Blinds',
      roomLocation: '',
      widthInches: 0,
      heightInches: 0,
      fabric: '',
      color: '',
      mountType: 'inside',
      controlType: 'Manual',
      valanceType: '',
      quantity: 1,
      unitPrice: 0,
      vendorId: undefined,
      notes: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: OrderItem) => {
    return item.unitPrice * item.quantity;
  };

  const calculateOrderTotal = () => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateSquareMeters = (widthInches: number, heightInches: number) => {
    const widthCm = widthInches * 2.54;
    const heightCm = heightInches * 2.54;
    return (widthCm * heightCm) / 10000;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!customerInfo.customerName) {
      alert('Customer name is required');
      return;
    }

    if (items.length === 0) {
      alert('At least one item is required');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName || !item.widthInches || !item.heightInches || !item.unitPrice) {
        alert(`Item ${i + 1}: Product name, dimensions, and price are required`);
        return;
      }
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/v2/offline-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customerInfo,
          items: items.map(item => ({
            ...item,
            vendorId: item.vendorId ? parseInt(item.vendorId.toString()) : undefined,
          })),
          notes: orderNotes,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Order ${data.data.order_number} created successfully`);
        
        // Reset form
        setCustomerInfo({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          customerAddress: '',
          customerPassword: '',
        });
        setOrderNotes('');
        setItems([{
          productName: '',
          productType: 'Roller Blinds',
          roomLocation: '',
          widthInches: 0,
          heightInches: 0,
          fabric: '',
          color: '',
          mountType: 'inside',
          controlType: 'Manual',
          valanceType: '',
          quantity: 1,
          unitPrice: 0,
          vendorId: undefined,
          notes: '',
        }]);
      } else {
        throw new Error(data.error || 'Failed to create order');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Enter customer details for the offline order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customerInfo.customerName}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerInfo.customerEmail}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={customerInfo.customerPhone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerPhone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerAddress">Address</Label>
              <Input
                id="customerAddress"
                value={customerInfo.customerAddress}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerAddress: e.target.value })}
              />
            </div>
          </div>
          {customerInfo.customerEmail && (
            <div className="border-t pt-4">
              <Label htmlFor="customerPassword">Customer Password (Optional)</Label>
              <Input
                id="customerPassword"
                type="password"
                value={customerInfo.customerPassword}
                onChange={(e) => setCustomerInfo({ ...customerInfo, customerPassword: e.target.value })}
                placeholder="Leave blank to generate temporary password"
              />
              <p className="text-sm text-gray-500 mt-1">
                If provided, this password will be set for the customer account. Otherwise, a temporary password will be generated.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add products to the order</CardDescription>
            </div>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Item {index + 1}</h4>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={item.productName}
                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Product Type</Label>
                  <Select
                    value={item.productType}
                    onValueChange={(value) => updateItem(index, 'productType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Room/Location</Label>
                  <Input
                    value={item.roomLocation}
                    onChange={(e) => updateItem(index, 'roomLocation', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Width (inches) *</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={item.widthInches || ''}
                    onChange={(e) => updateItem(index, 'widthInches', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label>Height (inches) *</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={item.heightInches || ''}
                    onChange={(e) => updateItem(index, 'heightInches', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Unit Price ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Fabric</Label>
                  <Input
                    value={item.fabric}
                    onChange={(e) => updateItem(index, 'fabric', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    value={item.color}
                    onChange={(e) => updateItem(index, 'color', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Mount Type</Label>
                  <Select
                    value={item.mountType}
                    onValueChange={(value) => updateItem(index, 'mountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mountTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Control Type</Label>
                  <Select
                    value={item.controlType}
                    onValueChange={(value) => updateItem(index, 'controlType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {controlTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Valance Type</Label>
                  <Input
                    value={item.valanceType}
                    onChange={(e) => updateItem(index, 'valanceType', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Vendor (Optional)</Label>
                  <Select
                    value={item.vendorId?.toString() || 'none'}
                    onValueChange={(value) => updateItem(index, 'vendorId', value === 'none' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No vendor assigned</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.vendor_info_id} value={vendor.vendor_info_id.toString()}>
                          {vendor.business_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Item Notes</Label>
                <Textarea
                  value={item.notes}
                  onChange={(e) => updateItem(index, 'notes', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm text-gray-600">
                  Area: {calculateSquareMeters(item.widthInches, item.heightInches).toFixed(2)} sq.m
                </div>
                <div className="font-medium">
                  Item Total: ${calculateItemTotal(item).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Add any additional notes for this order..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-lg font-medium">
            <span>Order Total:</span>
            <span>${calculateOrderTotal().toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Creating Order...' : 'Create Offline Order'}
        </Button>
      </div>
    </form>
  );
}