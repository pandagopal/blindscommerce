'use client';

import React, { useState, useEffect } from 'react';
import { Crown, Gift, Calendar, TrendingUp, Star, Award, Clock, Info } from 'lucide-react';

interface LoyaltyTier {
  id: number;
  name: string;
  level: number;
  color: string;
  icon: string;
  description: string;
  pointsMultiplier: number;
  discountPercentage: number;
  freeShippingThreshold: number;
  earlyAccessHours: number;
  exclusiveProducts: boolean;
  prioritySupport: boolean;
}

interface LoyaltyAccount {
  id: number;
  totalPointsEarned: number;
  availablePoints: number;
  pointsRedeemed: number;
  pointsExpired: number;
  pointsExpiringSoon: number;
  lifetimeSpending: number;
  currentYearSpending: number;
  lastPurchaseDate: string;
  currentTier: LoyaltyTier;
  nextTier?: {
    id: number;
    name: string;
    minimumSpending: number;
    pointsToNextTier: number;
    spendingToNextTier: number;
  };
  accountStatus: string;
  enrollmentDate: string;
  tierAnniversaryDate: string;
  recentTransactions: Array<{
    type: string;
    points: number;
    description: string;
    date: string;
    expiryDate?: string;
  }>;
}

interface LoyaltyReward {
  id: number;
  name: string;
  type: string;
  pointsCost: number;
  discountValue?: number;
  discountPercentage?: number;
  description: string;
  image?: string;
  termsConditions?: string;
  canAfford: boolean;
  isAvailable: boolean;
  canRedeem: boolean;
  isFeatured: boolean;
  validUntil?: string;
  minimumOrderValue: number;
}

const LoyaltyPage: React.FC = () => {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'history'>('overview');
  const [redeemingReward, setRedeemingReward] = useState<number | null>(null);

  useEffect(() => {
    fetchLoyaltyAccount();
    fetchRewards();
  }, []);

  const fetchLoyaltyAccount = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/loyalty/account');
      
      if (!response.ok) {
        throw new Error('Failed to fetch loyalty account');
      }

      const data = await response.json();
      
      if (data.success) {
        setAccount(data.account);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching loyalty account:', err);
      setError(err instanceof Error ? err.message : 'Failed to load loyalty account');
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      setRewardsLoading(true);
      const response = await fetch('/api/loyalty/rewards');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }

      const data = await response.json();
      
      if (data.success) {
        setRewards(data.rewards);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
      // Don't set main error for rewards failure
    } finally {
      setRewardsLoading(false);
    }
  };

  const redeemReward = async (rewardId: number) => {
    try {
      setRedeemingReward(rewardId);
      
      const response = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to redeem reward');
      }

      // Refresh account and rewards data
      await Promise.all([fetchLoyaltyAccount(), fetchRewards()]);

      // Show success message (you might want to use a toast notification)
      alert(`Reward redeemed successfully! ${data.redemption.couponCode ? `Your coupon code: ${data.redemption.couponCode}` : ''}`);

    } catch (err) {
      console.error('Error redeeming reward:', err);
      alert(err instanceof Error ? err.message : 'Failed to redeem reward');
    } finally {
      setRedeemingReward(null);
    }
  };

  const getProgressToNextTier = () => {
    if (!account?.nextTier) return 100;
    
    const currentSpending = account.lifetimeSpending;
    const totalNeeded = account.nextTier.minimumSpending;
    const previousTierSpending = totalNeeded - account.nextTier.spendingToNextTier;
    
    return Math.min(100, ((currentSpending - previousTierSpending) / (totalNeeded - previousTierSpending)) * 100);
  };

  const formatRewardType = (type: string) => {
    switch (type) {
      case 'discount_percentage': return 'Percentage Discount';
      case 'discount_fixed': return 'Fixed Discount';
      case 'free_shipping': return 'Free Shipping';
      case 'free_product': return 'Free Product';
      case 'exclusive_access': return 'Exclusive Access';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loyalty Program</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Failed to load loyalty account'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Loyalty Program</h1>

      {/* Account Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Points</p>
              <p className="text-2xl font-bold text-blue-600">{account.availablePoints.toLocaleString()}</p>
            </div>
            <Star className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Tier</p>
              <p className="text-xl font-bold" style={{ color: account.currentTier.color }}>
                {account.currentTier.name}
              </p>
            </div>
            <Crown className="w-8 h-8" style={{ color: account.currentTier.color }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lifetime Spending</p>
              <p className="text-2xl font-bold text-green-600">${account.lifetimeSpending.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Points Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">{account.pointsExpiringSoon}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      {account.nextTier && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Progress to {account.nextTier.name}</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Spending Progress</span>
                <span>${account.lifetimeSpending.toFixed(2)} / ${account.nextTier.minimumSpending.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressToNextTier()}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Spend ${account.nextTier.spendingToNextTier.toFixed(2)} more to reach {account.nextTier.name} tier
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Award },
            { id: 'rewards', label: 'Rewards', icon: Gift },
            { id: 'history', label: 'History', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Tier Benefits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your {account.currentTier.name} Tier Benefits</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Earn {account.currentTier.pointsMultiplier}x points on purchases</span>
              </div>
              {account.currentTier.discountPercentage > 0 && (
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-green-500" />
                  <span>{account.currentTier.discountPercentage}% discount on all orders</span>
                </div>
              )}
              {account.currentTier.freeShippingThreshold > 0 && (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Free shipping on orders over ${account.currentTier.freeShippingThreshold}</span>
                </div>
              )}
              {account.currentTier.earlyAccessHours > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span>{account.currentTier.earlyAccessHours} hours early access to sales</span>
                </div>
              )}
              {account.currentTier.prioritySupport && (
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-red-500" />
                  <span>Priority customer support</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Points Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Earned:</span>
                  <span className="font-medium">{account.totalPointsEarned.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-medium text-blue-600">{account.availablePoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Redeemed:</span>
                  <span className="font-medium">{account.pointsRedeemed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="font-medium text-red-600">{account.pointsExpired.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Account Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Member Since:</span>
                  <span className="font-medium">{new Date(account.enrollmentDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tier Anniversary:</span>
                  <span className="font-medium">{new Date(account.tierAnniversaryDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Purchase:</span>
                  <span className="font-medium">
                    {account.lastPurchaseDate ? new Date(account.lastPurchaseDate).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Account Status:</span>
                  <span className={`font-medium capitalize ${
                    account.accountStatus === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {account.accountStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Available Rewards</h2>
            <div className="text-sm text-gray-600">
              You have {account.availablePoints.toLocaleString()} points to spend
            </div>
          </div>

          {rewardsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  {reward.image && (
                    <img
                      src={reward.image}
                      alt={reward.name}
                      className="w-full h-32 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{reward.name}</h3>
                      {reward.isFeatured && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        {reward.pointsCost.toLocaleString()} points
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatRewardType(reward.type)}
                      </span>
                    </div>

                    {reward.minimumOrderValue > 0 && (
                      <p className="text-xs text-gray-500 mb-3">
                        Min. order: ${reward.minimumOrderValue.toFixed(2)}
                      </p>
                    )}

                    <button
                      onClick={() => redeemReward(reward.id)}
                      disabled={!reward.canRedeem || redeemingReward === reward.id}
                      className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                        reward.canRedeem
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {redeemingReward === reward.id ? 'Redeeming...' : 
                       !reward.canAfford ? 'Insufficient Points' :
                       !reward.isAvailable ? 'Not Available' :
                       'Redeem'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Points Activity</h2>
          </div>
          <div className="divide-y">
            {account.recentTransactions.map((transaction, index) => (
              <div key={index} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString()}
                    {transaction.expiryDate && (
                      <span className="ml-2">
                        • Expires: {new Date(transaction.expiryDate).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`font-bold ${
                  transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.points > 0 ? '+' : ''}{transaction.points} points
                </div>
              </div>
            ))}
            
            {account.recentTransactions.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyPage;