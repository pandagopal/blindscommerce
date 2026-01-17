'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Filter, Edit3 } from 'lucide-react';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';

interface Review {
  id: number;
  rating: number;
  title: string;
  text: string;
  author: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  images: string[];
}

interface RatingDistribution {
  rating: number;
  count: number;
}

interface ProductReviewsProps {
  productSlug: string;
  initialReviews?: Review[];
  showWriteReview?: boolean;
}

export default function ProductReviews({ 
  productSlug, 
  initialReviews = [],
  showWriteReview = true 
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Load reviews
  const loadReviews = async (page = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy
      });

      if (filterRating) {
        params.append('rating', filterRating.toString());
      }

      const response = await fetch(`/api/v2/commerce/products/${productSlug}/reviews?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        const reviewData = data.data || data;
        
        if (reset || page === 1) {
          setReviews(reviewData.reviews || []);
        } else {
          setReviews(prev => [...prev, ...(reviewData.reviews || [])]);
        }
        
        setCurrentPage(reviewData.pagination?.currentPage || 1);
        setTotalPages(reviewData.pagination?.totalPages || 1);
        setTotalReviews(reviewData.pagination?.totalReviews || 0);
        setAverageRating(reviewData.averageRating || 0);
        setRatingDistribution(reviewData.ratingDistribution || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(1, true);
  }, [productSlug, sortBy, filterRating]);

  // Handle new review submission
  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    loadReviews(1, true);
  };

  // Load more reviews
  const loadMore = () => {
    if (currentPage < totalPages) {
      loadReviews(currentPage + 1);
    }
  };

  // Render star rating
  const renderStars = (rating: number, size = 'sm') => {
    const starSize = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render rating distribution
  const renderRatingDistribution = () => {
    return (
      <div className="space-y-2">
        {(ratingDistribution ?? []).map(({ rating, count }) => {
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          
          return (
            <button
              key={rating}
              onClick={() => setFilterRating(filterRating === rating ? null : rating)}
              className={`flex items-center w-full text-sm hover:bg-gray-50 p-2 rounded ${
                filterRating === rating ? 'bg-red-50 border border-red-200' : ''
              }`}
            >
              <span className="w-8">{rating}</span>
              <Star className="h-3 w-3 text-yellow-400 fill-current mr-2" />
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="w-12 text-right">{count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
          {/* Overall Rating */}
          <div className="text-center md:text-left mb-6 md:mb-0">
            <div className="text-4xl font-bold mb-2">{(averageRating ?? 0).toFixed(1)}</div>
            {renderStars(Math.round(averageRating ?? 0), 'lg')}
            <div className="text-sm text-gray-600 mt-1">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1">
            <h3 className="font-medium mb-3">Rating Breakdown</h3>
            {renderRatingDistribution()}
          </div>
        </div>

        {/* Write Review Button */}
        {showWriteReview && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center bg-primary-red hover:bg-primary-red-dark text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Write a Review
            </button>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ReviewForm
              productSlug={productSlug}
              onClose={() => setShowReviewForm(false)}
              onSubmitted={handleReviewSubmitted}
            />
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-gray-600" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear rating filter ✕
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {(reviews ?? []).map((review) => (
          <ReviewCard 
            key={review.id} 
            review={review}
            onHelpfulUpdate={(newCount) => {
              setReviews(prev => prev.map(r => 
                r.id === review.id ? { ...r, helpfulCount: newCount } : r
              ));
            }}
          />
        ))}

        {reviews.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            {filterRating 
              ? `No ${filterRating}-star reviews found.`
              : 'No reviews yet. Be the first to review this product!'
            }
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red mx-auto"></div>
          </div>
        )}

        {/* Load More Button */}
        {currentPage < totalPages && !loading && (
          <div className="text-center pt-6">
            <button
              onClick={loadMore}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    </div>
  );
}