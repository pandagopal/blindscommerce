'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Truck,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/priceUtils';

interface ReturnItem {
  return_item_id: number;
  order_item_id: number;
  quantity: number;
  condition_description: string | null;
  product_id: number;
  original_quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  sku: string;
}

interface ReturnData {
  return_id: number;
  return_number: string;
  order_id: number;
  user_id: number;
  status: string;
  reason: string;
  reason_details: string | null;
  return_type: string;
  refund_amount: number;
  refund_method: string | null;
  admin_notes: string | null;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  received_at: string | null;
  refunded_at: string | null;
  order_number: string;
  order_total: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  pending: {
    label: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="w-4 h-4" />,
    description: 'Your return request is being reviewed by our team.'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Your return has been approved. Please ship the items back to us.'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="w-4 h-4" />,
    description: 'Your return request has been rejected.'
  },
  shipped: {
    label: 'Return Shipped',
    color: 'bg-red-100 text-red-800',
    icon: <Truck className="w-4 h-4" />,
    description: 'Your return is on its way to us.'
  },
  received: {
    label: 'Received',
    color: 'bg-red-100 text-red-800',
    icon: <Package className="w-4 h-4" />,
    description: 'We have received your return. Processing refund shortly.'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-green-100 text-green-800',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Your refund has been processed.'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800',
    icon: <XCircle className="w-4 h-4" />,
    description: 'This return request has been cancelled.'
  },
};

const reasonLabels: Record<string, string> = {
  defective: 'Defective Product',
  wrong_item: 'Wrong Item Received',
  not_as_described: 'Not as Described',
  changed_mind: 'Changed Mind',
  damaged_shipping: 'Damaged in Shipping',
  other: 'Other',
};

const returnTypeLabels: Record<string, string> = {
  refund: 'Refund to Original Payment',
  exchange: 'Exchange',
  store_credit: 'Store Credit',
};

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const returnId = params.returnId as string;
  const isNewReturn = searchParams.get('created') === 'true';

  const [returnData, setReturnData] = useState<ReturnData | null>(null);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(isNewReturn);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchReturnDetails();
  }, [returnId]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/support/returns/${returnId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Return request not found');
        } else {
          setError('Failed to load return details');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setReturnData(data.data.return);
        setItems(data.data.items);
      }
    } catch (error) {
      console.error('Error fetching return:', error);
      setError('Failed to load return details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this return request?')) return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/v2/support/returns/${returnId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        await fetchReturnDetails();
      } else {
        setError(data.error || 'Failed to cancel return request');
      }
    } catch (error) {
      console.error('Error cancelling return:', error);
      setError('Failed to cancel return request');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !returnData) {
    return (
      <div className="space-y-4">
        <Link href="/account/returns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Returns
          </Button>
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
            <Link href="/account/returns">
              <Button>Return to Returns</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!returnData) return null;

  const status = statusConfig[returnData.status] || statusConfig.pending;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Return Request Submitted!</h4>
            <p className="text-sm text-green-700">
              Your return request #{returnData.return_number} has been submitted. We'll review it within 1-2 business days.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/account/returns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500 font-mono">{returnData.return_number}</span>
              <Badge className={status.color}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Return Request</h1>
          </div>
        </div>
        {returnData.status === 'pending' && (
          <Button variant="outline" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? (
              <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full" />
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Return
              </>
            )}
          </Button>
        )}
      </div>

      {/* Status Card */}
      <Card className={status.color.replace('text-', 'bg-').split(' ')[0].replace('100', '50')}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {status.icon}
            <div>
              <h3 className="font-medium">{status.label}</h3>
              <p className="text-sm opacity-80">{status.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="font-medium">{formatDate(returnData.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Order</p>
                <Link
                  href={`/account/orders/${returnData.order_id}`}
                  className="font-medium text-red-600 hover:text-red-700"
                >
                  {returnData.order_number}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Refund Amount</p>
                <p className="font-medium text-green-600">{formatPrice(returnData.refund_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Return Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Return Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Reason</p>
              <p className="font-medium">{reasonLabels[returnData.reason] || returnData.reason}</p>
            </div>
            {returnData.reason_details && (
              <div>
                <p className="text-sm text-gray-500">Additional Details</p>
                <p className="text-gray-700">{returnData.reason_details}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Resolution Type</p>
              <p className="font-medium">{returnTypeLabels[returnData.return_type]}</p>
            </div>
            {returnData.admin_notes && (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-red-900 font-medium">Note from Support:</p>
                <p className="text-sm text-red-700">{returnData.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Info */}
        {returnData.tracking_number && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Carrier</p>
                <p className="font-medium">{returnData.carrier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-medium text-red-600">{returnData.tracking_number}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Return Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.return_item_id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>Qty: {item.quantity}</span>
                      <span>{formatPrice(item.unit_price)} each</span>
                      <span className="font-medium">
                        Subtotal: {formatPrice(parseFloat(item.unit_price as any) * item.quantity)}
                      </span>
                    </div>
                    {item.condition_description && (
                      <p className="text-sm text-gray-600 mt-2">
                        Condition: {item.condition_description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
              <div>
                <p className="font-medium">Return Requested</p>
                <p className="text-sm text-gray-500">{formatDate(returnData.created_at)}</p>
              </div>
            </div>
            {returnData.approved_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium">Approved</p>
                  <p className="text-sm text-gray-500">{formatDate(returnData.approved_at)}</p>
                </div>
              </div>
            )}
            {returnData.received_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium">Return Received</p>
                  <p className="text-sm text-gray-500">{formatDate(returnData.received_at)}</p>
                </div>
              </div>
            )}
            {returnData.refunded_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium">Refund Processed</p>
                  <p className="text-sm text-gray-500">{formatDate(returnData.refunded_at)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-red-900 mb-2">Need Help?</h3>
          <p className="text-sm text-red-700">
            If you have questions about your return, please{' '}
            <Link href={`/account/support/new?category=returns&orderId=${returnData.order_id}`} className="underline">
              create a support ticket
            </Link>{' '}
            or call us at 1-800-BLINDS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
