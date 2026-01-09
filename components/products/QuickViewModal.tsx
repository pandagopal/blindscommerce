'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Heart, Star, ShoppingCart, ExternalLink, ZoomIn } from 'lucide-react';

interface Product {
  product_id: number;
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
}

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}

export default function QuickViewModal({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist
}: QuickViewModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const hasDiscount = product.sale_price && product.sale_price < product.base_price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.sale_price! / product.base_price) * 100)
    : 0;

  const displayRating = product.rating || 0;
  const fullStars = Math.floor(displayRating);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto transform transition-all duration-200 ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors shadow-lg"
          >
            <X size={20} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Section */}
            <div className="relative bg-gray-100 aspect-square md:aspect-auto md:h-full">
              {product.primary_image ? (
                <div
                  className={`relative w-full h-full min-h-[300px] cursor-zoom-in ${
                    imageZoomed ? 'cursor-zoom-out' : ''
                  }`}
                  onClick={() => setImageZoomed(!imageZoomed)}
                >
                  <Image
                    src={product.primary_image}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-300 ${
                      imageZoomed ? 'scale-150' : 'scale-100'
                    }`}
                  />
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-full p-2">
                    <ZoomIn size={16} className="text-gray-600" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full min-h-[300px] flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_new && (
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    NEW
                  </span>
                )}
                {product.is_bestseller && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    BEST SELLER
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-8 flex flex-col">
              {/* Category */}
              <p className="text-sm text-blue-600 font-medium uppercase tracking-wide mb-2">
                {product.category_name}
              </p>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={`${
                        i < fullStars
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {displayRating > 0 ? displayRating.toFixed(1) : 'No ratings'}
                  {product.review_count && product.review_count > 0 && (
                    <span className="text-gray-400"> ({product.review_count} reviews)</span>
                  )}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                {hasDiscount ? (
                  <>
                    <span className="text-3xl font-bold text-red-600">
                      ${product.sale_price!.toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      ${product.base_price.toFixed(2)}
                    </span>
                    <span className="text-sm text-red-500 font-medium">
                      Save ${(product.base_price - product.sale_price!).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    ${product.base_price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.short_description && (
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {/* Color Options */}
              {product.color_options && product.color_options.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Available Colors ({product.color_options.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.color_options.map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Actions */}
              <div className="space-y-3 mt-6">
                <Link
                  href={`/products/configure/${product.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ShoppingCart size={18} />
                  Configure & Add to Cart
                </Link>

                <div className="flex gap-3">
                  <button
                    onClick={onToggleWishlist}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border font-medium transition-colors ${
                      isWishlisted
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                    {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                  </button>

                  <Link
                    href={`/products/configure/${product.slug}`}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={18} />
                    <span className="hidden sm:inline">Full Details</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
