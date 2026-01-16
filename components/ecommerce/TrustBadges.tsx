'use client';

import React from 'react';
import { Shield, Lock, Truck, RotateCcw, Award, CreditCard } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'horizontal' | 'vertical' | 'grid';
  showAll?: boolean;
  className?: string;
  compact?: boolean;
}

const badges = [
  {
    id: 'secure',
    icon: Lock,
    title: 'Secure Checkout',
    description: '256-bit SSL encryption',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'guarantee',
    icon: Shield,
    title: 'Satisfaction Guarantee',
    description: '30-day money back',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'shipping',
    icon: Truck,
    title: 'Free Shipping',
    description: 'On eligible orders',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'warranty',
    icon: Award,
    title: 'Lifetime Warranty',
    description: 'Quality guaranteed',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'returns',
    icon: RotateCcw,
    title: 'Easy Returns',
    description: 'Hassle-free process',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'Secure Payment',
    description: 'All major cards accepted',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
];

const TrustBadges: React.FC<TrustBadgesProps> = ({
  variant = 'horizontal',
  showAll = false,
  className = '',
  compact = false
}) => {
  const displayBadges = showAll ? badges : badges.slice(0, 4);

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
        {displayBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 text-gray-600"
              title={badge.description}
            >
              <Icon className={`h-4 w-4 ${badge.color}`} />
              <span className="text-xs font-medium">{badge.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`space-y-3 ${className}`}>
        {displayBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className={`p-2 rounded-full ${badge.bgColor}`}>
                <Icon className={`h-5 w-5 ${badge.color}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{badge.title}</p>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
        {displayBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.id}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`p-3 rounded-full ${badge.bgColor} mb-3`}>
                <Icon className={`h-6 w-6 ${badge.color}`} />
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">{badge.title}</p>
              <p className="text-xs text-gray-500">{badge.description}</p>
            </div>
          );
        })}
      </div>
    );
  }

  // Default: horizontal
  return (
    <div className={`flex flex-wrap items-center justify-center gap-6 py-4 ${className}`}>
      {displayBadges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            className="flex items-center gap-2 group"
          >
            <div className={`p-2 rounded-full ${badge.bgColor} group-hover:scale-110 transition-transform`}>
              <Icon className={`h-5 w-5 ${badge.color}`} />
            </div>
            <div className="hidden sm:block">
              <p className="font-medium text-gray-900 text-sm leading-tight">{badge.title}</p>
              <p className="text-xs text-gray-500">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Inline trust bar for checkout
export const TrustBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-gray-50 border-y border-gray-200 py-3 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Lock className="h-4 w-4 text-green-600" />
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="h-4 w-4 text-blue-600" />
            <span>30-Day Guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Truck className="h-4 w-4 text-purple-600" />
            <span>Free Shipping on eligible orders</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Award className="h-4 w-4 text-orange-600" />
            <span>Lifetime Warranty</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payment icons display
export const PaymentIcons: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="text-xs text-gray-500">We accept:</div>
      <div className="flex items-center gap-2">
        {/* Visa */}
        <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-blue-600">VISA</span>
        </div>
        {/* Mastercard */}
        <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-orange-600">MC</span>
        </div>
        {/* Amex */}
        <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-blue-500">AMEX</span>
        </div>
        {/* PayPal */}
        <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-blue-700">PP</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
