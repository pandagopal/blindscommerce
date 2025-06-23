/**
 * Application-level caching utility for BlindsCommerce
 * Provides in-memory caching with configurable TTL and cache invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
}

class ApplicationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000; // 1000 entries max
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Clean up expired entries if we're at max size
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  deleteByPattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let deletedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      activeEntries: this.cache.size - expiredCount,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL
    };
  }

  /**
   * Get or set cached data with a factory function
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }
}

// Cache instances with different configurations
export const cache = new ApplicationCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000
});

// Homepage cache - longer TTL since data changes less frequently
export const homepageCache = new ApplicationCache({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 100
});

// Products cache - medium TTL for product listings
export const productsCache = new ApplicationCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500
});

// Discounts/Coupons cache - shorter TTL for dynamic pricing
export const discountsCache = new ApplicationCache({
  ttl: 2 * 60 * 1000, // 2 minutes
  maxSize: 200
});

// Room types cache - long TTL since room types rarely change
export const roomsCache = new ApplicationCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 50
});

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  homepage: {
    data: () => 'homepage:data',
    categories: () => 'homepage:categories',
    products: () => 'homepage:products',
    reviews: () => 'homepage:reviews'
  },
  
  products: {
    list: (params: any) => {
      const { limit, offset, categoryId, search, minPrice, maxPrice, sortBy, sortOrder } = params;
      return `products:list:${limit}:${offset}:${categoryId}:${search}:${minPrice}:${maxPrice}:${sortBy}:${sortOrder}`;
    },
    detail: (slug: string) => `products:detail:${slug}`,
    pricing: (slug: string) => `products:pricing:${slug}`,
    vendors: (slug: string) => `products:vendors:${slug}`,
    configuration: (slug: string) => `products:config:${slug}`
  },
  
  rooms: {
    all: () => 'rooms:all',
    active: () => 'rooms:active'
  },
  
  vendor: {
    discounts: (vendorId: number) => `vendor:${vendorId}:discounts`,
    coupons: (vendorId: number) => `vendor:${vendorId}:coupons`,
    activeDiscounts: (vendorId: number) => `vendor:${vendorId}:discounts:active`,
    activeCoupons: (vendorId: number) => `vendor:${vendorId}:coupons:active`
  },
  
  categories: {
    all: () => 'categories:all',
    featured: () => 'categories:featured',
    withProducts: () => 'categories:with-products'
  }
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  homepage: () => {
    homepageCache.deleteByPattern('homepage:.*');
  },
  
  products: () => {
    productsCache.deleteByPattern('products:.*');
  },
  
  productDetail: (slug: string) => {
    productsCache.deleteByPattern(`products:.*:${slug}`);
  },
  
  vendor: (vendorId: number) => {
    discountsCache.deleteByPattern(`vendor:${vendorId}:.*`);
  },
  
  rooms: () => {
    roomsCache.clear();
  },
  
  categories: () => {
    homepageCache.deleteByPattern('categories:.*');
    productsCache.deleteByPattern('categories:.*');
  }
};

/**
 * Global cache cleanup - run periodically
 */
export const performGlobalCleanup = () => {
  const stats = {
    cache: cache.cleanup(),
    homepage: homepageCache.cleanup(),
    products: productsCache.cleanup(),
    discounts: discountsCache.cleanup(),
    rooms: roomsCache.cleanup()
  };
  
  console.log('Cache cleanup completed:', stats);
  return stats;
};

// Automatic cleanup every 10 minutes
if (typeof global !== 'undefined') {
  setInterval(performGlobalCleanup, 10 * 60 * 1000);
}