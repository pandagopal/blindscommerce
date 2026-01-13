'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, ChevronUp } from 'lucide-react';

interface StickyAddToCartProps {
  productName: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  onAddToCart: () => void;
  isConfigured?: boolean;
  showAfterScroll?: number; // Pixels to scroll before showing
  disabled?: boolean;
}

const StickyAddToCart: React.FC<StickyAddToCartProps> = ({
  productName,
  price,
  originalPrice,
  imageUrl,
  onAddToCart,
  isConfigured = true,
  showAfterScroll = 400,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  const handleAddToCart = async () => {
    if (disabled || isAdding) return;

    setIsAdding(true);
    try {
      await onAddToCart();
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Shadow overlay */}
      <div className="absolute inset-x-0 -top-4 h-4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Product Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {imageUrl && (
                <div className="hidden sm:block w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                  {productName}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-red">
                    ${price.toFixed(2)}
                  </span>
                  {originalPrice && originalPrice > price && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ${originalPrice.toFixed(2)}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Scroll to top button */}
              <button
                onClick={scrollToTop}
                className="hidden sm:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Scroll to top"
              >
                <ChevronUp className="h-5 w-5" />
              </button>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={disabled || isAdding || !isConfigured}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  disabled || !isConfigured
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isAdding
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-red hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {isAdding ? 'Added!' : !isConfigured ? 'Configure First' : 'Add to Cart'}
                </span>
                <span className="sm:hidden">
                  {isAdding ? 'Added!' : 'Add'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyAddToCart;
