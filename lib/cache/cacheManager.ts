import dbConnect from '@/lib/db';

// In-memory cache storage
let cacheStore: Map<string, { value: any; expiry: number }> = new Map();
let cacheEnabledStatus: boolean | null = null;
let cacheStatusCheckTime = 0;
const CACHE_STATUS_CHECK_INTERVAL = 10000; // Check database every 10 seconds

/**
 * Check if caching is enabled in the database
 */
async function isCacheEnabled(): Promise<boolean> {
  const now = Date.now();

  // Return cached status if recently checked
  if (cacheEnabledStatus !== null && (now - cacheStatusCheckTime) < CACHE_STATUS_CHECK_INTERVAL) {
    return cacheEnabledStatus;
  }

  try {
    const db = await dbConnect();
    const [settings] = await db.query(
      'SELECT setting_value FROM cache_settings WHERE setting_key = ?',
      ['cache_enabled']
    ) as any[];

    cacheEnabledStatus = settings && settings.length > 0 && settings[0].setting_value === 'true';
    cacheStatusCheckTime = now;

    return cacheEnabledStatus;
  } catch (error) {
    console.error('Error checking cache status:', error);
    // Default to disabled if there's an error
    return false;
  }
}

/**
 * Get a value from cache
 * @param key Cache key
 * @returns Cached value or null if not found/expired/disabled
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const enabled = await isCacheEnabled();

  if (!enabled) {
    return null;
  }

  const cached = cacheStore.get(key);

  if (!cached) {
    return null;
  }

  // Check if expired
  if (Date.now() > cached.expiry) {
    cacheStore.delete(key);
    return null;
  }

  return cached.value as T;
}

/**
 * Set a value in cache
 * @param key Cache key
 * @param value Value to cache
 * @param ttlSeconds Time to live in seconds (default: 5 minutes)
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  const enabled = await isCacheEnabled();

  if (!enabled) {
    return;
  }

  const expiry = Date.now() + (ttlSeconds * 1000);
  cacheStore.set(key, { value, expiry });
}

/**
 * Delete a specific cache key
 * @param key Cache key to delete
 */
export function deleteCache(key: string): void {
  cacheStore.delete(key);
}

/**
 * Delete cache keys matching a pattern
 * @param pattern String pattern to match (supports wildcards with *)
 */
export function deleteCachePattern(pattern: string): void {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

  for (const key of cacheStore.keys()) {
    if (regex.test(key)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cacheStore.clear();
  cacheEnabledStatus = null;
  cacheStatusCheckTime = 0;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  let totalSize = 0;
  let expiredCount = 0;
  const now = Date.now();

  for (const [key, cached] of cacheStore.entries()) {
    totalSize++;
    if (now > cached.expiry) {
      expiredCount++;
    }
  }

  return {
    totalKeys: totalSize,
    activeKeys: totalSize - expiredCount,
    expiredKeys: expiredCount,
    enabled: cacheEnabledStatus,
  };
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();

  for (const [key, cached] of cacheStore.entries()) {
    if (now > cached.expiry) {
      cacheStore.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}
