'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Gift, Timer, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Exit Intent Popup Component
 *
 * Shows a discount offer when user tries to leave the page.
 * Triggers after 5 seconds on the page when mouse moves toward browser close button.
 *
 * The coupon is fetched dynamically from the API:
 * GET /api/v2/commerce/homepage-popup-coupon
 *
 * To configure a coupon for the popup:
 * 1. Go to Vendor Dashboard > Discounts & Coupons > Coupons tab
 * 2. Create a new coupon or edit an existing one
 * 3. Check "Show in Homepage Popup" checkbox
 * 4. Only ONE coupon can be shown - the most recent active one with this flag
 */
interface CouponData {
  code: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  discountPercent: number | null;
  minimumOrderValue: number;
  maximumDiscount: number | null;
  validUntil: string | null;
}

interface ExitIntentPopupProps {
  // Optional props to override API values (for testing or static usage)
  discountCode?: string;
  discountPercent?: number;
  expiryMinutes?: number;
}

const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({
  discountCode: propDiscountCode,
  discountPercent: propDiscountPercent,
  expiryMinutes = 30
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiryMinutes * 60);
  const [isReady, setIsReady] = useState(false);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [couponLoaded, setCouponLoaded] = useState(false);

  // Use props if provided, otherwise use API data
  const discountCode = propDiscountCode || coupon?.code || 'SAVE10';
  const discountPercent = propDiscountPercent || coupon?.discountPercent || coupon?.discountValue || 10;

  // Fetch coupon from API
  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const response = await fetch('/api/v2/commerce/homepage-popup-coupon');
        const data = await response.json();

        if (data.success && data.data?.coupon) {
          setCoupon(data.data.coupon);
        }
      } catch (error) {
        console.error('Failed to fetch homepage popup coupon:', error);
      } finally {
        setCouponLoaded(true);
      }
    };

    // Only fetch if no props were provided
    if (!propDiscountCode && !propDiscountPercent) {
      fetchCoupon();
    } else {
      setCouponLoaded(true);
    }
  }, [propDiscountCode, propDiscountPercent]);

  // Check if popup has been shown recently
  const hasShownRecently = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const lastShown = localStorage.getItem('exit-intent-shown');
    if (!lastShown) return false;
    const hoursSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
    return hoursSinceShown < 24; // Don't show again for 24 hours
  }, []);

  // Add delay before enabling exit intent detection
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 5000); // Wait 5 seconds before enabling exit intent

    return () => clearTimeout(timer);
  }, []);

  // Exit intent detection
  useEffect(() => {
    if (!isReady || !couponLoaded || hasShownRecently()) return;

    // Don't enable if no coupon is available (unless props were provided)
    if (!propDiscountCode && !coupon) return;

    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      lastY = e.clientY;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && lastY > e.clientY && !isVisible) {
        setIsVisible(true);
        localStorage.setItem('exit-intent-shown', Date.now().toString());
      }
    };

    const handleVisibilityChange = () => {
      if (!isReady) return;

      if (document.visibilityState === 'hidden' && !hasShownRecently()) {
        localStorage.setItem('exit-intent-pending', 'true');
      } else if (document.visibilityState === 'visible') {
        const pending = localStorage.getItem('exit-intent-pending');
        if (pending && !hasShownRecently()) {
          setIsVisible(true);
          localStorage.setItem('exit-intent-shown', Date.now().toString());
          localStorage.removeItem('exit-intent-pending');
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVisible, isReady, couponLoaded, coupon, propDiscountCode, hasShownRecently]);

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = discountCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Format discount display based on type
  const getDiscountDisplay = () => {
    if (coupon?.discountType === 'fixed_amount' || coupon?.discountType === 'fixed') {
      return `$${discountPercent} OFF`;
    }
    return `${discountPercent}% OFF`;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary-red to-red-600 text-white p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Wait! Don't Leave Yet!</h2>
            <p className="text-white/90">Here's a special offer just for you</p>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="text-5xl font-bold text-primary-red mb-2">
                {getDiscountDisplay()}
              </div>
              <p className="text-gray-600">
                {coupon?.description || 'Use code at checkout for instant savings'}
              </p>
              {coupon?.minimumOrderValue && coupon.minimumOrderValue > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Min. order: ${coupon.minimumOrderValue}
                </p>
              )}
            </div>

            {/* Coupon Code */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold tracking-wider text-gray-800">
                  {discountCode}
                </span>
                <button
                  onClick={copyCode}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-red text-white hover:bg-red-700'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Timer */}
            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-6">
                <Timer className="h-5 w-5" />
                <span className="font-medium">
                  Offer expires in {formatTime(timeLeft)}
                </span>
              </div>
            )}

            {/* CTA Button */}
            <Link
              href="/products"
              onClick={handleClose}
              className="inline-flex items-center justify-center gap-2 w-full bg-primary-red hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Shop Now & Save
              <ArrowRight className="h-5 w-5" />
            </Link>

            <button
              onClick={handleClose}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              No thanks, I'll pay full price
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExitIntentPopup;
