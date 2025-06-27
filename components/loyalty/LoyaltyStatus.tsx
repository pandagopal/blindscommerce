'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, Star, Gift, TrendingUp } from 'lucide-react';

interface LoyaltyStatus {
  currentTier: {
    name: string;
    level: number;
    color: string;
    discountPercentage: number;
    pointsMultiplier: number;
  };
  availablePoints: number;
  pointsExpiringSoon: number;
  lifetimeSpending: number;
  nextTier?: {
    name: string;
    spendingToNextTier: number;
  };
}

interface LoyaltyStatusProps {
  className?: string;
  showFullDetails?: boolean;
}

const LoyaltyStatus: React.FC<LoyaltyStatusProps> = ({ 
  className = '',
  showFullDetails = false 
}) => {
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyStatus();
  }, []);

  const fetchLoyaltyStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/users/loyalty/account');
      
      if (!response.ok) {
        // If user is not logged in or doesn't have a loyalty account, don't show component
        if (response.status === 401 || response.status === 404) {
          setLoyaltyStatus(null);
          return;
        }
        throw new Error('Failed to fetch loyalty status');
      }

      const data = await response.json();
      
      if (data.success) {
        setLoyaltyStatus(data.account);
      } else {
        throw new Error(data.error || 'Failed to load loyalty status');
      }
    } catch (err) {
      console.error('Error fetching loyalty status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load loyalty status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-24"></div>
      </div>
    );
  }

  if (error || !loyaltyStatus) {
    return null; // Don't show anything if there's an error or no loyalty account
  }

  const getProgressToNextTier = () => {
    if (!loyaltyStatus.nextTier) return 100;
    
    const totalNeeded = loyaltyStatus.nextTier.spendingToNextTier;
    const currentProgress = loyaltyStatus.lifetimeSpending;
    const previousTierSpending = currentProgress - totalNeeded;
    
    return Math.min(100, ((currentProgress - previousTierSpending) / totalNeeded) * 100);
  };

  if (!showFullDetails) {
    // Compact version for header/sidebar
    return (
      <Link
        href="/account/loyalty"
        className={`block bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-4 hover:from-purple-700 hover:to-blue-700 transition-all ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6" style={{ color: loyaltyStatus.currentTier.color }} />
            <div>
              <p className="font-semibold">{loyaltyStatus.currentTier.name} Member</p>
              <p className="text-sm opacity-90">{loyaltyStatus.availablePoints.toLocaleString()} points</p>
            </div>
          </div>
          <div className="text-right">
            {loyaltyStatus.currentTier.discountPercentage > 0 && (
              <p className="text-lg font-bold">{loyaltyStatus.currentTier.discountPercentage}% OFF</p>
            )}
            <p className="text-xs opacity-75">
              {loyaltyStatus.currentTier.pointsMultiplier}x points
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Full version for dashboard
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Loyalty Program</h2>
          <Link
            href="/account/loyalty"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details →
          </Link>
        </div>

        {/* Current Tier Status */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8" style={{ color: loyaltyStatus.currentTier.color }} />
              <div>
                <h3 className="font-semibold text-lg" style={{ color: loyaltyStatus.currentTier.color }}>
                  {loyaltyStatus.currentTier.name} Tier
                </h3>
                <p className="text-sm text-gray-600">
                  Level {loyaltyStatus.currentTier.level} Member
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {loyaltyStatus.availablePoints.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Available Points</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-sm text-gray-600">Earn Rate</p>
            <p className="font-semibold">{loyaltyStatus.currentTier.pointsMultiplier}x points</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Gift className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-gray-600">Discount</p>
            <p className="font-semibold">
              {loyaltyStatus.currentTier.discountPercentage > 0 
                ? `${loyaltyStatus.currentTier.discountPercentage}%` 
                : 'None'}
            </p>
          </div>
        </div>

        {/* Expiring Points Warning */}
        {loyaltyStatus.pointsExpiringSoon > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <p className="text-sm text-orange-800">
                <strong>{loyaltyStatus.pointsExpiringSoon}</strong> points expiring soon
              </p>
            </div>
          </div>
        )}

        {/* Progress to Next Tier */}
        {loyaltyStatus.nextTier && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress to {loyaltyStatus.nextTier.name}</span>
              <span>${loyaltyStatus.nextTier.spendingToNextTier.toFixed(0)} to go</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressToNextTier()}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Spend ${loyaltyStatus.nextTier.spendingToNextTier.toFixed(2)} more to reach {loyaltyStatus.nextTier.name}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 mt-4">
          <Link
            href="/account/loyalty?tab=rewards"
            className="flex-1 bg-blue-600 text-white text-center py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Rewards
          </Link>
          <Link
            href="/products"
            className="flex-1 bg-gray-600 text-white text-center py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Earn Points
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyStatus;