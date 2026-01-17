'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  Ban,
  AlertCircle,
  Info,
  Power,
  PowerOff,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function CacheManagementPage() {
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchCacheStatus();
  }, []);

  const fetchCacheStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/admin/cache/status');
      const data = await response.json();
      if (data.success) {
        setCacheEnabled(data.data?.enabled || false);
      }
    } catch (error) {
      console.error('Error fetching cache status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCache = async () => {
    try {
      setToggling(true);
      const newState = !cacheEnabled;
      const response = await fetch('/api/v2/admin/cache/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      });
      const data = await response.json();

      if (data.success) {
        setCacheEnabled(newState);
        toast.success(`Cache ${newState ? 'enabled' : 'disabled'} successfully`);
      } else {
        toast.error(data.message || 'Failed to toggle cache');
      }
    } catch (error) {
      console.error('Error toggling cache:', error);
      toast.error('Failed to toggle cache');
    } finally {
      setToggling(false);
    }
  };

  const clearCache = async () => {
    try {
      setClearing(true);
      const response = await fetch('/api/v2/admin/cache/clear', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Cache cleared successfully');
      } else {
        toast.error(data.message || 'Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-gray-400" />
            Cache Management
          </h1>
          <p className="text-gray-600 mt-2">
            Application cache management and monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm font-medium">Status:</span>
                <span className={`text-sm font-bold ${cacheEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {cacheEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              {cacheEnabled && (
                <Button
                  onClick={clearCache}
                  disabled={clearing}
                  variant="outline"
                  className="min-w-[140px]"
                >
                  {clearing ? (
                    'Clearing...'
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cache
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={toggleCache}
                disabled={toggling}
                variant={cacheEnabled ? 'destructive' : 'default'}
                className="min-w-[140px]"
              >
                {toggling ? (
                  'Processing...'
                ) : cacheEnabled ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Disable Cache
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Enable Cache
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card className={`mb-8 ${cacheEnabled ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${cacheEnabled ? 'text-green-800' : 'text-yellow-800'}`}>
            {cacheEnabled ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Caching is Currently Enabled
              </>
            ) : (
              <>
                <Ban className="h-5 w-5" />
                Caching is Currently Disabled
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`space-y-4 ${cacheEnabled ? 'text-green-800' : 'text-yellow-800'}`}>
            <p>
              {cacheEnabled
                ? 'The application caching system is currently enabled. Data will be cached for improved performance.'
                : 'The application caching system is currently disabled. This page will show cache management controls when caching is enabled.'
              }
            </p>
            
            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Why is caching disabled?
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>To ensure real-time data accuracy during development</li>
                <li>To prevent stale data issues during testing</li>
                <li>To simplify debugging and troubleshooting</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <h3 className="font-semibold mb-2">When caching is enabled, you can:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>View cache statistics and memory usage</li>
                <li>Clear specific cache categories (products, users, orders, etc.)</li>
                <li>Invalidate cache using custom patterns</li>
                <li>Monitor cache hit rates and performance</li>
                <li>Configure cache expiration policies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Without Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              While caching is disabled, the application fetches fresh data on every request.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>API response times may be slower</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>Database queries are executed on each request</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>No risk of stale or outdated data</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enabling Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              To enable caching for improved performance:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Update environment configuration to enable cache</li>
              <li>Configure cache storage (Redis, Memory, etc.)</li>
              <li>Set appropriate TTL values for different data types</li>
              <li>Implement cache invalidation strategies</li>
              <li>Monitor cache performance and hit rates</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Backend Cache Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Backend Cache Status</CardTitle>
          <CardDescription>
            Server-side caching configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-400">-</p>
              <p className="text-sm text-gray-500">Memory Cache</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-400">-</p>
              <p className="text-sm text-gray-500">Redis Cache</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-400">-</p>
              <p className="text-sm text-gray-500">CDN Cache</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-400">-</p>
              <p className="text-sm text-gray-500">Database Cache</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}