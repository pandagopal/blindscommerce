'use client';

import React, { useState, useEffect } from 'react';
import { useCache } from '@/context/CacheContext';
import { getCacheStats, useCacheInvalidator } from '@/hooks/useCache';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Activity,
  HardDrive,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function CacheManagementPage() {
  const {
    invalidateProducts,
    invalidateCart,
    invalidateUser,
    invalidateVendor,
    invalidateOrders,
    invalidateAll,
    lastInvalidated
  } = useCache();

  const { invalidatePattern } = useCacheInvalidator();
  const [stats, setStats] = useState(getCacheStats());
  const [customPattern, setCustomPattern] = useState('');
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleInvalidate = async (
    name: string,
    action: () => void | Promise<void>
  ) => {
    setRefreshing(name);
    try {
      await action();
      setStats(getCacheStats());
      toast.success(`${name} cache cleared successfully!`);
    } catch (error) {
      toast.error(`Failed to clear ${name} cache`);
      console.error('Cache invalidation error:', error);
    } finally {
      setRefreshing(null);
    }
  };

  const handleCustomInvalidate = () => {
    if (!customPattern) return;
    
    try {
      const count = invalidatePattern(customPattern);
      setStats(getCacheStats());
      toast.success(`Cleared ${count} entries matching "${customPattern}"`);
      setCustomPattern('');
    } catch (error) {
      toast.error(`Failed to clear pattern "${customPattern}"`);
    }
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          Cache Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage application cache for optimal performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Memory Cache</CardTitle>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.memoryCacheSize}</p>
            <p className="text-sm text-gray-500">Active entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Local Storage</CardTitle>
              <HardDrive className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.localStorageEntries}</p>
            <p className="text-sm text-gray-500">Persisted entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Size</CardTitle>
              <Database className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBytes(stats.totalSizeBytes)}</p>
            <p className="text-sm text-gray-500">Storage used</p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Cache Controls</CardTitle>
          <CardDescription>
            Manually invalidate specific cache categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CacheControl
              name="Products"
              description="Product listings, details, and pricing"
              lastInvalidated={formatLastInvalidated('products')}
              onInvalidate={() => handleInvalidate('Products', invalidateProducts)}
              isRefreshing={refreshing === 'Products'}
            />
            
            <CacheControl
              name="Shopping Cart"
              description="Cart items and calculations"
              lastInvalidated={formatLastInvalidated('cart')}
              onInvalidate={() => handleInvalidate('Cart', invalidateCart)}
              isRefreshing={refreshing === 'Cart'}
            />
            
            <CacheControl
              name="User Data"
              description="User profiles and preferences"
              lastInvalidated={formatLastInvalidated('user')}
              onInvalidate={() => handleInvalidate('User', invalidateUser)}
              isRefreshing={refreshing === 'User'}
            />
            
            <CacheControl
              name="Vendor Data"
              description="Vendor information and settings"
              lastInvalidated={formatLastInvalidated('vendor')}
              onInvalidate={() => handleInvalidate('Vendor', invalidateVendor)}
              isRefreshing={refreshing === 'Vendor'}
            />
            
            <CacheControl
              name="Orders"
              description="Order history and details"
              lastInvalidated={formatLastInvalidated('orders')}
              onInvalidate={() => handleInvalidate('Orders', invalidateOrders)}
              isRefreshing={refreshing === 'Orders'}
            />
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">Clear All Cache</h3>
              <p className="text-sm text-red-700 mb-3">
                Remove all cached data from memory and storage
              </p>
              <Button
                onClick={() => handleInvalidate('All', invalidateAll)}
                disabled={refreshing === 'All'}
                variant="destructive"
                className="w-full"
              >
                {refreshing === 'All' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Everything
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Pattern Invalidation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Pattern-Based Invalidation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPattern}
              onChange={(e) => setCustomPattern(e.target.value)}
              placeholder="Enter cache key pattern (e.g., cache:product:123)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              onClick={handleCustomInvalidate}
              disabled={!customPattern}
            >
              Invalidate Pattern
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Use partial strings or regex patterns to match cache keys
          </p>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            Frontend Cache Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-yellow-800">
            <p>
              <strong>Manual Invalidation Only:</strong> Frontend caches are stored in the browser 
              and must be manually cleared. No automatic expiry.
            </p>
            <p>
              <strong>When to Clear Cache:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>After updating product information or prices</li>
              <li>After modifying vendor settings or discounts</li>
              <li>After changing user roles or permissions</li>
              <li>After bulk imports or major data changes</li>
              <li>If users report seeing outdated information</li>
            </ul>
            <p>
              <strong>Performance Note:</strong> Clearing cache will cause temporary slower load times 
              as data is re-fetched from the API.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CacheControlProps {
  name: string;
  description: string;
  lastInvalidated: string;
  onInvalidate: () => void;
  isRefreshing: boolean;
}

function CacheControl({ name, description, lastInvalidated, onInvalidate, isRefreshing }: CacheControlProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last cleared: {lastInvalidated}
          </p>
        </div>
        <Button
          onClick={onInvalidate}
          disabled={isRefreshing}
          size="sm"
          variant="outline"
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}