'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from 'lucide-react';
import OrderInvoice from '@/components/invoice/OrderInvoice';
import { parsePriceFields } from '@/lib/utils/priceUtils';

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

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      if (data.success && data.data) {
        const parsedOrder = parsePriceFields(data.data, [
          'total_amount', 'subtotal', 'tax_amount', 'shipping_amount', 'discount_amount'
        ]);

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Hidden when printing */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Order
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="py-8">
        <OrderInvoice order={order} />
      </div>
    </div>
  );
}
