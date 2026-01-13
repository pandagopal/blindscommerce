'use client';

import React from 'react';
import { Truck, CheckCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface FreeShippingProgressBarProps {
  threshold?: number;
  className?: string;
  compact?: boolean;
}

const FreeShippingProgressBar: React.FC<FreeShippingProgressBarProps> = ({
  threshold = 99,
  className = '',
  compact = false
}) => {
  const { subtotal } = useCart();

  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - subtotal, 0);
  const qualifiesForFreeShipping = subtotal >= threshold;

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Truck className={`h-4 w-4 ${qualifiesForFreeShipping ? 'text-green-600' : 'text-gray-500'}`} />
          {qualifiesForFreeShipping ? (
            <span className="text-sm text-green-700 font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              FREE Shipping!
            </span>
          ) : (
            <span className="text-sm text-gray-700">
              Add <span className="font-bold text-green-600">${remaining.toFixed(2)}</span> for FREE shipping
            </span>
          )}
        </div>
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              qualifiesForFreeShipping
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-yellow-400 to-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${qualifiesForFreeShipping ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Truck className={`h-5 w-5 ${qualifiesForFreeShipping ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div>
            {qualifiesForFreeShipping ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700">You qualify for FREE shipping!</span>
              </div>
            ) : (
              <div>
                <span className="text-gray-700">Add </span>
                <span className="font-bold text-green-600 text-lg">${remaining.toFixed(2)}</span>
                <span className="text-gray-700"> more for </span>
                <span className="font-semibold text-green-600">FREE shipping</span>
              </div>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-500">
          ${subtotal.toFixed(2)} / ${threshold.toFixed(2)}
        </span>
      </div>

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out ${
            qualifiesForFreeShipping
              ? 'bg-green-500'
              : 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-green-500'
          }`}
          style={{ width: `${progress}%` }}
        />
        {/* Milestone markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[25, 50, 75].map((milestone) => (
            <div
              key={milestone}
              className="w-px h-full bg-white/50"
              style={{ marginLeft: `${milestone}%` }}
            />
          ))}
        </div>
      </div>

      {!qualifiesForFreeShipping && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Free shipping on all orders over ${threshold}
        </p>
      )}
    </div>
  );
};

export default FreeShippingProgressBar;
