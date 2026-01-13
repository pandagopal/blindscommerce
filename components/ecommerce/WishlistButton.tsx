'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist, WishlistItem } from '@/context/WishlistContext';

interface WishlistButtonProps {
  product: Omit<WishlistItem, 'added_at'>;
  variant?: 'icon' | 'button' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  product,
  variant = 'icon',
  size = 'md',
  className = '',
  showLabel = false
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inWishlist = mounted ? isInWishlist(product.product_id) : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    toggleWishlist(product);

    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`${buttonSizeClasses[size]} rounded-full transition-all duration-200 ${
          inWishlist
            ? 'bg-red-50 hover:bg-red-100'
            : 'bg-white/80 hover:bg-white shadow-sm'
        } ${isAnimating ? 'scale-125' : 'scale-100'} ${className}`}
        title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart
          className={`${sizeClasses[size]} transition-all ${
            inWishlist
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 hover:text-red-400'
          } ${isAnimating ? 'animate-pulse' : ''}`}
        />
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          inWishlist
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
        } ${isAnimating ? 'scale-105' : 'scale-100'} ${className}`}
      >
        <Heart
          className={`${sizeClasses[size]} ${
            inWishlist ? 'fill-red-500 text-red-500' : ''
          }`}
        />
        {showLabel && (
          <span>{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
        )}
      </button>
    );
  }

  // Text variant
  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
        inWishlist
          ? 'text-red-600 hover:text-red-700'
          : 'text-gray-500 hover:text-red-500'
      } ${className}`}
    >
      <Heart
        className={`${sizeClasses[size]} ${
          inWishlist ? 'fill-red-500' : ''
        } ${isAnimating ? 'animate-bounce' : ''}`}
      />
      {showLabel && (
        <span>{inWishlist ? 'Saved' : 'Save for Later'}</span>
      )}
    </button>
  );
};

export default WishlistButton;
