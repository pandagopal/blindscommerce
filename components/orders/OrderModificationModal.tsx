'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Plus, Minus } from 'lucide-react';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: number;
  status: string;
  canBeModified: boolean;
  modificationDeadline: string | null;
  items: OrderItem[];
  shippingAddress: any;
  shippingMethod: string;
  specialInstructions: string;
}

interface OrderModificationModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onModificationSubmitted: () => void;
}

const OrderModificationModal: React.FC<OrderModificationModalProps> = ({
  order,
  isOpen,
  onClose,
  onModificationSubmitted
}) => {
  const [modificationType, setModificationType] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setItems(order.items.map(item => ({
        ...item,
        originalQuantity: item.quantity,
        newQuantity: item.quantity,
        action: 'quantity_change'
      })));
      setShippingAddress(order.shippingAddress);
      setShippingMethod(order.shippingMethod);
      setSpecialInstructions(order.specialInstructions || '');
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const modificationData: any = {
        modificationType,
        reason
      };

      // Add specific data based on modification type
      if (modificationType === 'item_quantity') {
        modificationData.items = items
          .filter(item => item.newQuantity !== item.originalQuantity)
          .map(item => ({
            orderItemId: item.id,
            productId: item.productId,
            previousQuantity: item.originalQuantity,
            newQuantity: item.newQuantity,
            unitPrice: item.unitPrice,
            action: 'quantity_change'
          }));
      } else if (modificationType === 'shipping_address') {
        modificationData.shippingAddress = shippingAddress;
      } else if (modificationType === 'shipping_method') {
        modificationData.shippingMethod = shippingMethod;
      } else if (modificationType === 'special_instructions') {
        modificationData.specialInstructions = specialInstructions;
      }

      const response = await fetch(`/api/orders/${order.id}/modifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modificationData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit modification request');
      }

      onModificationSubmitted();
      onClose();
      resetForm();

    } catch (err) {
      console.error('Error submitting modification:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit modification request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setModificationType('');
    setReason('');
    setError(null);
  };

  const handleItemQuantityChange = (itemId: number, newQuantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, newQuantity: Math.max(0, newQuantity) }
        : item
    ));
  };

  const isModificationValid = () => {
    if (!modificationType || !reason.trim()) return false;

    if (modificationType === 'item_quantity') {
      return items.some(item => item.newQuantity !== item.originalQuantity);
    }

    return true;
  };

  const calculatePriceDifference = () => {
    if (modificationType !== 'item_quantity') return 0;

    return items.reduce((total, item) => {
      const quantityDiff = item.newQuantity - item.originalQuantity;
      return total + (quantityDiff * item.unitPrice);
    }, 0);
  };

  if (!isOpen) return null;

  const priceDifference = calculatePriceDifference();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Modify Order #{order.id}</DialogTitle>
          <DialogDescription>
            Update your order details below. Changes are subject to approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {order.modificationDeadline && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Modification Deadline:</strong> {new Date(order.modificationDeadline).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="modification-type">What would you like to modify?</Label>
              <Select value={modificationType} onValueChange={setModificationType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select modification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item_quantity">Change item quantities</SelectItem>
                  <SelectItem value="shipping_address">Update shipping address</SelectItem>
                  <SelectItem value="shipping_method">Change shipping method</SelectItem>
                  <SelectItem value="special_instructions">Update special instructions</SelectItem>
                  <SelectItem value="cancel_order">Cancel entire order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modificationType === 'item_quantity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Update Item Quantities</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">${item.unitPrice.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline">Original: {item.originalQuantity}</Badge>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleItemQuantityChange(item.id, item.newQuantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">{item.newQuantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleItemQuantityChange(item.id, item.newQuantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {item.newQuantity !== item.originalQuantity && (
                              <Badge variant={item.newQuantity > item.originalQuantity ? "default" : "destructive"}>
                                {item.newQuantity > item.originalQuantity ? '+' : ''}
                                ${((item.newQuantity - item.originalQuantity) * item.unitPrice).toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {priceDifference !== 0 && (
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Price Change:</span>
                        <Badge variant={priceDifference > 0 ? "default" : "destructive"} className="text-lg px-3">
                          {priceDifference > 0 ? '+' : ''}${Math.abs(priceDifference).toFixed(2)}
                        </Badge>
                      </div>
                      {priceDifference > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Additional payment will be required after approval.
                        </p>
                      )}
                      {priceDifference < 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          A refund will be processed after approval.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {modificationType === 'shipping_address' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Update Shipping Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={shippingAddress?.firstName || ''}
                      onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={shippingAddress?.lastName || ''}
                      onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address1">Address Line 1</Label>
                    <Input
                      id="address1"
                      value={shippingAddress?.line1 || ''}
                      onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, line1: e.target.value }))}
                      placeholder="Address Line 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress?.city || ''}
                      onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingAddress?.state || ''}
                      onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, state: e.target.value }))}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress?.postalCode || ''}
                      onChange={(e) => setShippingAddress((prev: any) => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>
            )}

            {modificationType === 'special_instructions' && (
              <div className="space-y-2">
                <Label htmlFor="special-instructions">Special Instructions</Label>
                <Textarea
                  id="special-instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                  placeholder="Enter any special delivery or handling instructions..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for modification *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Please explain why you need to modify this order..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isModificationValid() || loading}
                className="min-w-[200px]"
              >
                {loading ? 'Submitting...' : 'Submit Modification Request'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModificationModal;