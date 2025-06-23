'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface UseLazyLoadOptions {
  targetPath: string;
  enabled?: boolean;
  dependencies?: any[];
}

interface UseLazyLoadReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLazyLoad<T>(
  fetchFunction: () => Promise<T>,
  options: UseLazyLoadOptions
): UseLazyLoadReturn<T> {
  const { targetPath, enabled = true, dependencies = [] } = options;
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const isCurrentPath = pathname === targetPath;
  const shouldLoad = enabled && isCurrentPath && user && !authLoading;

  const fetchData = useCallback(async () => {
    if (!shouldLoad) return;

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
      setHasLoaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Lazy load error:', err);
    } finally {
      setLoading(false);
    }
  }, [shouldLoad, fetchFunction]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Only fetch if we're on the target path and haven't loaded yet
    if (shouldLoad && !hasLoaded) {
      fetchData();
    }
    
    // Reset data when leaving the page (optional optimization)
    if (!isCurrentPath && hasLoaded) {
      // Uncomment below to clear data when navigating away (saves memory)
      // setData(null);
      // setHasLoaded(false);
    }
  }, [shouldLoad, hasLoaded, isCurrentPath, fetchData, ...dependencies]);

  return {
    data,
    loading: authLoading || loading,
    error,
    refetch,
  };
}

// Hook specifically for dashboard data fetching
export function useDashboardData<T>(
  fetchFunction: () => Promise<T>,
  pagePath: string,
  dependencies: any[] = []
): UseLazyLoadReturn<T> {
  return useLazyLoad(fetchFunction, {
    targetPath: pagePath,
    dependencies,
  });
}

// Hook for route-specific API calls
export function useRouteData<T>(
  apiEndpoint: string,
  pagePath: string,
  options: RequestInit = {}
): UseLazyLoadReturn<T> {
  const fetchFunction = useCallback(async () => {
    const response = await fetch(apiEndpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }, [apiEndpoint, options]);

  return useLazyLoad(fetchFunction, {
    targetPath: pagePath,
  });
}