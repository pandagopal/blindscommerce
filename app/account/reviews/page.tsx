'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react';

interface Review {
  review_id: number;
  product_id: number;
  rating: number;
  title: string | null;
  review_text: string | null;
  pros: string | null;
  cons: string | null;
  is_verified_purchase: boolean;
  is_recommended: boolean;
  status: string;
  helpful_count: number;
  not_helpful_count: number;
  admin_response: string | null;
  admin_response_at: string | null;
  created_at: string;
  product_name: string;
  sku: string;
}

interface PendingReviewItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  order_number: string;
  order_date: string;
  product_name: string;
  sku: string;
  image_url: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Published', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
};

const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch reviews and pending items in parallel
      const [reviewsRes, pendingRes] = await Promise.all([
        fetch(`/api/v2/support/reviews?page=${page}&limit=10`),
        fetch('/api/v2/support/reviews/pending'),
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        if (data.success) {
          setReviews(data.data.reviews);
          setPagination(data.data.pagination);
        }
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        if (data.success) {
          setPendingItems(data.data.pendingReviews);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    setDeleting(reviewId);
    try {
      const response = await fetch(`/api/v2/support/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.review_id !== reviewId));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setDeleting(null);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600 mt-1">Manage your product reviews</p>
      </div>

      {/* Pending Reviews */}
      {pendingItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <Star className="w-5 h-5" />
              Products to Review ({pendingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-yellow-200">
              {pendingItems.slice(0, 3).map((item) => (
                <div key={item.order_item_id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded flex items-center justify-center">
                      <Package className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                      <p className="text-sm text-gray-500">Order {item.order_number} - {formatDate(item.order_date)}</p>
                    </div>
                  </div>
                  <Link href={`/account/reviews/new?productId=${item.product_id}&orderId=${item.order_id}&orderItemId=${item.order_item_id}`}>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      <Star className="w-4 h-4 mr-2" />
                      Write Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {pendingItems.length > 3 && (
              <div className="p-4 border-t border-yellow-200 text-center">
                <p className="text-sm text-yellow-700">
                  And {pendingItems.length - 3} more products waiting for your review
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Your Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Reviews</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-4">
                You haven't written any reviews. Share your experience to help other customers!
              </p>
              {pendingItems.length > 0 && (
                <Link href={`/account/reviews/new?productId=${pendingItems[0].product_id}&orderId=${pendingItems[0].order_id}&orderItemId=${pendingItems[0].order_item_id}`}>
                  <Button>Write Your First Review</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reviews.map((review) => {
                const status = statusConfig[review.status] || statusConfig.pending;
                return (
                  <div key={review.review_id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating rating={review.rating} />
                          <Badge className={`text-xs ${status.color}`}>
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                          {review.is_verified_purchase && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900">{review.product_name}</h4>
                        {review.title && (
                          <p className="font-medium text-gray-800 mt-1">{review.title}</p>
                        )}
                        {review.review_text && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{review.review_text}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>{formatDate(review.created_at)}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {review.helpful_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            {review.not_helpful_count}
                          </span>
                        </div>

                        {/* Admin Response */}
                        {review.admin_response && (
                          <div className="mt-3 bg-red-50 rounded-lg p-3">
                            <p className="text-sm text-red-900 font-medium">Response from Support:</p>
                            <p className="text-sm text-red-700">{review.admin_response}</p>
                            <p className="text-xs text-red-500 mt-1">
                              {review.admin_response_at && formatDate(review.admin_response_at)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {review.status !== 'rejected' && (
                          <Link href={`/account/reviews/${review.review_id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(review.review_id)}
                          disabled={deleting === review.review_id}
                        >
                          {deleting === review.review_id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
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

      {/* Review Guidelines */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Review Guidelines</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Be honest and specific about your experience</li>
            <li>• Focus on the product's quality, functionality, and appearance</li>
            <li>• Avoid inappropriate language or personal information</li>
            <li>• Earn 50 loyalty points for each approved review!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
