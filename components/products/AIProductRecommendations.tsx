'use client';

import { useState, useEffect } from 'react';
import { Star, Heart, ShoppingCart, Sparkles, TrendingUp, Eye, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import Image from 'next/image';

interface ProductRecommendation {
  product_id: number;
  name: string;
  slug: string;
  base_price: number;
  rating: number;
  image_url?: string;
  score: number;
  reason: string;
  short_description?: string;
}

interface AIProductRecommendationsProps {
  type?: 'personalized' | 'similar' | 'trending' | 'room-based' | 'ai-visual' | 'general';
  userId?: string;
  productId?: number;
  roomType?: string;
  budget?: number;
  style?: string;
  roomImage?: string;
  title?: string;
  maxItems?: number;
  className?: string;
}

export default function AIProductRecommendations({
  type = 'general',
  userId,
  productId,
  roomType,
  budget,
  style,
  roomImage,
  title,
  maxItems = 8,
  className = ''
}: AIProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [type, userId, productId, roomType, budget]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = {
        userId,
        roomType,
        budget,
        style,
        currentProductId: productId,
        roomImage,
        recommendationType: type
      };

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'personalized':
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case 'trending':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'similar':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'ai-visual':
        return <Camera className="h-5 w-5 text-orange-500" />;
      default:
        return <Star className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'personalized':
        return 'Recommended For You';
      case 'trending':
        return 'Trending Now';
      case 'similar':
        return 'Similar Products';
      case 'room-based':
        return `Perfect for ${roomType} Rooms`;
      case 'ai-visual':
        return 'AI-Matched to Your Room';
      default:
        return 'Featured Products';
    }
  };

  const addToWishlist = async (productId: number) => {
    try {
      const response = await fetch('/api/account/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      if (response.ok) {
        // You might want to show a toast notification here
        console.log('Added to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const addToCart = async (productId: number) => {
    try {
      const response = await fetch('/api/account/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          productId, 
          quantity: 1,
          configuration: {} 
        })
      });

      if (response.ok) {
        // You might want to show a toast notification here
        console.log('Added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 mb-6">
          {getIcon()}
          <h2 className="text-2xl font-bold">{title || getDefaultTitle()}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <Button 
            onClick={fetchRecommendations}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h2 className="text-2xl font-bold">{title || getDefaultTitle()}</h2>
          {type === 'ai-visual' && (
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              AI Powered
            </Badge>
          )}
        </div>
        <Link href="/products">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <Card key={product.product_id} className="group hover:shadow-lg transition-shadow duration-200">
            <div className="relative aspect-square overflow-hidden rounded-t-lg">
              <Link href={`/products/${product.slug}`}>
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </Link>
              
              {/* AI Score Badge */}
              {product.score > 80 && (
                <Badge 
                  className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Top Match
                </Badge>
              )}

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-8 h-8 p-0"
                  onClick={() => addToWishlist(product.product_id)}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-8 h-8 p-0"
                  onClick={() => addToCart(product.product_id)}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-4">
              <Link href={`/products/${product.slug}`}>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary-red transition-colors">
                  {product.name}
                </h3>
              </Link>

              {product.short_description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.short_description}
                </p>
              )}

              <div className="flex items-center gap-1 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{product.rating?.toFixed(1) || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-primary-red">
                  ${product.base_price?.toFixed(2)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(product.score)}% match
                </Badge>
              </div>

              <div className="text-xs text-gray-500 mb-3 italic">
                {product.reason}
              </div>

              <div className="flex gap-2">
                <Link href={`/products/configure/${product.slug}`} className="flex-1">
                  <Button className="w-full" size="sm">
                    Configure
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToCart(product.product_id)}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recommendations.length >= maxItems && (
        <div className="text-center mt-8">
          <Link href="/products">
            <Button variant="outline" size="lg">
              View More Recommendations
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}