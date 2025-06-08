'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';

interface RecentlyViewedProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  primaryImage?: string;
  categoryName: string;
  brandName?: string;
  viewedAt: string;
}

interface RecentlyViewedContextType {
  products: RecentlyViewedProduct[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;
  clearAll: () => Promise<void>;
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  initialized: boolean;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};

interface RecentlyViewedProviderProps {
  children: ReactNode;
}

export const RecentlyViewedProvider: React.FC<RecentlyViewedProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const isInitialLoadRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get or create session ID for guest users
  const getSessionId = (): string => {
    if (typeof window === 'undefined') return ''; // Handle SSR case
    
    try {
      let sessionId = localStorage.getItem('guest_session_id');
      if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guest_session_id', sessionId);
      }
      return sessionId;
    } catch (err) {
      console.error('Error accessing localStorage:', err);
      return '';
    }
  };

  // Fetch recently viewed products
  const fetchProducts = useCallback(async (options: { force?: boolean } = {}) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't fetch if we're not forcing and we've already initialized
    if (!options.force && initialized && !isInitialLoadRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const sessionId = getSessionId();
      // Only attempt fetch if we have a session ID and we're in the browser
      if (!sessionId || typeof window === 'undefined') {
        setProducts([]);
        setInitialized(true);
        isInitialLoadRef.current = false;
        setLoading(false);
        return;
      }

      // Add a short delay before making the request to ensure session is properly set
      await new Promise(resolve => setTimeout(resolve, 100));

      abortControllerRef.current = new AbortController();

      const response = await fetch(`/api/recently-viewed?sessionId=${sessionId}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        signal: abortControllerRef.current.signal,
        cache: 'no-cache',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch recently viewed products');
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      // Don't set error state if the request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching recently viewed products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recently viewed products');
      setProducts([]); // Reset to empty array on error
    } finally {
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
      setLoading(false);
      setInitialized(true);
      isInitialLoadRef.current = false;
    }
  }, [initialized]);

  // Add product to recently viewed
  const addProduct = useCallback(async (productId: number) => {
    if (!initialized) {
      await fetchProducts({ force: true }); // Force fetch if not initialized
    }

    try {
      setError(null);
      const sessionId = getSessionId();
      
      if (!sessionId) {
        throw new Error('No session ID available');
      }

      const response = await fetch('/api/recently-viewed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          productId,
          sessionId
        }),
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to track product view');
      }

      const data = await response.json();
      
      if (data.success) {
        // Optimistically update the products list
        setProducts(prev => {
          const existing = prev.find(p => p.id === productId);
          if (existing) {
            // Move to top if already exists
            return [
              { ...existing, viewedAt: new Date().toISOString() },
              ...prev.filter(p => p.id !== productId)
            ];
          }
          // Product will be added by the subsequent fetchProducts call
          return prev;
        });
        
        void fetchProducts({ force: true }); // Refresh the products list
      } else {
        throw new Error(data.error || 'Failed to track product view');
      }
    } catch (err) {
      console.error('Error adding product to recently viewed:', err);
      setError(err instanceof Error ? err.message : 'Failed to track product view');
    }
  }, [initialized, fetchProducts]);

  // Remove product from recently viewed
  const removeProduct = useCallback(async (productId: number) => {
    if (!initialized) {
      return; // Don't allow removing products before initialization
    }

    try {
      setError(null);
      const sessionId = getSessionId();

      if (!sessionId) {
        throw new Error('No session ID available');
      }

      // Optimistically update UI
      setProducts(prev => prev.filter(p => p.id !== productId));

      const response = await fetch(`/api/recently-viewed?productId=${productId}&sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to remove product from recently viewed');
      }

      const data = await response.json();
      
      if (!data.success) {
        // Revert optimistic update if server operation failed
        void fetchProducts({ force: true });
        throw new Error(data.error || 'Failed to remove product');
      }
    } catch (err) {
      console.error('Error removing product from recently viewed:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove product');
      // Refresh the list to ensure it's in sync with server
      void fetchProducts({ force: true });
    }
  }, [initialized, fetchProducts]);

  // Clear all recently viewed products
  const clearAll = useCallback(async () => {
    if (!initialized) {
      return; // Don't allow clearing before initialization
    }

    try {
      setError(null);
      const sessionId = getSessionId();

      if (!sessionId) {
        throw new Error('No session ID available');
      }

      // Optimistically clear the list
      setProducts([]);

      const response = await fetch(`/api/recently-viewed?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to clear recently viewed products');
      }

      const data = await response.json();
      
      if (!data.success) {
        // Revert optimistic update if server operation failed
        void fetchProducts({ force: true });
        throw new Error(data.error || 'Failed to clear products');
      }
    } catch (err) {
      console.error('Error clearing recently viewed products:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear products');
      // Refresh the list to ensure it's in sync with server
      void fetchProducts({ force: true });
    }
  }, [initialized, fetchProducts]);

  // Initial load effect
  useEffect(() => {
    let mounted = true;

    if (!initialized && isInitialLoadRef.current && mounted) {
      void fetchProducts();
    }

    return () => {
      mounted = false;
      // Cleanup any in-flight request when unmounting
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialized, fetchProducts]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  const value: RecentlyViewedContextType = {
    products,
    addProduct,
    removeProduct,
    clearAll,
    loading,
    error,
    refreshProducts: useCallback(() => fetchProducts({ force: true }), [fetchProducts]),
    initialized,
  };

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};