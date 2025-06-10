'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';

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

interface ReviewCardProps {
  review: Review;
  onHelpfulUpdate?: (newCount: number) => void;
}

export default function ReviewCard({ review, onHelpfulUpdate }: ReviewCardProps) {
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [currentHelpfulCount, setCurrentHelpfulCount] = useState(review.helpfulCount);
  const [votingLoading, setVotingLoading] = useState(false);

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', error, { dateString });
      return 'N/A';
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Handle helpful vote
  const handleHelpfulVote = async (isHelpful: boolean) => {
    if (votingLoading) return;

    setVotingLoading(true);
    try {
      // Generate session ID for guest users
      let sessionId = localStorage.getItem('review_session_id');
      if (!sessionId) {
        sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('review_session_id', sessionId);
      }

      const response = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ 
          isHelpful,
          sessionId 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserVote(data.userVote);
        setCurrentHelpfulCount(data.helpfulCount);
        onHelpfulUpdate?.(data.helpfulCount);
      }
    } catch (error) {
      console.error('Error voting on review:', error);
    } finally {
      setVotingLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {renderStars(review.rating)}
            <span className="text-sm font-medium">{review.rating}/5</span>
            {review.isVerifiedPurchase && (
              <div className="flex items-center text-green-600 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified Purchase
              </div>
            )}
          </div>
          
          <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
          
          <div className="flex items-center text-sm text-gray-600 space-x-2">
            <span>By {review.author}</span>
            <span>•</span>
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {review.text}
        </p>
      </div>

      {/* Review Images */}
      {review.images.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {review.images.map((imageUrl, index) => (
              <div 
                key={index}
                className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={imageUrl}
                  alt={`Review image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onClick={() => {
                    // Could implement image modal here
                    window.open(imageUrl, '_blank');
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Voting */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <span>Was this review helpful?</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {currentHelpfulCount > 0 && (
            <span className="text-sm text-gray-600">
              {currentHelpfulCount} people found this helpful
            </span>
          )}
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleHelpfulVote(true)}
              disabled={votingLoading}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                userVote === true
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } ${votingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className="h-3 w-3" />
              <span>Yes</span>
            </button>
            
            <button
              onClick={() => handleHelpfulVote(false)}
              disabled={votingLoading}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                userVote === false
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } ${votingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown className="h-3 w-3" />
              <span>No</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}