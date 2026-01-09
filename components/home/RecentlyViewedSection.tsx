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
    <section className="py-16 bg-gray-50 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <ScrollAnimationWrapper animation="fadeInUp">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-red/10 border border-primary-red/20">
                <Clock className="w-5 h-5 text-primary-red" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">Recently Viewed</h2>
                <p className="text-sm text-gray-500 font-light">Pick up where you left off</p>
              </div>
            </div>
            <button
              onClick={clearAll}
              className="text-sm text-gray-400 hover:text-primary-red transition-colors font-light tracking-wide uppercase"
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
              <div className="group relative bg-white border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-500">
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeProduct(product.product_id);
                  }}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-white/95 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary-red hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <Link href={`/products/configure/${product.slug}`}>
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-50">
                    <Image
                      src={getImageUrl(product.primary_image_url)}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary-red transition-colors mb-1.5 tracking-wide">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    {product.rating && product.rating > 0 && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <Star className="w-3 h-3 text-primary-red fill-current" />
                        <span className="text-xs text-gray-400 font-light">{product.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Price */}
                    <p className="text-sm font-semibold text-gray-900">
                      ${product.base_price.toFixed(2)}
                    </p>

                    {/* Viewed Time */}
                    <p className="text-xs text-gray-400 mt-1.5 font-light">
                      {formatTimeAgo(product.viewedAt)}
                    </p>
                  </div>
                </Link>

                {/* Red accent line on hover */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-primary-red w-0 group-hover:w-full transition-all duration-500" />
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* View All Link */}
        <ScrollAnimationWrapper animation="fadeInUp" delay={200} className="text-center mt-10">
          <Link
            href="/account/recently-viewed"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-primary-red font-medium transition-all duration-500 group"
          >
            <span className="uppercase tracking-wider text-sm">View All History</span>
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
