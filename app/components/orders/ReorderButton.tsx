'use client';

import { useState } from 'react';
import { RotateCcw, ShoppingCart, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReorderButtonProps {
  orderId: number;
  customerId: number;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showText?: boolean;
}

interface ReorderPreview {
  order_info: {
    order_id: number;
    order_date: string;
    total_amount: number;
  };
  available_items: any[];
  unavailable_items: any[];
  price_changes: any[];
  summary: {
    total_items: number;
    available_count: number;
    unavailable_count: number;
    original_total: number;
    current_total: number;
  };
}

export default function ReorderButton({
  orderId,
  customerId,
  size = 'default',
  variant = 'outline',
  showText = true
}: ReorderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preview, setPreview] = useState<ReorderPreview | null>(null);
  const [reorderResult, setReorderResult] = useState<any>(null);

  const fetchPreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/reorder?order_id=${orderId}&customer_id=${customerId}`);
      const data = await response.json();
      
      if (data.success) {
        setPreview(data.preview);
      } else {
        throw new Error(data.error || 'Failed to load preview');
      }
    } catch (error) {
      console.error('Error fetching reorder preview:', error);
      alert('Failed to load reorder preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          customer_id: customerId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setReorderResult(data.results);
      } else {
        throw new Error(data.error || 'Failed to process reorder');
      }
    } catch (error) {
      console.error('Error processing reorder:', error);
      alert('Failed to process reorder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    setPreview(null);
    setReorderResult(null);
    fetchPreview();
  };

  if (reorderResult) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size={size} variant={variant} onClick={handleDialogOpen}>
            <RotateCcw className="h-4 w-4" />
            {showText && <span className="ml-2">Reorder</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Reorder Successful!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {reorderResult.cart_items_added} of {reorderResult.total_items} items have been added to your cart.
              </AlertDescription>
            </Alert>

            {reorderResult.available_items.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-2">Items Added to Cart</h4>
                <div className="space-y-2">
                  {reorderResult.available_items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-green-50 p-3 rounded">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.original_quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.current_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reorderResult.unavailable_items.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">Unavailable Items</h4>
                <div className="space-y-2">
                  {reorderResult.unavailable_items.map((item: any, index: number) => (
                    <div key={index} className="bg-red-50 p-3 rounded">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-red-600">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reorderResult.price_changes.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-700 mb-2">Price Changes</h4>
                <div className="space-y-2">
                  {reorderResult.price_changes.map((item: any, index: number) => (
                    <div key={index} className="bg-orange-50 p-3 rounded">
                      <p className="font-medium">{item.product_name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="line-through text-gray-500">{formatPrice(item.original_price)}</span>
                        <span className="font-medium">{formatPrice(item.current_price)}</span>
                        <Badge variant={item.price_difference > 0 ? "destructive" : "success"}>
                          {item.price_difference > 0 ? '+' : ''}{item.price_change_percent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => window.location.href = '/cart'}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Cart
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} onClick={handleDialogOpen}>
          <RotateCcw className="h-4 w-4" />
          {showText && <span className="ml-2">Reorder</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reorder Preview</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2">Loading preview...</span>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            {/* Order Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Original Order</h4>
              <div className="text-sm text-gray-600">
                <p>Order Date: {formatDate(preview.order_info.order_date)}</p>
                <p>Original Total: {formatPrice(preview.order_info.total_amount)}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{preview.summary.total_items}</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{preview.summary.available_count}</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{preview.summary.unavailable_count}</p>
                <p className="text-sm text-gray-600">Unavailable</p>
              </div>
            </div>

            {/* Price Changes Alert */}
            {preview.price_changes.length > 0 && (
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  {preview.price_changes.length} item(s) have price changes since your original order.
                </AlertDescription>
              </Alert>
            )}

            {/* Unavailable Items Alert */}
            {preview.summary.unavailable_count > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {preview.summary.unavailable_count} item(s) are no longer available and will not be added to your cart.
                </AlertDescription>
              </Alert>
            )}

            {/* Available Items */}
            {preview.available_items.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Items to Add to Cart</h4>
                <div className="space-y-2">
                  {preview.available_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border rounded p-3">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        {item.current_price !== item.original_price && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="line-through text-gray-500">{formatPrice(item.original_price)}</span>
                            <span className="font-medium">{formatPrice(item.current_price)}</span>
                            <Badge variant={item.current_price > item.original_price ? "destructive" : "success"}>
                              {((item.current_price - item.original_price) / item.original_price * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        )}
                      </div>
                      <p className="font-medium">{formatPrice(item.line_total_current)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unavailable Items */}
            {preview.unavailable_items.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-red-700">Unavailable Items</h4>
                <div className="space-y-2">
                  {preview.unavailable_items.map((item, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-red-600">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">New Cart Total:</span>
                <span className="text-xl font-bold">{formatPrice(preview.summary.current_total)}</span>
              </div>
              {preview.summary.current_total !== preview.summary.original_total && (
                <div className="text-sm text-gray-600 mt-1">
                  Original total: {formatPrice(preview.summary.original_total)}
                  <span className={`ml-2 ${preview.summary.current_total > preview.summary.original_total ? 'text-red-600' : 'text-green-600'}`}>
                    ({preview.summary.current_total > preview.summary.original_total ? '+' : ''}{formatPrice(preview.summary.current_total - preview.summary.original_total)})
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleReorder}
                disabled={isLoading || preview.summary.available_count === 0}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoading ? 'Adding to Cart...' : `Add ${preview.summary.available_count} Items to Cart`}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Failed to load preview. Please try again.</p>
            <Button onClick={fetchPreview} className="mt-4">
              Retry
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}