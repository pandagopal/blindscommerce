/**
 * Cache Controls Component
 * Provides UI for manual cache invalidation
 */

'use client';

import React, { useState } from 'react';
import { useCache } from '@/context/CacheContext';
import { getCacheStats } from '@/hooks/useCache';
import { RefreshCw, Trash2, Database, ChevronDown, ChevronUp } from 'lucide-react';

export function CacheControls() {
  const {
    invalidateProducts,
    invalidateCart,
    invalidateUser,
    invalidateVendor,
    invalidateOrders,
    invalidateAll,
    lastInvalidated,
    showCacheControls,
    setShowCacheControls
  } = useCache();

  const [stats, setStats] = useState(getCacheStats());
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshStats = () => {
    setStats(getCacheStats());
  };

  const handleInvalidate = (action: () => void, name: string) => {
    action();
    refreshStats();
    alert(`${name} cache cleared successfully!`);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastInvalidated = (key: string) => {
    const date = lastInvalidated[key];
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (!showCacheControls) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Controls
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {isExpanded && (
          <>
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
              <div className="flex justify-between mb-1">
                <span>Memory Cache:</span>
                <span className="font-medium">{stats.memoryCacheSize} entries</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Local Storage:</span>
                <span className="font-medium">{stats.localStorageEntries} entries</span>
              </div>
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span className="font-medium">{formatBytes(stats.totalSizeBytes)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <CacheButton
                label="Products"
                lastInvalidated={formatLastInvalidated('products')}
                onInvalidate={() => handleInvalidate(invalidateProducts, 'Products')}
              />
              
              <CacheButton
                label="Shopping Cart"
                lastInvalidated={formatLastInvalidated('cart')}
                onInvalidate={() => handleInvalidate(invalidateCart, 'Cart')}
              />
              
              <CacheButton
                label="User Data"
                lastInvalidated={formatLastInvalidated('user')}
                onInvalidate={() => handleInvalidate(invalidateUser, 'User')}
              />
              
              <CacheButton
                label="Vendor Data"
                lastInvalidated={formatLastInvalidated('vendor')}
                onInvalidate={() => handleInvalidate(invalidateVendor, 'Vendor')}
              />
              
              <CacheButton
                label="Orders"
                lastInvalidated={formatLastInvalidated('orders')}
                onInvalidate={() => handleInvalidate(invalidateOrders, 'Orders')}
              />

              <div className="pt-2 border-t">
                <button
                  onClick={() => handleInvalidate(invalidateAll, 'All')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Cache
                </button>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Manual cache invalidation mode
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface CacheButtonProps {
  label: string;
  lastInvalidated: string;
  onInvalidate: () => void;
}

function CacheButton({ label, lastInvalidated, onInvalidate }: CacheButtonProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-gray-500">Last cleared: {lastInvalidated}</div>
      </div>
      <button
        onClick={onInvalidate}
        className="p-2 hover:bg-gray-200 rounded transition-colors"
        title={`Clear ${label} cache`}
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}