'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  ChevronRight,
  Truck,
  DollarSign,
  XCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/priceUtils';

interface ReturnRequest {
  return_id: number;
  return_number: string;
  order_id: number;
  order_number: string;
  status: string;
  reason: string;
  return_type: string;
  refund_amount: number;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
  order_total: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
  shipped: { label: 'Return Shipped', color: 'bg-blue-100 text-blue-800', icon: <Truck className="w-3 h-3" /> },
  received: { label: 'Received', color: 'bg-purple-100 text-purple-800', icon: <Package className="w-3 h-3" /> },
  refunded: { label: 'Refunded', color: 'bg-green-100 text-green-800', icon: <DollarSign className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-3 h-3" /> },
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
  refund: 'Refund',
  exchange: 'Exchange',
  store_credit: 'Store Credit',
};

export default function ReturnsPage() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReturns();
  }, [page]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/support/returns?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReturns(data.data.returns);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns & Refunds</h1>
          <p className="text-gray-600 mt-1">Manage your return requests</p>
        </div>
        <Link href="/account/returns/new">
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Start a Return
          </Button>
        </Link>
      </div>

      {/* Return Policy Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 mb-2">Return Policy</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Returns accepted within 30 days of delivery</li>
            <li>• Items must be in original condition and packaging</li>
            <li>• Custom-made products may have different return policies</li>
            <li>• Refunds processed within 5-7 business days after receiving the item</li>
          </ul>
        </CardContent>
      </Card>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Returns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading returns...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="p-8 text-center">
              <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Returns</h3>
              <p className="text-gray-500 mb-4">You haven't requested any returns yet.</p>
              <Link href="/account/returns/new">
                <Button>Start a Return</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {returns.map((ret) => {
                const status = statusConfig[ret.status] || statusConfig.pending;
                return (
                  <Link
                    key={ret.return_id}
                    href={`/account/returns/${ret.return_id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-mono text-gray-500">{ret.return_number}</span>
                            <Badge className={`text-xs ${status.color}`}>
                              {status.icon}
                              <span className="ml-1">{status.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Order: {ret.order_number}
                            </span>
                            <span>{reasonLabels[ret.reason] || ret.reason}</span>
                            <span>{returnTypeLabels[ret.return_type]}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-500">
                              Submitted: {formatDate(ret.created_at)}
                            </span>
                            {ret.refund_amount > 0 && (
                              <span className="font-medium text-green-600">
                                Refund: {formatPrice(ret.refund_amount)}
                              </span>
                            )}
                          </div>
                          {ret.tracking_number && (
                            <div className="mt-2 text-sm text-blue-600">
                              Tracking: {ret.tracking_number} ({ret.carrier})
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} returns
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
