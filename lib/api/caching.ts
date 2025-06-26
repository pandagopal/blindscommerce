/**
 * Enhanced Response Caching Layer for Consolidated APIs
 * Extends the existing cache system with TTL, smart invalidation, and performance metrics
 */

import { cache, CacheKeys, CacheInvalidation } from '@/lib/cache';
import { logWarning } from '@/lib/errorHandling';

// Cache configuration with TTL support
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number;
  autoRefresh?: boolean; // Auto-refresh before expiration
  refreshThreshold?: number; // Percentage of TTL when to refresh (0-1)
  tags?: string[]; // Cache tags for bulk invalidation
}

// Enhanced cache entry with TTL and metadata
interface EnhancedCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  size?: number; // Estimated size in bytes
}

// Cache performance metrics
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  avgResponseTime: number;
  hitRate: number;
  memoryUsage: number;
}

// Cache strategies
export enum CacheStrategy {
  CACHE_FIRST = 'cache_first',           // Return cached data if available
  CACHE_ASIDE = 'cache_aside',           // Check cache, fetch if miss, then cache
  WRITE_THROUGH = 'write_through',       // Write to cache and database simultaneously
  WRITE_BEHIND = 'write_behind',         // Write to cache immediately, database later
  REFRESH_AHEAD = 'refresh_ahead'        // Refresh cache proactively before expiration
}

// Enhanced cache class with TTL support
export class TTLCache<T = any> {
  private cache = new Map<string, EnhancedCacheEntry<T>>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    avgResponseTime: 0,
    hitRate: 0,
    memoryUsage: 0
  };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanupTimer();
  }

  set(key: string, data: T, config: CacheConfig): void {
    const startTime = Date.now();
    
    try {
      // Remove expired entries if cache is at capacity
      if (this.cache.size >= this.maxSize) {
        this.evictExpiredEntries();
        
        // If still at capacity, evict LRU entries
        if (this.cache.size >= this.maxSize) {
          this.evictLRUEntries(Math.floor(this.maxSize * 0.1));
        }
      }

      const entry: EnhancedCacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        tags: config.tags || [],
        size: this.estimateSize(data)
      };

      this.cache.set(key, entry);
      this.metrics.sets++;
      
    } catch (error) {
      logWarning('Cache set operation failed', { key, error });
    } finally {
      this.updateResponseTime(Date.now() - startTime);
    }
  }

  get(key: string): T | null {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.metrics.misses++;
        return null;
      }

      // Check if entry has expired
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.metrics.misses++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      this.metrics.hits++;
      return entry.data;
      
    } catch (error) {
      logWarning('Cache get operation failed', { key, error });
      this.metrics.misses++;
      return null;
    } finally {
      this.updateResponseTime(Date.now() - startTime);
      this.updateHitRate();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.metrics.deletes++;
    }
    return result;
  }

  deleteByTag(tag: string): number {
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.metrics.deletes += deletedCount;
    return deletedCount;
  }

  deleteByPattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.metrics.deletes += deletedCount;
    return deletedCount;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.metrics.deletes += size;
  }

  // Get items that will expire soon (for proactive refresh)
  getExpiringItems(thresholdMs: number = 60000): string[] {
    const now = Date.now();
    const expiringKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const timeToExpiry = (entry.timestamp + entry.ttl) - now;
      if (timeToExpiry > 0 && timeToExpiry <= thresholdMs) {
        expiringKeys.push(key);
      }
    }
    
    return expiringKeys;
  }

  getMetrics(): CacheMetrics & { totalEntries: number; estimatedMemoryMB: number } {
    return {
      ...this.metrics,
      totalEntries: this.cache.size,
      estimatedMemoryMB: this.getEstimatedMemoryUsage()
    };
  }

  private isExpired(entry: EnhancedCacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictExpiredEntries(): number {
    let evicted = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        evicted++;
      }
    }
    
    this.metrics.evictions += evicted;
    return evicted;
  }

  private evictLRUEntries(count: number): number {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let evicted = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
      evicted++;
    }
    
    this.metrics.evictions += evicted;
    return evicted;
  }

  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default estimate
    }
  }

  private getEstimatedMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size || 1000;
    }
    return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
  }

  private updateResponseTime(time: number): void {
    const totalOps = this.metrics.hits + this.metrics.misses + this.metrics.sets;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (totalOps - 1) + time) / totalOps;
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  private startCleanupTimer(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.evictExpiredEntries();
    }, 5 * 60 * 1000);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Pre-configured cache instances for different use cases
export const ApiCacheInstances = {
  // Fast cache for frequently accessed data (5 minute TTL)
  fast: new TTLCache<any>(500),
  
  // Standard cache for regular API responses (15 minute TTL)
  standard: new TTLCache<any>(1000),
  
  // Slow cache for expensive operations (1 hour TTL)
  slow: new TTLCache<any>(200),
  
  // Static cache for rarely changing data (6 hour TTL)
  static: new TTLCache<any>(100)
};

// Cache configuration presets
export const CacheConfigs = {
  // Real-time data (user sessions, cart contents)
  realtime: { ttl: 2 * 60 * 1000, tags: ['realtime'] }, // 2 minutes
  
  // Fast data (product prices, inventory)
  fast: { ttl: 5 * 60 * 1000, tags: ['fast'] }, // 5 minutes
  
  // Standard data (product lists, categories)
  standard: { ttl: 15 * 60 * 1000, tags: ['standard'] }, // 15 minutes
  
  // Slow data (analytics, reports)
  slow: { ttl: 60 * 60 * 1000, tags: ['slow'] }, // 1 hour
  
  // Static data (settings, configurations)
  static: { ttl: 6 * 60 * 60 * 1000, tags: ['static'] }, // 6 hours
  
  // Daily data (daily stats, summaries)
  daily: { ttl: 24 * 60 * 60 * 1000, tags: ['daily'] } // 24 hours
};

// Smart cache wrapper with strategy support
export class SmartCache {
  private primaryCache: TTLCache;
  private fallbackCache?: TTLCache;

  constructor(primaryCache: TTLCache, fallbackCache?: TTLCache) {
    this.primaryCache = primaryCache;
    this.fallbackCache = fallbackCache;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig,
    strategy: CacheStrategy = CacheStrategy.CACHE_ASIDE
  ): Promise<{ data: T; fromCache: boolean; cacheAge?: number }> {
    
    switch (strategy) {
      case CacheStrategy.CACHE_FIRST:
        return this.cacheFirst(key, factory, config);
      
      case CacheStrategy.REFRESH_AHEAD:
        return this.refreshAhead(key, factory, config);
      
      default:
        return this.cacheAside(key, factory, config);
    }
  }

  private async cacheFirst<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<{ data: T; fromCache: boolean; cacheAge?: number }> {
    // Try primary cache first
    const cached = this.primaryCache.get<{ data: T; timestamp: number }>(key);
    
    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        cacheAge: Date.now() - cached.timestamp
      };
    }

    // Try fallback cache
    if (this.fallbackCache) {
      const fallbackCached = this.fallbackCache.get<{ data: T; timestamp: number }>(key);
      if (fallbackCached) {
        // Also store in primary cache
        this.primaryCache.set(key, fallbackCached, config);
        return {
          data: fallbackCached.data,
          fromCache: true,
          cacheAge: Date.now() - fallbackCached.timestamp
        };
      }
    }

    // Fetch from source
    const data = await factory();
    const cacheData = { data, timestamp: Date.now() };
    
    // Store in both caches
    this.primaryCache.set(key, cacheData, config);
    if (this.fallbackCache) {
      this.fallbackCache.set(key, cacheData, { ...config, ttl: config.ttl * 2 });
    }

    return { data, fromCache: false };
  }

  private async cacheAside<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<{ data: T; fromCache: boolean; cacheAge?: number }> {
    // Check cache first
    const cached = this.primaryCache.get<{ data: T; timestamp: number }>(key);
    
    if (cached) {
      return {
        data: cached.data,
        fromCache: true,
        cacheAge: Date.now() - cached.timestamp
      };
    }

    // Cache miss - fetch from source and cache
    const data = await factory();
    const cacheData = { data, timestamp: Date.now() };
    
    this.primaryCache.set(key, cacheData, config);
    
    return { data, fromCache: false };
  }

  private async refreshAhead<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<{ data: T; fromCache: boolean; cacheAge?: number }> {
    const cached = this.primaryCache.get<{ data: T; timestamp: number }>(key);
    const refreshThreshold = config.refreshThreshold || 0.8;
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const shouldRefresh = age > (config.ttl * refreshThreshold);
      
      if (shouldRefresh) {
        // Return cached data immediately, refresh in background
        this.refreshInBackground(key, factory, config);
      }
      
      return {
        data: cached.data,
        fromCache: true,
        cacheAge: age
      };
    }

    // No cached data - fetch immediately
    const data = await factory();
    const cacheData = { data, timestamp: Date.now() };
    
    this.primaryCache.set(key, cacheData, config);
    
    return { data, fromCache: false };
  }

  private async refreshInBackground<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<void> {
    try {
      const data = await factory();
      const cacheData = { data, timestamp: Date.now() };
      this.primaryCache.set(key, cacheData, config);
    } catch (error) {
      logWarning('Background cache refresh failed', { key, error });
    }
  }

  invalidate(key: string): boolean {
    const primary = this.primaryCache.delete(key);
    const fallback = this.fallbackCache?.delete(key) || false;
    return primary || fallback;
  }

  invalidateByTag(tag: string): number {
    const primary = this.primaryCache.deleteByTag(tag);
    const fallback = this.fallbackCache?.deleteByTag(tag) || 0;
    return primary + fallback;
  }

  getMetrics() {
    return {
      primary: this.primaryCache.getMetrics(),
      fallback: this.fallbackCache?.getMetrics()
    };
  }
}

// Global cache instances
export const GlobalCaches = {
  homepage: new SmartCache(ApiCacheInstances.standard),
  products: new SmartCache(ApiCacheInstances.standard, ApiCacheInstances.slow),
  pricing: new SmartCache(ApiCacheInstances.fast),
  admin: new SmartCache(ApiCacheInstances.slow),
  vendor: new SmartCache(ApiCacheInstances.standard),
  analytics: new SmartCache(ApiCacheInstances.slow, ApiCacheInstances.static)
};

// Cache key builders for consolidated APIs
export const ConsolidatedCacheKeys = {
  admin: {
    dashboard: (dateRange: string, includeExport: boolean) => 
      `admin:dashboard:${dateRange}:${includeExport}`,
    users: (page: number, limit: number, role?: string) => 
      `admin:users:${page}:${limit}:${role || 'all'}`,
    orders: (page: number, limit: number, status?: string) => 
      `admin:orders:${page}:${limit}:${status || 'all'}`,
    vendors: (page: number, limit: number, active?: boolean) => 
      `admin:vendors:${page}:${limit}:${active || 'all'}`
  },
  
  vendor: {
    dashboard: (vendorId: number, dateRange: string) => 
      `vendor:${vendorId}:dashboard:${dateRange}`,
    products: (vendorId: number, page: number, limit: number) => 
      `vendor:${vendorId}:products:${page}:${limit}`,
    orders: (vendorId: number, page: number, limit: number, status?: string) => 
      `vendor:${vendorId}:orders:${page}:${limit}:${status || 'all'}`
  },
  
  public: {
    products: (page: number, limit: number, categoryId?: number, search?: string) => 
      `products:list:${page}:${limit}:${categoryId || 'all'}:${search || 'none'}`,
    productDetail: (slug: string) => `product:detail:${slug}`,
    categories: () => 'categories:public:all',
    homepage: () => 'homepage:public:data'
  }
};

// Performance monitoring
export const CachePerformanceMonitor = {
  getOverallStats() {
    const allCaches = [
      ApiCacheInstances.fast,
      ApiCacheInstances.standard,
      ApiCacheInstances.slow,
      ApiCacheInstances.static
    ];

    let totalHits = 0;
    let totalMisses = 0;
    let totalMemoryMB = 0;
    let totalEntries = 0;

    const cacheStats = allCaches.map(cache => {
      const metrics = cache.getMetrics();
      totalHits += metrics.hits;
      totalMisses += metrics.misses;
      totalMemoryMB += metrics.estimatedMemoryMB;
      totalEntries += metrics.totalEntries;
      return metrics;
    });

    const overallHitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;

    return {
      overall: {
        hitRate: Math.round(overallHitRate * 100),
        totalEntries,
        totalMemoryMB: Math.round(totalMemoryMB * 100) / 100,
        totalHits,
        totalMisses
      },
      individual: cacheStats
    };
  },

  getRecommendations() {
    const stats = this.getOverallStats();
    const recommendations: string[] = [];

    if (stats.overall.hitRate < 70) {
      recommendations.push('Consider increasing cache TTL for better hit rates');
    }

    if (stats.overall.totalMemoryMB > 100) {
      recommendations.push('Memory usage is high, consider reducing cache sizes');
    }

    if (stats.overall.totalEntries > 5000) {
      recommendations.push('Large number of cache entries, consider implementing cache warming');
    }

    return recommendations;
  }
};