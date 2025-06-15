'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Shield, Calendar, User } from 'lucide-react';
import { useRoleAuth } from '@/lib/hooks/useRoleAuth';
import VendorReviewForm from './VendorReviewForm';

interface VendorRating {
  rating_id: number;
  vendor_id: number;
  user_id: number;
  order_id: number;
  overall_rating: number;
  service_quality: number;
  communication: number;
  delivery: number;
  review_title: string;
  review_text: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  user_name: string;
  order_number: string;
}

interface VendorRatingStats {
  total_reviews: number;
  avg_overall_rating: number;
  avg_service_quality: number;
  avg_communication: number;
  avg_delivery: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

interface VendorReviewsProps {
  vendorId: number;
  vendorName: string;
}

export default function VendorReviews({ vendorId, vendorName }: VendorReviewsProps) {
  const { isAuthorized, isLoading, session } = useRoleAuth('customer');
  const user = session?.user;
  const [ratings, setRatings] = useState<VendorRating[]>([]);
  const [stats, setStats] = useState<VendorRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [vendorId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors/${vendorId}/ratings`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching vendor ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!stats || stats.total_reviews === 0) return null;

    const distributionData = [
      { stars: 5, count: stats.five_star },
      { stars: 4, count: stats.four_star },
      { stars: 3, count: stats.three_star },
      { stars: 2, count: stats.two_star },
      { stars: 1, count: stats.one_star },
    ];

    return (
      <div className="space-y-2">
        {distributionData.map(({ stars, count }) => (
          <div key={stars} className="flex items-center text-sm">
            <span className="w-3 text-gray-600">{stars}</span>
            <Star className="h-3 w-3 text-yellow-400 mx-1 fill-current" />
            <div className="flex-1 mx-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <span className="w-8 text-gray-600 text-right">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Customer Reviews for {vendorName}
        </h2>

        {stats && stats.total_reviews > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating Summary */}
            <div>
              <div className="flex items-center mb-4">
                <div className="text-4xl font-bold text-gray-900 mr-2">
                  {stats.avg_overall_rating.toFixed(1)}
                </div>
                <div>
                  {renderStars(Math.round(stats.avg_overall_rating), 'lg')}
                  <p className="text-sm text-gray-600 mt-1">
                    Based on {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Service Quality</span>
                  <div className="flex items-center">
                    {renderStars(Math.round(stats.avg_service_quality))}
                    <span className="ml-2 text-sm text-gray-900">
                      {stats.avg_service_quality.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Communication</span>
                  <div className="flex items-center">
                    {renderStars(Math.round(stats.avg_communication))}
                    <span className="ml-2 text-sm text-gray-900">
                      {stats.avg_communication.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivery</span>
                  <div className="flex items-center">
                    {renderStars(Math.round(stats.avg_delivery))}
                    <span className="ml-2 text-sm text-gray-900">
                      {stats.avg_delivery.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Rating Distribution</h3>
              {renderRatingDistribution()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reviews yet for this vendor</p>
            <p className="text-sm text-gray-400 mt-1">
              Be the first to leave a review!
            </p>
          </div>
        )}
      </div>

      {/* Individual Reviews */}
      {ratings.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reviews</h3>
          <div className="space-y-6">
            {ratings.map((rating) => (
              <div key={rating.rating_id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="flex items-center bg-gray-100 rounded-full p-2 mr-3">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{rating.user_name}</span>
                        {rating.is_verified_purchase && (
                          <div className="ml-2 flex items-center text-green-600">
                            <Shield className="h-4 w-4 mr-1" />
                            <span className="text-xs">Verified Purchase</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        {renderStars(rating.overall_rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {rating.order_number && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Order #{rating.order_number}
                    </span>
                  )}
                </div>

                {rating.review_title && (
                  <h4 className="font-medium text-gray-900 mb-2">{rating.review_title}</h4>
                )}

                {rating.review_text && (
                  <p className="text-gray-700 text-sm mb-3">{rating.review_text}</p>
                )}

                {/* Detailed Ratings */}
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                  <div className="flex items-center">
                    <span className="mr-2">Service:</span>
                    {renderStars(rating.service_quality, 'sm')}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">Communication:</span>
                    {renderStars(rating.communication, 'sm')}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">Delivery:</span>
                    {renderStars(rating.delivery, 'sm')}
                  </div>
                </div>

                {/* Helpful Button */}
                <div className="flex items-center mt-3">
                  <button className="flex items-center text-gray-500 hover:text-gray-700 text-sm">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful ({rating.helpful_count})
                  </button>
                </div>
              </div>
            ))}
          </div>

          {ratings.length >= 10 && (
            <div className="text-center mt-6">
              <button className="text-primary-red hover:text-primary-red-dark font-medium">
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      )}

      {/* Write Review Button */}
      {user && (
        <div className="border-t pt-6 mt-6">
          <button
            onClick={() => setShowReviewForm(true)}
            className="w-full md:w-auto bg-primary-red text-white px-6 py-2 rounded-lg hover:bg-primary-red-dark transition-colors"
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <VendorReviewForm
          vendorId={vendorId}
          vendorName={vendorName}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            fetchRatings(); // Refresh ratings after successful submission
          }}
        />
      )}
    </div>
  );
}