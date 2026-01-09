'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Eye, Star, Tag, Sparkles } from 'lucide-react';

interface Product {
  product_id: number;
  category_id: number;
  name: string;
  slug: string;
  category_name: string;
  base_price: number;
  sale_price?: number;
  rating?: number;
  review_count?: number;
  primary_image?: string;
  short_description?: string;
  is_new?: boolean;
  is_bestseller?: boolean;
  is_on_sale?: boolean;
  color_options?: string[];
  created_at?: string;
}

interface EnhancedProductGridProps {
  products: Product[];
  gridView: 'comfortable' | 'compact';
  wishlist: number[];
  onToggleWishlist: (productId: number) => void;
  onQuickView: (product: Product) => void;
}

// Color swatch component
const ColorSwatch = ({ colors }: { colors: string[] }) => {
  if (!colors || colors.length === 0) return null;

  const displayColors = colors.slice(0, 4);
  const remaining = colors.length - 4;

  return (
    <div className="flex items-center gap-1 mt-2">
      {displayColors.map((color, index) => (
        <div
          key={index}
          className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500">+{remaining}</span>
      )}
    </div>
  );
};

// Product badge component
const ProductBadge = ({ type }: { type: 'new' | 'sale' | 'bestseller' }) => {
  const badges = {
    new: { bg: 'bg-green-500', text: 'New', icon: Sparkles },
    sale: { bg: 'bg-red-500', text: 'Sale', icon: Tag },
    bestseller: { bg: 'bg-amber-500', text: 'Best Seller', icon: Star },
  };

  const badge = badges[type];
  const Icon = badge.icon;

  return (
    <span className={`${badge.bg} text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1`}>
      <Icon size={10} />
      {badge.text}
    </span>
  );
};

// Rating stars component
const RatingStars = ({ rating, reviewCount }: { rating?: number; reviewCount?: number }) => {
  const displayRating = rating || 0;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={`${
              i < fullStars
                ? 'text-yellow-400 fill-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {displayRating > 0 ? displayRating.toFixed(1) : 'N/A'}
        {reviewCount && reviewCount > 0 && (
          <span className="text-gray-400"> ({reviewCount})</span>
        )}
      </span>
    </div>
  );
};

// Product Card Component
const ProductCard = ({
  product,
  gridView,
  isWishlisted,
  onToggleWishlist,
  onQuickView
}: {
  product: Product;
  gridView: 'comfortable' | 'compact';
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onQuickView: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isCompact = gridView === 'compact';
  const hasDiscount = product.sale_price && product.sale_price < product.base_price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.sale_price! / product.base_price) * 100)
    : 0;

  // Check if product is new (within last 30 days)
  const isNew = product.is_new || (product.created_at &&
    new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return (
    <div
      className={`group bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-lg border-gray-300 -translate-y-1' : 'shadow-sm hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden ${isCompact ? 'aspect-square' : 'aspect-[4/3]'}`}>
        {/* Product Image */}
        {product.primary_image ? (
          <div className="relative w-full h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
            <Image
              src={product.primary_image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-transform duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNew && <ProductBadge type="new" />}
          {product.is_bestseller && <ProductBadge type="bestseller" />}
          {(product.is_on_sale || hasDiscount) && <ProductBadge type="sale" />}
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </div>
        )}

        {/* Hover Actions */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickView();
            }}
            className="bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            title="Quick View"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist();
            }}
            className={`p-3 rounded-full transition-colors shadow-lg ${
              isWishlisted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Wishlist button (always visible on mobile) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleWishlist();
          }}
          className={`md:hidden absolute top-2 right-2 p-2 rounded-full transition-colors ${
            isWishlisted
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-600'
          }`}
        >
          <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Content */}
      <Link href={`/products/configure/${product.slug}`}>
        <div className={`p-3 ${isCompact ? 'p-2' : 'p-4'}`}>
          {/* Category */}
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
            {product.category_name}
          </p>

          {/* Product Name */}
          <h3 className={`font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors ${
            isCompact ? 'text-sm' : 'text-base'
          }`}>
            {product.name}
          </h3>

          {/* Description (hidden in compact mode) */}
          {!isCompact && product.short_description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {product.short_description}
            </p>
          )}

          {/* Rating */}
          <div className="mt-2">
            <RatingStars rating={product.rating} reviewCount={product.review_count} />
          </div>

          {/* Color Options (hidden in compact mode) */}
          {!isCompact && product.color_options && (
            <ColorSwatch colors={product.color_options} />
          )}

          {/* Price */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-lg font-bold text-red-600">
                    ${product.sale_price!.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${product.base_price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className={`font-bold text-gray-900 ${isCompact ? 'text-base' : 'text-lg'}`}>
                  ${product.base_price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Configure Button (hidden in compact mode) */}
            {!isCompact && (
              <span className="text-xs text-blue-600 font-medium group-hover:underline">
                Configure
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function EnhancedProductGrid({
  products,
  gridView,
  wishlist,
  onToggleWishlist,
  onQuickView
}: EnhancedProductGridProps) {
  const gridClasses = gridView === 'compact'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

  return (
    <div className={`grid ${gridClasses}`}>
      {products.map((product) => (
        <ProductCard
          key={product.product_id}
          product={product}
          gridView={gridView}
          isWishlisted={wishlist.includes(product.product_id)}
          onToggleWishlist={() => onToggleWishlist(product.product_id)}
          onQuickView={() => onQuickView(product)}
        />
      ))}
    </div>
  );
}
