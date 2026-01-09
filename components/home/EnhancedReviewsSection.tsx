'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Star, ChevronLeft, ChevronRight, Quote, ThumbsUp, CheckCircle, Camera } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

interface Review {
  review_id: number;
  product_name?: string;
  user_name: string;
  rating: number;
  title?: string;
  review_text: string;
  created_at: string;
  verified_purchase?: boolean;
  helpful_count?: number;
  images?: string[];
  user_avatar?: string;
}

interface EnhancedReviewsSectionProps {
  reviews: Review[];
  title?: string;
  subtitle?: string;
}

const RATING_FILTERS = [
  { value: 'all', label: 'All Reviews' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4+ Stars' },
  { value: 'photo', label: 'With Photos' }
];

export default function EnhancedReviewsSection({
  reviews,
  subtitle = 'Real reviews from verified buyers'
}: EnhancedReviewsSectionProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (activeFilter === 'all') return true;
    if (activeFilter === '5') return review.rating === 5;
    if (activeFilter === '4') return review.rating >= 4;
    if (activeFilter === 'photo') return review.images && review.images.length > 0;
    return true;
  });

  // Check scroll position
  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScroll);
      return () => carousel.removeEventListener('scroll', checkScroll);
    }
    return undefined;
  }, [filteredReviews]);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 360;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
      : 0
  }));

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
      {/* Subtle Accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp" className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <span className="w-12 h-px bg-primary-red" />
            <span className="text-primary-red text-sm font-medium tracking-[0.3em] uppercase">Testimonials</span>
            <span className="w-12 h-px bg-primary-red" />
          </div>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
            <span className="font-light">What Our</span>{' '}
            <span className="font-semibold">Customers Say</span>
          </h2>
          <p className="text-gray-500 text-lg font-light">{subtitle}</p>
        </ScrollAnimationWrapper>

        {/* Stats Overview - Elegant Card */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={100}>
          <div className="bg-white border border-gray-100 p-8 mb-12 max-w-4xl mx-auto shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Average Rating */}
              <div className="text-center md:border-r md:pr-10 border-gray-100">
                <div className="text-6xl font-light text-gray-900 mb-3">{avgRating.toFixed(1)}</div>
                <div className="flex justify-center mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(avgRating)
                          ? 'text-primary-red fill-current'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400 font-light tracking-wide">Based on {reviews.length} reviews</p>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 w-full md:w-auto">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-4 mb-3">
                    <span className="text-sm text-gray-500 w-16 font-light">{rating} stars</span>
                    <div className="flex-1 h-2 bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-primary-red transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-10 text-right font-light">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Filter Tabs - Elegant Style */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={150} className="mb-10">
          <div className="flex flex-wrap justify-center gap-3">
            {RATING_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-5 py-2.5 text-sm font-medium transition-all duration-500 tracking-wide ${
                  activeFilter === filter.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:text-primary-red border border-gray-200 hover:border-primary-red'
                }`}
              >
                {filter.value === 'photo' && <Camera className="w-4 h-4 inline mr-2" />}
                {filter.label}
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Reviews Carousel */}
        <div className="relative">
          {/* Navigation Arrows - Elegant */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white border border-gray-200 shadow-lg hover:bg-primary-red hover:border-primary-red hover:text-white transition-all duration-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white border border-gray-200 shadow-lg hover:bg-primary-red hover:border-primary-red hover:text-white transition-all duration-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredReviews.map((review, index) => (
              <ScrollAnimationWrapper
                key={review.review_id}
                animation="fadeInUp"
                delay={index * 50}
                className="flex-shrink-0 w-[340px]"
              >
                <div
                  className="bg-white border border-gray-100 p-6 h-full flex flex-col hover:shadow-lg hover:border-gray-200 transition-all duration-500 cursor-pointer"
                  onClick={() => setSelectedReview(review)}
                >
                  {/* Quote Icon */}
                  <Quote className="w-8 h-8 text-primary-red/20 mb-4" />

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-primary-red fill-current'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Title */}
                  {review.title && (
                    <h3 className="font-medium text-gray-900 mb-3 tracking-wide">{review.title}</h3>
                  )}

                  {/* Review Text */}
                  <p className="text-gray-600 text-sm line-clamp-4 flex-1 mb-5 font-light leading-relaxed">
                    {review.review_text}
                  </p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-5">
                      {review.images.slice(0, 3).map((img, i) => (
                        <div key={i} className="relative w-16 h-16 overflow-hidden bg-gray-100">
                          <Image src={img} alt="" fill className="object-cover" />
                          {i === 2 && review.images && review.images.length > 3 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-medium">
                              +{review.images.length - 3}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-red to-red-400 flex items-center justify-center text-white font-medium">
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm flex items-center gap-2 tracking-wide">
                          {review.user_name}
                          {review.verified_purchase && (
                            <CheckCircle className="w-4 h-4 text-primary-red" />
                          )}
                        </p>
                        <p className="text-xs text-gray-400 font-light">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    {review.helpful_count !== undefined && review.helpful_count > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {review.helpful_count}
                      </div>
                    )}
                  </div>

                  {/* Product Name */}
                  {review.product_name && (
                    <p className="text-xs text-primary-red mt-4 font-light tracking-wide">
                      Purchased: {review.product_name}
                    </p>
                  )}
                </div>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </div>

        {/* No Results */}
        {filteredReviews.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-light">
            No reviews match the selected filter.
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </section>
  );
}

// Review Detail Modal - Luxury Styled
function ReviewDetailModal({ review, onClose }: { review: Review; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-red to-red-400 flex items-center justify-center text-white text-xl font-medium">
                {review.user_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2 tracking-wide">
                  {review.user_name}
                  {review.verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary-red bg-red-50 px-2 py-0.5">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400 font-light">{formatDate(review.created_at)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Rating */}
          <div className="flex gap-1 mb-5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= review.rating
                    ? 'text-primary-red fill-current'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Title */}
          {review.title && (
            <h3 className="text-xl font-medium text-gray-900 mb-4 tracking-wide">{review.title}</h3>
          )}

          {/* Review Text */}
          <p className="text-gray-600 leading-relaxed mb-8 font-light">{review.review_text}</p>

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {review.images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden bg-gray-100">
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Product */}
          {review.product_name && (
            <div className="pt-5 border-t border-gray-100">
              <p className="text-sm text-gray-400 font-light">
                Reviewed product: <span className="text-primary-red font-medium">{review.product_name}</span>
              </p>
            </div>
          )}

          {/* Helpful */}
          <div className="flex items-center gap-4 mt-6 pt-5 border-t border-gray-100">
            <span className="text-sm text-gray-400 font-light">Was this review helpful?</span>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
              <ThumbsUp className="w-4 h-4" />
              Yes {review.helpful_count ? `(${review.helpful_count})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
