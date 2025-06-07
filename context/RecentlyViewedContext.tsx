'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get or create session ID for guest users
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_session_id', sessionId);
    }
    return sessionId;
  };

  // Fetch recently viewed products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = getSessionId();
      const response = await fetch(`/api/recently-viewed?sessionId=${sessionId}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recently viewed products');
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error fetching recently viewed products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recently viewed products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Add product to recently viewed
  const addProduct = async (productId: number) => {
    try {
      const sessionId = getSessionId();
      
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
      });

      if (!response.ok) {
        throw new Error('Failed to track product view');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the products list to reflect the new view
        await fetchProducts();
      } else {
        throw new Error(data.error || 'Failed to track product view');
      }
    } catch (err) {
      console.error('Error adding product to recently viewed:', err);
      setError(err instanceof Error ? err.message : 'Failed to track product view');
    }
  };

  // Remove product from recently viewed
  const removeProduct = async (productId: number) => {
    try {
      const sessionId = getSessionId();
      
      const response = await fetch(`/api/recently-viewed?productId=${productId}&sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove product from recently viewed');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state immediately for better UX
        setProducts(prev => prev.filter(p => p.id !== productId));
      } else {
        throw new Error(data.error || 'Failed to remove product');
      }
    } catch (err) {
      console.error('Error removing product from recently viewed:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove product');
    }
  };

  // Clear all recently viewed products
  const clearAll = async () => {
    try {
      const sessionId = getSessionId();
      
      const response = await fetch(`/api/recently-viewed?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear recently viewed products');
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts([]);
      } else {
        throw new Error(data.error || 'Failed to clear products');
      }
    } catch (err) {
      console.error('Error clearing recently viewed products:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear products');
    }
  };

  // Refresh products (alias for fetchProducts for external use)
  const refreshProducts = fetchProducts;

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const value: RecentlyViewedContextType = {
    products,
    addProduct,
    removeProduct,
    clearAll,
    loading,
    error,
    refreshProducts,
  };

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};