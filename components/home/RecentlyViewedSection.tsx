'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Star, ChevronRight, X } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

interface ViewedProduct {
  product_id: number;
  name: string;
  slug: string;
  base_price: number;
  primary_image_url?: string;
  category_name?: string;
  rating?: number;
  viewedAt: number;
}

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 8;

export default function RecentlyViewedSection() {
  const [products, setProducts] = useState<ViewedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ViewedProduct[];
        // Sort by viewedAt descending (most recent first)
        const sorted = parsed.sort((a, b) => b.viewedAt - a.viewedAt);
        setProducts(sorted.slice(0, MAX_ITEMS));
      }
    } catch (error) {
      console.error('Error loading recently viewed products:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeProduct = (productId: number) => {
    const updated = products.filter(p => p.product_id !== productId);
    setProducts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setProducts([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '/images/no-image.svg';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
    return `/uploads/${url}`;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Don't render if no products or still loading
  if (isLoading || products.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
                <p className="text-sm text-gray-500">Pick up where you left off</p>
              </div>
            </div>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        </ScrollAnimationWrapper>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {products.map((product, index) => (
            <ScrollAnimationWrapper
              key={product.product_id}
              animation="fadeInUp"
              delay={index * 50}
            >
              <div className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeProduct(product.product_id);
                  }}
                  className="absolute top-2 right-2 z-10 p-1 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>

                <Link href={`/products/configure/${product.slug}`}>
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={getImageUrl(product.primary_image_url)}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating && product.rating > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Price */}
                    <p className="text-sm font-bold text-gray-900">
                      ${product.base_price.toFixed(2)}
                    </p>

                    {/* Viewed Time */}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(product.viewedAt)}
                    </p>
                  </div>
                </Link>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* View All Link */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={200} className="text-center mt-8">
          <Link
            href="/account/recently-viewed"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium group"
          >
            View All History
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
}

// Utility function to add a product to recently viewed (export for use in product pages)
export function addToRecentlyViewed(product: {
  product_id: number;
  name: string;
  slug: string;
  base_price: number;
  primary_image_url?: string;
  category_name?: string;
  rating?: number;
}) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let products: ViewedProduct[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    products = products.filter(p => p.product_id !== product.product_id);

    // Add to beginning with timestamp
    products.unshift({
      ...product,
      viewedAt: Date.now()
    });

    // Keep only the most recent items
    products = products.slice(0, MAX_ITEMS * 2); // Store more than we display

    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving to recently viewed:', error);
  }
}
