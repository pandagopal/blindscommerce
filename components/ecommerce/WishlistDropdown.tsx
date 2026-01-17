'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Heart, X, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';

interface WishlistDropdownProps {
  className?: string;
}

const WishlistDropdown: React.FC<WishlistDropdownProps> = ({ className = '' }) => {
  const { items, removeItem, itemCount } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-red-500 transition-colors"
        title="Wishlist"
      >
        <Heart className={`h-6 w-6 ${itemCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">My Wishlist</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Items */}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="inline-block text-sm text-primary-red hover:underline"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.product_id} className="p-3 hover:bg-gray-50">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <Link
                        href={`/products/configure/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Heart className="h-6 w-6" />
                          </div>
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/configure/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="font-medium text-gray-900 text-sm hover:text-primary-red line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.category_name && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.category_name}</p>
                        )}
                        <p className="text-sm font-semibold text-primary-red mt-1">
                          ${item.base_price.toFixed(2)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/products/configure/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Configure & Add to Cart"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Link
                href="/wishlist"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-2 bg-primary-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                View All ({itemCount} items)
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistDropdown;
