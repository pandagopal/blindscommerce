'use client';

import { useEffect, useState } from 'react';
import { 
  cache, 
  homepageCache, 
  productsCache, 
  discountsCache, 
  roomsCache,
  categoriesCache,
  pricingCache,
  getAllCacheStats,
  refreshAllCaches
} from '@/lib/cache';
import { 
  clientCache, 
  productsClientCache, 
  cartClientCache, 
  vendorClientCache,
  refreshClientCaches
} from '@/lib/cache/clientCache';

interface CacheStats {
  totalEntries: number;
  activeEntries: number;
  maxSize: number;
  oldestEntry: number;
  newestEntry: number;
}

interface ClientCacheStats {
  totalEntries: number;
  oldestEntry: number;
  newestEntry: number;
}

export default function CachePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [serverStats, setServerStats] = useState<{
    cache: CacheStats;
    homepage: CacheStats;
    products: CacheStats;
    discounts: CacheStats;
    rooms: CacheStats;
    categories: CacheStats;
    pricing: CacheStats;
  } | null>(null);

  const [clientStats, setClientStats] = useState<{
    client: any;
    products: any;
    cart: any;
    vendor: any;
  } | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  // Show in development or for admin users
  useEffect(() => {
    const checkVisibility = async () => {
      if (process.env.NODE_ENV === 'development') {
        setIsVisible(true);
        return;
      }
      
      // In production, check if user is admin
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          if (user.role === 'admin' || user.role === 'super_admin') {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkVisibility();
  }, []);

  const updateStats = () => {
    // Server-side cache stats
    const stats = getAllCacheStats();
    setServerStats(stats);

    // Client-side cache stats
    setClientStats({
      client: (clientCache as any).getStats ? (clientCache as any).getStats() : { totalEntries: 0 },
      products: (productsClientCache as any).getStats ? (productsClientCache as any).getStats() : { totalEntries: 0 },
      cart: (cartClientCache as any).getStats ? (cartClientCache as any).getStats() : { totalEntries: 0 },
      vendor: (vendorClientCache as any).getStats ? (vendorClientCache as any).getStats() : { totalEntries: 0 }
    });
  };

  useEffect(() => {
    if (isVisible) {
      updateStats();
      const interval = setInterval(updateStats, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Call server-side cache refresh API
      const response = await fetch('/api/admin/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Cache refresh result:', result);
        setLastRefresh(new Date().toLocaleTimeString());
        
        // Also refresh local caches
        refreshAllCaches();
        refreshClientCaches();
        
        // Update stats display
        updateStats();
      } else {
        console.error('Cache refresh failed:', response.statusText);
      }
    } catch (error) {
      console.error('Cache refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatAge = (milliseconds: number): string => {
    if (milliseconds === 0) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg text-xs max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Cache Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-yellow-400">Server Caches (No Auto-Expiry):</h4>
          {serverStats && (
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Homepage: {serverStats.homepage.activeEntries}/{serverStats.homepage.maxSize}</div>
              <div>Products: {serverStats.products.activeEntries}/{serverStats.products.maxSize}</div>
              <div>Discounts: {serverStats.discounts.activeEntries}/{serverStats.discounts.maxSize}</div>
              <div>Rooms: {serverStats.rooms.activeEntries}/{serverStats.rooms.maxSize}</div>
              <div>Categories: {serverStats.categories.activeEntries}/{serverStats.categories.maxSize}</div>
              <div>Pricing: {serverStats.pricing.activeEntries}/{serverStats.pricing.maxSize}</div>
            </div>
          )}
          {serverStats && serverStats.homepage.oldestEntry > 0 && (
            <div className="text-gray-300 text-xs mt-1">
              Oldest: {formatAge(serverStats.homepage.oldestEntry)}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-blue-400">Client Caches (No Auto-Expiry):</h4>
          {clientStats && (
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Client: {clientStats.client.totalEntries}</div>
              <div>Products: {clientStats.products.totalEntries}</div>
              <div>Cart: {clientStats.cart.totalEntries}</div>
              <div>Vendor: {clientStats.vendor.totalEntries}</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2 flex-wrap">
          <button
            onClick={updateStats}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Update Stats
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh All Caches'}
          </button>
        </div>
        
        {lastRefresh && (
          <div className="text-green-400 text-xs">
            Last refreshed: {lastRefresh}
          </div>
        )}
      </div>
    </div>
  );
}