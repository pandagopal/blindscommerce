'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';

interface ReviewFormProps {
  productSlug: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewForm({ productSlug, onClose, onSubmitted }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    reviewText: '',
    guestName: '',
    guestEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  // Check if user is authenticated
  useState(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/v2/auth/me');
        setIsGuest(!response.ok);
      } catch {
        setIsGuest(true);
      }
    };
    checkAuth();
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a review title');
      return;
    }

    if (!formData.reviewText.trim()) {
      setError('Please enter your review');
      return;
    }

    if (isGuest) {
      if (!formData.guestName.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!formData.guestEmail.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guestEmail)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/v2/commerce/products/${productSlug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: formData.rating,
          title: formData.title,
          reviewText: formData.reviewText,
          guestName: isGuest ? formData.guestName : undefined,
          guestEmail: isGuest ? formData.guestEmail : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.success) {
          setError(data.message || 'Failed to submit review');
        } else {
          onSubmitted();
        }
      } else {
        const data = await response.json();
        setError(data.message || data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStarInput = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(star)}
            className={`h-8 w-8 transition-colors ${
              star <= formData.rating
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            }`}
          >
            <Star className="h-full w-full fill-current" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Write a Review</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating *
          </label>
          {renderStarInput()}
          {formData.rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {formData.rating} out of 5 stars
            </p>
          )}
        </div>

        {/* Guest Information */}
        {isGuest && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email *
              </label>
              <input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
                placeholder="Enter your email"
              />
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            maxLength={255}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
            placeholder="Summarize your review in a few words"
          />
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Review *
          </label>
          <textarea
            name="reviewText"
            value={formData.reviewText}
            onChange={handleInputChange}
            required
            rows={6}
            maxLength={2000}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-red focus:border-primary-red"
            placeholder="Share your thoughts about this product. What did you like or dislike? How did it meet your expectations?"
          />
          <div className="text-sm text-gray-500 mt-1">
            {formData.reviewText.length}/2000 characters
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-primary-red text-white rounded-md transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-red-dark'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}