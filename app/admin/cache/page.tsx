'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CacheManagementPage() {
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/cache/refresh');
      if (response.ok) {
        const data = await response.json();
        setCacheStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshingCache(true);
    try {
      const response = await fetch('/api/admin/cache/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('All caches refreshed successfully!', {
          description: `Cleared ${result.refreshResult.clearedEntries} cache entries`
        });
        setCacheStats(result.currentStats);
        setLastRefresh(new Date().toLocaleString());
        console.log('Cache refresh result:', result);
      } else {
        toast.error('Failed to refresh caches');
      }
    } catch (error) {
      console.error('Cache refresh error:', error);
      toast.error('Error refreshing caches');
    } finally {
      setRefreshingCache(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const getCacheEntryCount = () => {
    if (!cacheStats) return 0;
    return Object.values(cacheStats).reduce((total: number, cache: any) => {
      return total + (cache.totalEntries || 0);
    }, 0);
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

      {/* Main Cache Control Card */}
      <Card className="mb-8 border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Manual Cache Refresh</CardTitle>
              <CardDescription className="text-base mt-2">
                Clear all cached data for Products, Categories, Pricing, Discounts & Coupons
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Total Cache Entries</p>
              <p className="text-3xl font-bold text-blue-600">{getCacheEntryCount()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Button
              onClick={handleRefreshCache}
              disabled={refreshingCache}
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {refreshingCache ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Refreshing All Caches...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Refresh All Caches
                </>
              )}
            </Button>
            {lastRefresh && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Last refreshed: {lastRefresh}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cacheStats && Object.entries(cacheStats).map(([name, stats]: [string, any]) => (
          <Card key={name} className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg capitalize">{name} Cache</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Entries:</span>
                  <span className="font-semibold">{stats.totalEntries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Size:</span>
                  <span className="font-semibold">{stats.maxSize || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Usage:</span>
                  <span className="font-semibold">
                    {stats.maxSize ? Math.round((stats.totalEntries / stats.maxSize) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Zap className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-yellow-800">
            <p>
              <strong>No Automatic Expiry:</strong> Caches no longer expire automatically. 
              You must manually refresh caches after making changes to see updates on your website.
            </p>
            <p>
              <strong>When to Refresh:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>After updating product information or prices</li>
              <li>After modifying categories or collections</li>
              <li>After changing discount rules or coupon codes</li>
              <li>After bulk imports or major data changes</li>
              <li>If you notice outdated information on the website</li>
            </ul>
            <p>
              <strong>Performance Note:</strong> Refreshing caches will temporarily increase 
              database load as new data is fetched. Best done during low-traffic periods.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}