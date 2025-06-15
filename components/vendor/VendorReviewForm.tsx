'use client';

import { useState } from 'react';
import { Star, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface VendorReviewFormProps {
  vendorId: number;
  vendorName: string;
  orderId?: number;
  orderNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VendorReviewForm({
  vendorId,
  vendorName,
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: VendorReviewFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    overall_rating: 0,
    service_quality: 0,
    communication: 0,
    delivery: 0,
    review_title: '',
    review_text: '',
  });

  const [hoverRatings, setHoverRatings] = useState({
    overall_rating: 0,
    service_quality: 0,
    communication: 0,
    delivery: 0,
  });

  const ratingCategories = [
    {
      key: 'overall_rating' as const,
      label: 'Overall Experience',
      description: 'How would you rate your overall experience with this vendor?',
    },
    {
      key: 'service_quality' as const,
      label: 'Service Quality',
      description: 'How satisfied were you with the quality of service provided?',
    },
    {
      key: 'communication' as const,
      label: 'Communication',
      description: 'How responsive and clear was the vendor\'s communication?',
    },
    {
      key: 'delivery' as const,
      label: 'Delivery & Fulfillment',
      description: 'How satisfied were you with delivery timing and handling?',
    },
  ];

  const handleRatingClick = (category: keyof typeof formData, rating: number) => {
    setFormData(prev => ({ ...prev, [category]: rating }));
  };

  const handleRatingHover = (category: keyof typeof hoverRatings, rating: number) => {
    setHoverRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleRatingLeave = (category: keyof typeof hoverRatings) => {
    setHoverRatings(prev => ({ ...prev, [category]: 0 }));
  };

  const renderStarRating = (category: keyof typeof formData) => {
    const currentRating = formData[category] as number;
    const hoverRating = hoverRatings[category as keyof typeof hoverRatings];
    const displayRating = hoverRating || currentRating;

    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(category, star)}
            onMouseEnter={() => handleRatingHover(category as keyof typeof hoverRatings, star)}
            onMouseLeave={() => handleRatingLeave(category as keyof typeof hoverRatings)}
            className="focus:outline-none"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= displayRating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.overall_rating) {
      setError('Please provide an overall rating');
      return;
    }

    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/vendors/${vendorId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          order_id: orderId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Review Submitted!</h3>
            <p className="text-gray-600">
              Thank you for your feedback. Your review will be published after moderation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Review {vendorName}
              </h3>
              {orderNumber && (
                <p className="text-sm text-gray-600 mt-1">
                  Order #{orderNumber}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Categories */}
            <div className="space-y-6">
              {ratingCategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      {category.label}
                      {category.key === 'overall_rating' && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {renderStarRating(category.key)}
                    {formData[category.key] > 0 && (
                      <span className="text-sm text-gray-600">
                        {formData[category.key]} out of 5 stars
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Title (Optional)
              </label>
              <input
                type="text"
                value={formData.review_title}
                onChange={(e) => setFormData(prev => ({ ...prev, review_title: e.target.value }))}
                placeholder="Brief summary of your experience"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red"
                maxLength={100}
              />
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={formData.review_text}
                onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
                placeholder="Share your experience with this vendor..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-red"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.review_text.length}/1000 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Review Guidelines</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Reviews will be moderated before publication</li>
                    <li>Be honest and constructive in your feedback</li>
                    <li>Focus on your actual experience with this vendor</li>
                    <li>Avoid personal attacks or inappropriate language</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.overall_rating}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-red border border-transparent rounded-md hover:bg-primary-red-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}