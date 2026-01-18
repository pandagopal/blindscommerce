'use client';

import React from 'react';
import Link from 'next/link';
import { WishlistButton } from '@/components/ecommerce';

interface ProductCardProps {
  product: {
    product_id: number;
    name: string;
    slug: string;
    short_description?: string;
    base_price: number | string;
    rating?: number;
    review_count?: number;
    images?: Array<{
      image_id: number;
      image_url: string;
      is_primary: boolean;
    }>;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const price = typeof product.base_price === 'number'
    ? product.base_price
    : parseFloat(product.base_price || '0');

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary-red/20 transition-all duration-300 group relative flex flex-col h-full">
      {/* Wishlist Button */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <WishlistButton
          product={{
            product_id: product.product_id,
            name: product.name,
            slug: product.slug,
            base_price: price,
            image: product.images?.[0]?.image_url || ''
          }}
          variant="icon"
          size="md"
        />
      </div>

      {/* Product Image */}
      <Link href={`/products/configure/${product.slug}`}>
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/products/configure/${product.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-red transition-colors line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
        </Link>
        {product.short_description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        )}

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center mb-3">
            <span className="text-accent-yellow text-lg">★</span>
            <span className="ml-1 text-sm font-semibold text-gray-700">{product.rating}</span>
            {product.review_count && product.review_count > 0 && (
              <span className="ml-1 text-sm text-gray-500">({product.review_count})</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-primary-red whitespace-nowrap">
            ${price.toFixed(2)}
          </span>
          <Link
            href={`/products/configure/${product.slug}`}
            className="bg-primary-red text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-semibold text-sm shadow-sm"
          >
            Configure
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
