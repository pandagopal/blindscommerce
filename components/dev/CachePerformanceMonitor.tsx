'use client';

import { useEffect, useState } from 'react';
import { 
  cache, 
  homepageCache, 
  productsCache, 
  discountsCache, 
  roomsCache,
  performGlobalCleanup 
} from '@/lib/cache';
import { 
  clientCache, 
  productsClientCache, 
  cartClientCache, 
  vendorClientCache 
} from '@/lib/cache/clientCache';

interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  activeEntries: number;
  maxSize: number;
  defaultTTL: number;
}

export default function CachePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [serverStats, setServerStats] = useState<{
    cache: CacheStats;
    homepage: CacheStats;
    products: CacheStats;
    discounts: CacheStats;
    rooms: CacheStats;
  } | null>(null);

  const [clientStats, setClientStats] = useState<{
    client: any;
    products: any;
    cart: any;
    vendor: any;
  } | null>(null);

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  const updateStats = () => {
    // Server-side cache stats
    setServerStats({
      cache: cache.getStats(),
      homepage: homepageCache.getStats(),
      products: productsCache.getStats(),
      discounts: discountsCache.getStats(),
      rooms: roomsCache.getStats()
    });

    // Client-side cache stats (simplified)
    setClientStats({
      client: { entries: (clientCache as any).cache?.size || 0 },
      products: { entries: (productsClientCache as any).cache?.size || 0 },
      cart: { entries: (cartClientCache as any).cache?.size || 0 },
      vendor: { entries: (vendorClientCache as any).cache?.size || 0 }
    });
  };

  useEffect(() => {
    if (isVisible) {
      updateStats();
      const interval = setInterval(updateStats, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const handleCleanup = () => {
    const results = performGlobalCleanup();
    console.log('Cache cleanup results:', results);
    updateStats();
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
          <h4 className="font-semibold text-yellow-400">Server Caches:</h4>
          {serverStats && (
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Homepage: {serverStats.homepage.activeEntries}/{serverStats.homepage.maxSize}</div>
              <div>Products: {serverStats.products.activeEntries}/{serverStats.products.maxSize}</div>
              <div>Discounts: {serverStats.discounts.activeEntries}/{serverStats.discounts.maxSize}</div>
              <div>Rooms: {serverStats.rooms.activeEntries}/{serverStats.rooms.maxSize}</div>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-blue-400">Client Caches:</h4>
          {clientStats && (
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>Client: {clientStats.client.entries}</div>
              <div>Products: {clientStats.products.entries}</div>
              <div>Cart: {clientStats.cart.entries}</div>
              <div>Vendor: {clientStats.vendor.entries}</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={updateStats}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
          >
            Refresh
          </button>
          <button
            onClick={handleCleanup}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
          >
            Cleanup
          </button>
        </div>
      </div>
    </div>
  );
}