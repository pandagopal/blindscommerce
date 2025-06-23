/**
 * Client-side caching utility for React components
 * Provides in-memory caching for API responses on the frontend
 * Uses manual invalidation (no automatic TTL expiry)
 */

interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
}

class ClientCache {
  private cache = new Map<string, ClientCacheEntry<any>>();

  constructor() {
    // No TTL needed - manual refresh only
  }

  set<T>(key: string, data: T): void {
    const entry: ClientCacheEntry<T> = {
      data,
      timestamp: Date.now()
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalEntries: this.cache.size,
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
   * Get or fetch pattern - returns cached data or fetches new data
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    this.set(key, data);
    return data;
  }
}

// Create cache instances for different types of data (no TTL - manual refresh only)
export const clientCache = new ClientCache();

// Specialized caches for different data types
export const productsClientCache = new ClientCache();
export const cartClientCache = new ClientCache();
export const vendorClientCache = new ClientCache();

/**
 * Cached fetch function that automatically caches responses
 */
export async function cachedFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
  
  return clientCache.getOrFetch(
    cacheKey,
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }
  );
}

/**
 * Cache key builders for client-side caching
 */
export const ClientCacheKeys = {
  cart: {
    pricing: (customerId?: number) => `cart:pricing:${customerId || 'guest'}`,
    items: (customerId?: number) => `cart:items:${customerId || 'guest'}`
  },
  
  products: {
    search: (query: string) => `products:search:${query}`,
    category: (categoryId: number) => `products:category:${categoryId}`,
    filters: (filters: any) => `products:filters:${JSON.stringify(filters)}`
  },
  
  vendor: {
    discounts: (vendorId: number) => `vendor:${vendorId}:discounts`,
    coupons: (vendorId: number) => `vendor:${vendorId}:coupons`
  },
  
  homepage: {
    data: () => 'homepage:data',
    categories: () => 'homepage:categories',
    products: () => 'homepage:products'
  }
};

/**
 * Manual cache refresh function for client-side caches
 */
export const refreshClientCaches = () => {
  clientCache.clear();
  productsClientCache.clear();
  cartClientCache.clear();
  vendorClientCache.clear();
  
  console.log('All client-side caches cleared');
  return {
    message: 'Client caches refreshed successfully',
    timestamp: new Date().toISOString()
  };
};