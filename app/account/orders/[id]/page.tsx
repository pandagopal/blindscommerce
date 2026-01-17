'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Truck, Download, RefreshCw, ChevronDown, ChevronUp, FileText, ExternalLink, RotateCcw, Star } from 'lucide-react';
import Image from 'next/image';
import { parsePriceFields, formatPrice } from '@/lib/utils/priceUtils';

interface OrderItem {
  order_item_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  sku: string;
  image_url: string;
  product_options?: any;
}

interface OrderData {
  order_id: number;
  order_number: string;
  user_id: number;
  status: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  currency: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  items: OrderItem[];
}

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v2/commerce/orders/${orderId}`);
      
      if (response.status === 404) {
        setError('Order not found');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      
      // V2 API returns { success: true, data: orderData }
      if (data.success && data.data) {
        // Parse all price fields in the order
        const parsedOrder = parsePriceFields(data.data, [
          'total_amount', 'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount'
        ]);
        
        // Parse price fields in order items
        if (parsedOrder.items && Array.isArray(parsedOrder.items)) {
          parsedOrder.items = parsedOrder.items.map(item => 
            parsePriceFields(item, ['unit_price', 'total_price'])
          );
        }
        
        setOrder(parsedOrder);
      } else {
        throw new Error(data.error || 'Failed to fetch order');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    
    try {
      const response = await fetch('/api/v2/commerce/orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.order_id })
      });
      
      if (response.ok) {
        router.push('/cart');
      }
    } catch (err) {
      console.error('Error reordering:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatOptionKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  const getOptionCategory = (key: string) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('room') || lowerKey.includes('mount') || lowerKey.includes('width') || lowerKey.includes('height')) {
      return { bgColor: 'bg-red-50', textColor: 'text-red-700' };
    } else if (lowerKey.includes('fabric') || lowerKey.includes('color') || lowerKey.includes('material')) {
      return { bgColor: 'bg-red-50', textColor: 'text-red-700' };
    } else if (lowerKey.includes('control') || lowerKey.includes('lift')) {
      return { bgColor: 'bg-red-50', textColor: 'text-red-700' };
    } else if (lowerKey.includes('valance') || lowerKey.includes('rail')) {
      return { bgColor: 'bg-orange-50', textColor: 'text-orange-700' };
    }
    return { bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid xl:grid-cols-4 gap-6">
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto px-6 py-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-500 text-lg mb-4">{error}</div>
              <Button onClick={fetchOrderDetails}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.order_number}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <Button onClick={handleReorder} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reorder
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <FileText className="w-4 h-4 mr-2" />
              Invoice
            </Button>
            {order.status === 'delivered' && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/account/returns/new?orderId=${order.order_id}`)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Return
              </Button>
            )}
          </div>
        </div>

        {/* Main Content - Responsive grid layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Order Items - Takes 3 columns on XL screens */}
          <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-gray-200 bg-gray-50">
                  <div className="col-span-8 text-sm font-medium text-gray-700">Product</div>
                  <div className="col-span-1 text-center text-sm font-medium text-gray-700">Price</div>
                  <div className="col-span-1 text-center text-sm font-medium text-gray-700">Qty</div>
                  <div className="col-span-2 text-right text-sm font-medium text-gray-700">Total</div>
                </div>
                
                {/* Items */}
                {order.items.map((item) => (
                  <div key={item.order_item_id} className="border-b border-gray-200 last:border-b-0">
                    <div className="p-4">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Product Info */}
                        <div className="col-span-8">
                          <div className="flex items-start space-x-4">
                            <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.product_name}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                  <Package className="w-10 h-10 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                              <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedItems);
                                  if (newExpanded.has(item.order_item_id)) {
                                    newExpanded.delete(item.order_item_id);
                                  } else {
                                    newExpanded.add(item.order_item_id);
                                  }
                                  setExpandedItems(newExpanded);
                                }}
                                className="text-sm text-red-600 hover:text-red-800 mt-1 flex items-center"
                              >
                                {expandedItems.has(item.order_item_id) ? (
                                  <><ChevronUp className="h-4 w-4 mr-1" /> Hide Details</>
                                ) : (
                                  <><ChevronDown className="h-4 w-4 mr-1" /> Show Details</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="col-span-1 text-center">
                          {formatPrice(item.unit_price)}
                        </div>
                        
                        {/* Quantity */}
                        <div className="col-span-1 text-center">
                          {item.quantity}
                        </div>
                        
                        {/* Total */}
                        <div className="col-span-2 text-right font-medium">
                          {formatPrice(item.total_price)}
                        </div>
                      </div>
                      
                      {/* Expandable Configuration Details */}
                      {expandedItems.has(item.order_item_id) && item.product_options && (
                        <div className="mt-3 px-4 pb-3">
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-2 text-sm">Configuration Details</h4>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1.5 text-xs">
                              {typeof item.product_options === 'object' && Object.entries(item.product_options).map(([key, value]) => {
                                const category = getOptionCategory(key);
                                return (
                                  <div key={key} className={`${category.bgColor} p-1.5 rounded flex justify-between items-center`}>
                                    <span className={`text-[10px] ${category.textColor} mr-1`}>{formatOptionKey(key)}:</span>
                                    <span className={`font-medium text-[10px] ${category.textColor}`}>{String(value).toLowerCase()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary and Details */}
          <div className="xl:col-span-1 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-900">
                  {order.first_name} {order.last_name}
                </div>
                <div className="text-gray-600 space-y-1">
                  <div>{order.email}</div>
                  {order.phone && (
                    <div>Phone: {order.phone}</div>
                  )}
                </div>
                {order.shipping_address_id && (
                  <div className="mt-3 text-sm text-gray-500">
                    Shipping Address ID: {order.shipping_address_id}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(order.shipping_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="capitalize">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Order Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}