'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Package,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/priceUtils';

interface EligibleItem {
  order_id: number;
  order_number: string;
  order_date: string;
  order_status: string;
  order_item_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  sku: string;
  already_returned_quantity: number;
}

interface SelectedItem {
  orderItemId: number;
  quantity: number;
  conditionDescription: string;
}

const reasons = [
  { value: 'defective', label: 'Defective Product', description: 'The product has manufacturing defects' },
  { value: 'wrong_item', label: 'Wrong Item Received', description: 'Received a different product than ordered' },
  { value: 'not_as_described', label: 'Not as Described', description: 'Product differs from description/photos' },
  { value: 'changed_mind', label: 'Changed Mind', description: 'No longer want the product' },
  { value: 'damaged_shipping', label: 'Damaged in Shipping', description: 'Product arrived damaged' },
  { value: 'other', label: 'Other', description: 'Other reason' },
];

const returnTypes = [
  { value: 'refund', label: 'Refund', icon: <CreditCard className="w-4 h-4" />, description: 'Get your money back' },
  { value: 'exchange', label: 'Exchange', icon: <RefreshCw className="w-4 h-4" />, description: 'Replace with same or different item' },
  { value: 'store_credit', label: 'Store Credit', icon: <CreditCard className="w-4 h-4" />, description: 'Receive store credit for future purchases' },
];

export default function NewReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [eligibleItems, setEligibleItems] = useState<EligibleItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<number, SelectedItem>>(new Map());
  const [reason, setReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [returnType, setReturnType] = useState('refund');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const preselectedOrderId = searchParams.get('orderId');

  useEffect(() => {
    fetchEligibleItems();
  }, []);

  const fetchEligibleItems = async () => {
    try {
      setLoading(true);
      const params = preselectedOrderId ? `?orderId=${preselectedOrderId}` : '';
      const response = await fetch(`/api/v2/support/returns/eligible-items${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEligibleItems(data.data.eligibleItems);
        }
      }
    } catch (error) {
      console.error('Error fetching eligible items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: EligibleItem) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.order_item_id)) {
      newSelected.delete(item.order_item_id);
    } else {
      const availableQty = item.quantity - item.already_returned_quantity;
      newSelected.set(item.order_item_id, {
        orderItemId: item.order_item_id,
        quantity: availableQty,
        conditionDescription: '',
      });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (orderItemId: number, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(orderItemId);
    if (item) {
      item.quantity = quantity;
      newSelected.set(orderItemId, item);
      setSelectedItems(newSelected);
    }
  };

  const updateItemCondition = (orderItemId: number, condition: string) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(orderItemId);
    if (item) {
      item.conditionDescription = condition;
      newSelected.set(orderItemId, item);
      setSelectedItems(newSelected);
    }
  };

  const calculateRefundAmount = () => {
    let total = 0;
    selectedItems.forEach((selected, orderItemId) => {
      const item = eligibleItems.find(i => i.order_item_id === orderItemId);
      if (item) {
        total += parseFloat(item.unit_price as any) * selected.quantity;
      }
    });
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedItems.size === 0) {
      setError('Please select at least one item to return');
      return;
    }

    if (!reason) {
      setError('Please select a reason for the return');
      return;
    }

    // Get the order ID from first selected item
    const firstSelectedItemId = Array.from(selectedItems.keys())[0];
    const firstItem = eligibleItems.find(i => i.order_item_id === firstSelectedItemId);
    if (!firstItem) {
      setError('Invalid item selection');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/v2/support/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: firstItem.order_id,
          items: Array.from(selectedItems.values()),
          reason,
          reasonDetails: reasonDetails.trim() || undefined,
          returnType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/account/returns/${data.data.returnId}?created=true`);
      } else {
        setError(data.error || 'Failed to create return request');
      }
    } catch (error) {
      console.error('Error creating return:', error);
      setError('Failed to create return request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group items by order
  const itemsByOrder = eligibleItems.reduce((acc, item) => {
    if (!acc[item.order_id]) {
      acc[item.order_id] = {
        orderId: item.order_id,
        orderNumber: item.order_number,
        orderDate: item.order_date,
        items: [],
      };
    }
    acc[item.order_id].items.push(item);
    return acc;
  }, {} as Record<number, { orderId: number; orderNumber: string; orderDate: string; items: EligibleItem[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/returns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Returns
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Start a Return</h1>
          <p className="text-gray-600">Select items you want to return</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
        </div>
      ) : eligibleItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Eligible Items</h3>
            <p className="text-gray-500 mb-4">
              You don't have any delivered orders eligible for return within the 30-day window.
            </p>
            <Link href="/account/orders">
              <Button variant="outline">View Orders</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Items to Return</CardTitle>
              <CardDescription>Choose the items you want to return from your recent orders</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {Object.values(itemsByOrder).map((order) => (
                <div key={order.orderId} className="border-b border-gray-200 last:border-b-0">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Order {order.orderNumber}</span>
                      <span className="text-sm text-gray-500">Delivered {formatDate(order.orderDate)}</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {order.items.map((item) => {
                      const isSelected = selectedItems.has(item.order_item_id);
                      const availableQty = item.quantity - item.already_returned_quantity;
                      const selectedData = selectedItems.get(item.order_item_id);

                      return (
                        <div key={item.order_item_id} className="p-4">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleItem(item)}
                              className="mt-1"
                            />
                            <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                              <Package className="w-full h-full p-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                              <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                              <p className="text-sm text-gray-600">
                                {formatPrice(item.unit_price)} x {availableQty} available
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="mt-4 ml-10 space-y-3 pl-4 border-l-2 border-red-200">
                              <div className="flex items-center gap-4">
                                <Label className="w-20">Quantity:</Label>
                                <Select
                                  value={selectedData?.quantity.toString()}
                                  onValueChange={(v) => updateItemQuantity(item.order_item_id, parseInt(v))}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: availableQty }, (_, i) => i + 1).map((qty) => (
                                      <SelectItem key={qty} value={qty.toString()}>
                                        {qty}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-sm text-gray-500">
                                  Subtotal: {formatPrice(parseFloat(item.unit_price as any) * (selectedData?.quantity || 1))}
                                </span>
                              </div>
                              <div>
                                <Label className="text-sm">Item Condition (optional):</Label>
                                <Textarea
                                  placeholder="Describe the condition of the item..."
                                  value={selectedData?.conditionDescription || ''}
                                  onChange={(e) => updateItemCondition(item.order_item_id, e.target.value)}
                                  className="mt-1 h-20"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Return Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reason for Return</CardTitle>
              <CardDescription>Tell us why you're returning these items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      reason === r.value
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-medium ${reason === r.value ? 'text-red-900' : 'text-gray-900'}`}>
                      {r.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{r.description}</div>
                  </button>
                ))}
              </div>

              <div>
                <Label>Additional Details (optional)</Label>
                <Textarea
                  placeholder="Provide more details about your return reason..."
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Return Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How would you like to be compensated?</CardTitle>
              <CardDescription>Select your preferred resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {returnTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReturnType(type.value)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      returnType === type.value
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`flex justify-center mb-2 ${returnType === type.value ? 'text-red-600' : 'text-gray-600'}`}>
                      {type.icon}
                    </div>
                    <div className={`font-medium ${returnType === type.value ? 'text-red-900' : 'text-gray-900'}`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedItems.size > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Return Summary</h3>
                    <p className="text-sm text-gray-600">
                      {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estimated Refund</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPrice(calculateRefundAmount())}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/account/returns">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700"
              disabled={submitting || selectedItems.size === 0}
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Submit Return Request
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
