/**
 * Application-level caching utility for BlindsCommerce
 * Provides in-memory caching with manual invalidation (no automatic TTL expiry)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  maxSize?: number; // Maximum number of entries
}

class ApplicationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000; // 1000 entries max
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T): void {
    // If we're at max size, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      this.removeOldestEntries(Math.floor(this.maxSize * 0.1)); // Remove 10% of oldest entries
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
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

    return entry.data as T;
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
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
   * Remove oldest entries (used when hitting max size)
   */
  private removeOldestEntries(count: number): void {
    // Sort entries by timestamp and remove oldest
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < Math.min(count, sortedEntries.length); i++) {
      this.cache.delete(sortedEntries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalEntries: this.cache.size,
      activeEntries: this.cache.size,
      maxSize: this.maxSize,
      oldestEntry: this.getOldestEntryAge(),
      newestEntry: this.getNewestEntryAge()
    };
  }

  /**
   * Get age of oldest cache entry in milliseconds
   */
  private getOldestEntryAge(): number {
    if (this.cache.size === 0) return 0;
    
    const now = Date.now();
    let oldest = now;
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    
    return now - oldest;
  }

  /**
   * Get age of newest cache entry in milliseconds
   */
  private getNewestEntryAge(): number {
    if (this.cache.size === 0) return 0;
    
    const now = Date.now();
    let newest = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }
    
    return now - newest;
  }

  /**
   * Get or set cached data with a factory function
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await factory();
    this.set(key, data);
    return data;
  }
}

// Cache instances with different configurations
export const cache = new ApplicationCache({
  maxSize: 1000
});

// Homepage cache - for homepage data (categories, featured products, etc.)
export const homepageCache = new ApplicationCache({
  maxSize: 100
});

// Products cache - for product listings and details
export const productsCache = new ApplicationCache({
  maxSize: 500
});

// Discounts/Coupons cache - for dynamic pricing data
export const discountsCache = new ApplicationCache({
  maxSize: 200
});

// Room types cache - for room types data
export const roomsCache = new ApplicationCache({
  maxSize: 50
});

// Categories cache - for category data
export const categoriesCache = new ApplicationCache({
  maxSize: 100
});

// Pricing cache - for pricing calculations
export const pricingCache = new ApplicationCache({
  maxSize: 300
});

// Hero banner cache - for hero banner data
export const heroBannerCache = new ApplicationCache({
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
  },
  
  heroBanner: {
    active: () => 'hero-banners:active',
    admin: () => 'hero-banners:admin'
  }
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  homepage: () => {
    homepageCache.clear();
    categoriesCache.clear();
  },
  
  products: () => {
    productsCache.clear();
    pricingCache.clear();
  },
  
  productDetail: (slug: string) => {
    productsCache.deleteByPattern(`products:.*:${slug}`);
    pricingCache.deleteByPattern(`pricing:.*:${slug}`);
  },
  
  discounts: () => {
    discountsCache.clear();
    pricingCache.clear();
  },
  
  vendor: (vendorId: number) => {
    discountsCache.deleteByPattern(`vendor:${vendorId}:.*`);
    pricingCache.clear();
  },
  
  rooms: () => {
    roomsCache.clear();
  },
  
  categories: () => {
    categoriesCache.clear();
    homepageCache.deleteByPattern('categories:.*');
    productsCache.deleteByPattern('categories:.*');
  },

  pricing: () => {
    pricingCache.clear();
  },

  heroBanners: () => {
    heroBannerCache.clear();
    homepageCache.clear(); // Clear homepage cache too since it displays hero banners
  },

  all: () => {
    cache.clear();
    homepageCache.clear();
    productsCache.clear();
    discountsCache.clear();
    roomsCache.clear();
    categoriesCache.clear();
    pricingCache.clear();
    heroBannerCache.clear();
  }
};

/**
 * Get all cache statistics
 */
export const getAllCacheStats = () => {
  return {
    cache: cache.getStats(),
    homepage: homepageCache.getStats(),
    products: productsCache.getStats(),
    discounts: discountsCache.getStats(),
    rooms: roomsCache.getStats(),
    categories: categoriesCache.getStats(),
    pricing: pricingCache.getStats(),
    heroBanners: heroBannerCache.getStats()
  };
};

/**
 * Manual cache refresh - clears all caches
 */
export const refreshAllCaches = () => {
  const statsBeforeClear = getAllCacheStats();
  CacheInvalidation.all();
  
  console.log('All caches refreshed. Previous stats:', statsBeforeClear);
  return {
    message: 'All caches cleared successfully',
    previousStats: statsBeforeClear,
    clearedEntries: Object.values(statsBeforeClear).reduce((total, stat) => total + stat.totalEntries, 0)
  };
};