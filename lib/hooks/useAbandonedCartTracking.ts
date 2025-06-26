'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';

interface TrackingOptions {
  trackingDelay?: number; // Minutes before tracking as abandoned (default: 5)
  emailRequired?: boolean; // Whether email is required for tracking
}

export const useAbandonedCartTracking = (options: TrackingOptions = {}) => {
  const { cart, totalAmount, itemCount } = useCart();
  const trackingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackingRef = useRef<string>('');
  
  const {
    trackingDelay = 5, // 5 minutes default
    emailRequired = false
  } = options;

  const getCartId = () => {
    // Generate or get existing cart ID
    let cartId = localStorage.getItem('cart_id');
    if (!cartId) {
      cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_id', cartId);
    }
    return cartId;
  };

  const getCustomerEmail = () => {
    // Try to get email from various sources
    const guestEmail = localStorage.getItem('guest_email');
    const checkoutEmail = localStorage.getItem('checkout_email');
    
    return guestEmail || checkoutEmail || null;
  };

  const getCustomerName = () => {
    const guestName = localStorage.getItem('guest_name');
    const checkoutName = localStorage.getItem('checkout_name');
    
    return guestName || checkoutName || null;
  };

  const getTrackingData = () => {
    return {
      sourcePage: window.location.href,
      deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent,
      utmSource: new URLSearchParams(window.location.search).get('utm_source'),
      utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
      utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
    };
  };

  const trackAbandonedCart = async () => {
    if (!cart || cart.length === 0 || totalAmount <= 0) {
      return;
    }

    const email = getCustomerEmail();
    
    // Skip tracking if email is required but not available
    if (emailRequired && !email) {
      return;
    }

    // Skip if we don't have an email at all
    if (!email) {
      return;
    }

    const cartId = getCartId();
    const currentCartSignature = `${cartId}_${itemCount}_${totalAmount.toFixed(2)}`;
    
    // Skip if we already tracked this exact cart state
    if (lastTrackingRef.current === currentCartSignature) {
      return;
    }

    try {
      const response = await fetch('/api/v2/commerce/cart/abandoned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId,
          email,
          cartData: {
            items: cart.map(item => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
              quantity: item.quantity,
              price: item.price,
              image: item.image,
              configuration: item.configuration
            }))
          },
          totalValue: totalAmount,
          itemCount,
          customerName: getCustomerName(),
          ...getTrackingData()
        }),
      });

      if (response.ok) {
        lastTrackingRef.current = currentCartSignature;
      }
    } catch (error) {
      console.error('Failed to track abandoned cart:', error);
    }
  };

  const scheduleTracking = () => {
    // Clear existing timeout
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
    }

    // Schedule new tracking
    trackingTimeoutRef.current = setTimeout(() => {
      trackAbandonedCart();
    }, trackingDelay * 60 * 1000); // Convert minutes to milliseconds
  };

  const cancelTracking = () => {
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
      trackingTimeoutRef.current = null;
    }
  };

  // Track when cart changes (items added/removed/modified)
  useEffect(() => {
    if (cart && cart.length > 0 && totalAmount > 0) {
      scheduleTracking();
    } else {
      cancelTracking();
    }

    return () => {
      cancelTracking();
    };
  }, [cart, totalAmount, itemCount]);

  // Track when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (cart && cart.length > 0 && totalAmount > 0) {
        // Use sendBeacon for reliable tracking on page unload
        const email = getCustomerEmail();
        if (email) {
          const cartId = getCartId();
          const data = JSON.stringify({
            cartId,
            email,
            cartData: { items: cart },
            totalValue: totalAmount,
            itemCount,
            customerName: getCustomerName(),
            ...getTrackingData()
          });

          if ('sendBeacon' in navigator) {
            navigator.sendBeacon('/api/cart/abandoned', data);
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cart, totalAmount, itemCount]);

  // Cancel tracking when user starts checkout
  const markCheckoutStarted = () => {
    cancelTracking();
    // Clear the tracking signature so we don't track this cart again
    lastTrackingRef.current = '';
  };

  // Mark cart as recovered when order is completed
  const markCartRecovered = async (orderId: number, orderValue: number) => {
    const recoveryToken = localStorage.getItem('recovery_token');
    if (recoveryToken) {
      try {
        await fetch(`/api/v2/commerce/cart/recover/${recoveryToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            orderValue
          }),
        });
        
        // Clear recovery token
        localStorage.removeItem('recovery_token');
      } catch (error) {
        console.error('Failed to mark cart as recovered:', error);
      }
    }
    
    // Cancel any pending tracking
    cancelTracking();
    lastTrackingRef.current = '';
  };

  return {
    markCheckoutStarted,
    markCartRecovered,
    scheduleTracking,
    cancelTracking
  };
};