/**
 * Frontend Caching Hook for BlindsCommerce
 * Provides manual cache management with localStorage persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheOptions {
  // Persist cache to localStorage
  persist?: boolean;
  // Manual invalidation only - no automatic expiry
  manualInvalidation?: boolean;
  // Custom cache key prefix
  keyPrefix?: string;
  // Callback when cache is invalidated
  onInvalidate?: () => void;
}

interface CacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  lastFetched: Date | null;
  invalidate: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Global cache store for in-memory caching
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// Track cache invalidation across components
const cacheListeners = new Map<string, Set<() => void>>();

// Notify all listeners when cache is invalidated
function notifyCacheInvalidation(key: string) {
  const listeners = cacheListeners.get(key);
  if (listeners) {
    listeners.forEach(listener => listener());
  }
}

/**
 * Hook for cached data fetching with manual invalidation
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): CacheResult<T> {
  const {
    persist = true,
    manualInvalidation = true,
    keyPrefix = 'cache',
    onInvalidate
  } = options;

  const fullKey = `${keyPrefix}:${key}`;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const isMountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Load from cache on mount
  useEffect(() => {
    // Check memory cache first
    const memoryCached = memoryCache.get(fullKey);
    if (memoryCached) {
      setData(memoryCached.data);
      setLastFetched(new Date(memoryCached.timestamp));
      setLoading(false);
      return;
    }

    // Check localStorage if persist is enabled
    if (persist) {
      try {
        const stored = localStorage.getItem(fullKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setData(parsed.data);
          setLastFetched(new Date(parsed.timestamp));
          memoryCache.set(fullKey, parsed);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Failed to load from localStorage:', err);
      }
    }

    // No cache found, fetch data
    setLoading(false);
  }, [fullKey, persist]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      
      if (!isMountedRef.current) return;

      const cacheEntry = {
        data: result,
        timestamp: Date.now()
      };

      // Update memory cache
      memoryCache.set(fullKey, cacheEntry);

      // Update localStorage
      if (persist) {
        try {
          localStorage.setItem(fullKey, JSON.stringify(cacheEntry));
        } catch (err) {
          console.error('Failed to save to localStorage:', err);
        }
      }

      setData(result);
      setLastFetched(new Date());
      setIsStale(false);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err as Error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fullKey, persist]);

  // Initial fetch if no cache
  useEffect(() => {
    if (data === null && !loading && !error) {
      fetchData();
    }
  }, [data, loading, error, fetchData]);

  // Invalidate cache
  const invalidate = useCallback(async () => {
    // Clear memory cache
    memoryCache.delete(fullKey);

    // Clear localStorage
    if (persist) {
      localStorage.removeItem(fullKey);
    }

    // Mark as stale
    setIsStale(true);

    // Notify other components
    notifyCacheInvalidation(fullKey);

    // Call custom callback
    if (onInvalidate) {
      onInvalidate();
    }

    // Refetch data
    await fetchData();
  }, [fullKey, persist, onInvalidate, fetchData]);

  // Refresh data (fetch without clearing cache)
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Listen for cache invalidation from other components
  useEffect(() => {
    const listener = () => {
      setIsStale(true);
      fetchData();
    };

    if (!cacheListeners.has(fullKey)) {
      cacheListeners.set(fullKey, new Set());
    }
    cacheListeners.get(fullKey)!.add(listener);

    return () => {
      const listeners = cacheListeners.get(fullKey);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          cacheListeners.delete(fullKey);
        }
      }
    };
  }, [fullKey, fetchData]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isStale,
    lastFetched,
    invalidate,
    refresh
  };
}

/**
 * Hook for invalidating multiple cache keys at once
 */
export function useCacheInvalidator() {
  const invalidatePattern = useCallback((pattern: string | RegExp) => {
    let keysToInvalidate: string[] = [];

    // Find matching keys in memory cache
    memoryCache.forEach((_, key) => {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          keysToInvalidate.push(key);
        }
      } else {
        if (pattern.test(key)) {
          keysToInvalidate.push(key);
        }
      }
    });

    // Find matching keys in localStorage
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (typeof pattern === 'string') {
          if (key.includes(pattern)) {
            keysToInvalidate.push(key);
          }
        } else {
          if (pattern.test(key)) {
            keysToInvalidate.push(key);
          }
        }
      }
    }

    // Invalidate all matching keys
    keysToInvalidate.forEach(key => {
      memoryCache.delete(key);
      localStorage.removeItem(key);
      notifyCacheInvalidation(key);
    });

    return keysToInvalidate.length;
  }, []);

  const invalidateAll = useCallback(() => {
    // Clear memory cache
    memoryCache.clear();

    // Clear all cache entries from localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Notify all listeners
    cacheListeners.forEach((_, key) => notifyCacheInvalidation(key));
  }, []);

  return {
    invalidatePattern,
    invalidateAll
  };
}

/**
 * Preload data into cache
 */
export function preloadCache<T>(
  key: string,
  data: T,
  options: { persist?: boolean; keyPrefix?: string } = {}
) {
  const { persist = true, keyPrefix = 'cache' } = options;
  const fullKey = `${keyPrefix}:${key}`;
  
  const cacheEntry = {
    data,
    timestamp: Date.now()
  };

  // Update memory cache
  memoryCache.set(fullKey, cacheEntry);

  // Update localStorage
  if (persist) {
    try {
      localStorage.setItem(fullKey, JSON.stringify(cacheEntry));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {
    memoryCacheSize: memoryCache.size,
    localStorageEntries: 0,
    totalSizeBytes: 0
  };

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache:')) {
        stats.localStorageEntries++;
        const value = localStorage.getItem(key);
        if (value) {
          stats.totalSizeBytes += new Blob([value]).size;
        }
      }
    }
  }

  return stats;
}