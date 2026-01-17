'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Gift,
  Users,
  Mail,
  Twitter,
  Facebook,
  MessageCircle,
  Star,
  ChevronRight
} from 'lucide-react';

interface ReferralInfo {
  code: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  timesUsed: number;
  maxUses: number | null;
  stats: {
    totalReferrals: number;
    successfulReferrals: number;
    totalPointsEarned: number;
  };
  rewardInfo: {
    referrerReward: string;
    referredDiscount: string;
  };
}

interface Referral {
  referral_id: number;
  status: string;
  referrer_reward_points: number | null;
  created_at: string;
  completed_at: string | null;
  rewarded_at: string | null;
  first_name: string;
  last_initial: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-red-100 text-red-800' },
  rewarded: { label: 'Rewarded', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

export default function ReferralPage() {
  const { user } = useAuth();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);

  const referralLink = referralInfo ? `${window.location.origin}/register?ref=${referralInfo.code}` : '';

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [infoRes, historyRes] = await Promise.all([
        fetch('/api/v2/support/referral'),
        fetch(`/api/v2/support/referral/history?page=${page}&limit=10`),
      ]);

      if (infoRes.ok) {
        const data = await infoRes.json();
        if (data.success) setReferralInfo(data.data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        if (data.success) {
          setReferrals(data.data.referrals);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (referralInfo) {
      navigator.clipboard.writeText(referralInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Get 10% off at BlindsCommerce!');
    const body = encodeURIComponent(
      `Hey! I thought you might like this blinds store. Use my referral code ${referralInfo?.code} to get ${referralInfo?.discountValue}% off your first order!\n\nSign up here: ${referralLink}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      `Get ${referralInfo?.discountValue}% off your first order at BlindsCommerce! Use my code: ${referralInfo?.code}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/loyalty">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rewards
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refer Friends</h1>
          <p className="text-gray-600">Share the love and earn rewards</p>
        </div>
      </div>

      {/* How It Works */}
      <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium text-red-900">Share Your Code</h3>
                <p className="text-sm text-red-700">Send your unique referral code to friends</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium text-red-900">They Sign Up & Shop</h3>
                <p className="text-sm text-red-700">They get {referralInfo?.discountValue || 10}% off their first order</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium text-red-900">You Earn Points</h3>
                <p className="text-sm text-red-700">Get 500 loyalty points for each referral</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code */}
      {referralInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Referral Code</CardTitle>
            <CardDescription>Share this code with friends and family</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-100 rounded-lg p-4 text-center">
                <span className="text-3xl font-bold tracking-wider text-red-600">
                  {referralInfo.code}
                </span>
              </div>
              <Button onClick={copyToClipboard} variant="outline" size="lg">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">Or share your referral link:</p>
              <div className="flex items-center gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="bg-gray-50"
                />
                <Button onClick={copyLinkToClipboard} variant="outline">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">Share via:</p>
              <div className="flex items-center gap-3">
                <Button onClick={shareViaEmail} variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button onClick={shareViaTwitter} variant="outline" size="sm">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button onClick={shareViaFacebook} variant="outline" size="sm">
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {referralInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                  <p className="text-2xl font-bold">{referralInfo.stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Successful</p>
                  <p className="text-2xl font-bold">{referralInfo.stats.successfulReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Points Earned</p>
                  <p className="text-2xl font-bold">{referralInfo.stats.totalPointsEarned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {referrals.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Referrals Yet</h3>
              <p className="text-gray-500">Start sharing your code to earn rewards!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {referrals.map((referral) => {
                const status = statusConfig[referral.status] || statusConfig.pending;
                return (
                  <div key={referral.referral_id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {referral.first_name.charAt(0)}{referral.last_initial}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{referral.first_name} {referral.last_initial}.</p>
                        <p className="text-sm text-gray-500">Referred {formatDate(referral.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {referral.referrer_reward_points && (
                        <span className="text-green-600 font-medium">
                          +{referral.referrer_reward_points} pts
                        </span>
                      )}
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Referral Program Terms</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your friend must be a new customer to qualify</li>
            <li>• They must use your code at signup or checkout</li>
            <li>• Points are awarded after their first completed order</li>
            <li>• There's no limit to how many friends you can refer!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
