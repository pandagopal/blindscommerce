'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Star,
  AlertCircle,
  ThumbsUp,
  Gift
} from 'lucide-react';

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const productId = searchParams.get('productId');
  const orderId = searchParams.get('orderId');
  const orderItemId = searchParams.get('orderItemId');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [isRecommended, setIsRecommended] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    if (!productId) {
      setError('Product ID is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v2/support/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(productId),
          orderId: orderId ? parseInt(orderId) : undefined,
          orderItemId: orderItemId ? parseInt(orderItemId) : undefined,
          rating,
          title: title.trim() || undefined,
          reviewText: reviewText.trim() || undefined,
          pros: pros.trim() || undefined,
          cons: cons.trim() || undefined,
          isRecommended,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/account/reviews?submitted=true');
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/reviews">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reviews
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
          <p className="text-gray-600">Share your experience with this product</p>
        </div>
      </div>

      {/* Points Reward Banner */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 flex items-center gap-3">
          <Gift className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="font-medium text-green-900">Earn 50 Loyalty Points!</h3>
            <p className="text-sm text-green-700">
              You'll receive 50 loyalty points when your review is approved.
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Rating *</CardTitle>
            <CardDescription>How would you rate this product?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-lg font-medium text-gray-700">
                {ratingLabels[hoverRating || rating] || 'Select a rating'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Review Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Review</CardTitle>
            <CardDescription>Help others by sharing your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Review Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience in a few words"
                className="mt-1"
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="review">Your Review</Label>
              <Textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like or dislike about this product? How is the quality? Would you recommend it?"
                className="mt-1 min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pros" className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  What I Liked
                </Label>
                <Textarea
                  id="pros"
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  placeholder="List the positives..."
                  className="mt-1 h-24"
                />
              </div>
              <div>
                <Label htmlFor="cons" className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-red-600 rotate-180" />
                  What Could Be Better
                </Label>
                <Textarea
                  id="cons"
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  placeholder="List any downsides..."
                  className="mt-1 h-24"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="recommend"
                checked={isRecommended}
                onCheckedChange={(checked) => setIsRecommended(!!checked)}
              />
              <Label htmlFor="recommend" className="text-base cursor-pointer">
                I would recommend this product to a friend
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/account/reviews">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading || rating === 0}>
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Guidelines */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Review Guidelines</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Focus on the product itself, not shipping or service issues</li>
            <li>• Be specific about what you liked or didn't like</li>
            <li>• Avoid inappropriate language</li>
            <li>• Don't include personal information</li>
            <li>• Your review will be published after a brief moderation check</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
