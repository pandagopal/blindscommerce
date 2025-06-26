/**
 * Cache Context for BlindsCommerce
 * Provides centralized cache management with manual invalidation
 */

'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useCacheInvalidator } from '@/hooks/useCache';

interface CacheContextValue {
  // Cache invalidation functions
  invalidateProducts: () => void;
  invalidateCart: () => void;
  invalidateUser: () => void;
  invalidateVendor: (vendorId?: number) => void;
  invalidateOrders: () => void;
  invalidateAll: () => void;
  
  // Cache stats
  lastInvalidated: Record<string, Date>;
  
  // Manual cache control UI visibility
  showCacheControls: boolean;
  setShowCacheControls: (show: boolean) => void;
}

const CacheContext = createContext<CacheContextValue | undefined>(undefined);

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const { invalidatePattern, invalidateAll: invalidateAllCache } = useCacheInvalidator();
  const [lastInvalidated, setLastInvalidated] = useState<Record<string, Date>>({});
  const [showCacheControls, setShowCacheControls] = useState(false);

  const updateLastInvalidated = useCallback((key: string) => {
    setLastInvalidated(prev => ({
      ...prev,
      [key]: new Date()
    }));
  }, []);

  const invalidateProducts = useCallback(() => {
    invalidatePattern(/cache:products/);
    invalidatePattern(/cache:product:/);
    updateLastInvalidated('products');
  }, [invalidatePattern, updateLastInvalidated]);

  const invalidateCart = useCallback(() => {
    invalidatePattern(/cache:cart/);
    updateLastInvalidated('cart');
  }, [invalidatePattern, updateLastInvalidated]);

  const invalidateUser = useCallback(() => {
    invalidatePattern(/cache:user/);
    invalidatePattern(/cache:profile/);
    updateLastInvalidated('user');
  }, [invalidatePattern, updateLastInvalidated]);

  const invalidateVendor = useCallback((vendorId?: number) => {
    if (vendorId) {
      invalidatePattern(`cache:vendor:${vendorId}`);
    } else {
      invalidatePattern(/cache:vendor/);
    }
    updateLastInvalidated('vendor');
  }, [invalidatePattern, updateLastInvalidated]);

  const invalidateOrders = useCallback(() => {
    invalidatePattern(/cache:orders/);
    invalidatePattern(/cache:order:/);
    updateLastInvalidated('orders');
  }, [invalidatePattern, updateLastInvalidated]);

  const invalidateAll = useCallback(() => {
    invalidateAllCache();
    updateLastInvalidated('all');
  }, [invalidateAllCache, updateLastInvalidated]);

  const value: CacheContextValue = {
    invalidateProducts,
    invalidateCart,
    invalidateUser,
    invalidateVendor,
    invalidateOrders,
    invalidateAll,
    lastInvalidated,
    showCacheControls,
    setShowCacheControls
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
}