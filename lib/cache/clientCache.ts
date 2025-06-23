/**
 * Client-side caching utility for React components
 * Provides in-memory caching for API responses on the frontend
 */

interface ClientCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ClientCache {
  private cache = new Map<string, ClientCacheEntry<any>>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: ClientCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
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
   * Get or fetch pattern - returns cached data or fetches new data
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Create cache instances for different types of data
export const clientCache = new ClientCache(5 * 60 * 1000); // 5 minutes

// Specialized caches
export const productsClientCache = new ClientCache(10 * 60 * 1000); // 10 minutes
export const cartClientCache = new ClientCache(1 * 60 * 1000); // 1 minute for frequently changing cart data
export const vendorClientCache = new ClientCache(5 * 60 * 1000); // 5 minutes

/**
 * Cached fetch function that automatically caches responses
 */
export async function cachedFetch<T = any>(
  url: string,
  options: RequestInit = {},
  ttl?: number
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
    },
    ttl
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

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.cleanup();
    productsClientCache.cleanup();
    cartClientCache.cleanup();
    vendorClientCache.cleanup();
  }, 5 * 60 * 1000);
}