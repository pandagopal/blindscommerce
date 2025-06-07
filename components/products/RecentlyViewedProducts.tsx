'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';

interface RecentlyViewedProductsProps {
  className?: string;
  showTitle?: boolean;
  limit?: number;
}

const RecentlyViewedProducts: React.FC<RecentlyViewedProductsProps> = ({
  className = '',
  showTitle = true,
  limit = 8
}) => {
  const { products, removeProduct, clearAll, loading, error } = useRecentlyViewed();

  // Limit products shown
  const displayProducts = products.slice(0, limit);

  if (loading && products.length === 0) {
    return (
      <div className={`recently-viewed-products ${className}`}>
        {showTitle && <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>}
        <div className="flex space-x-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48">
              <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`recently-viewed-products ${className}`}>
        {showTitle && <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>}
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (displayProducts.length === 0) {
    return null; // Don't show anything if no products
  }

  return (
    <div className={`recently-viewed-products ${className}`}>
      {showTitle && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recently Viewed</h2>
          {products.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {displayProducts.map((product) => (
          <div key={product.id} className="group relative">
            {/* Remove button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                removeProduct(product.id);
              }}
              className="absolute top-2 right-2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Remove from recently viewed"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <Link href={`/products/${product.slug}`} className="block">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                {product.primaryImage ? (
                  <Image
                    src={product.primaryImage}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                
                <div className="flex items-center space-x-2">
                  {product.salePrice ? (
                    <>
                      <span className="text-lg font-bold text-red-600">
                        ${product.salePrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ${product.basePrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      ${product.basePrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {product.rating > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-current' : 'fill-gray-200'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({product.reviewCount})</span>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Viewed {new Date(product.viewedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {products.length > limit && (
        <div className="mt-4 text-center">
          <Link
            href="/account/recently-viewed"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All {products.length} Recently Viewed Products →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedProducts;