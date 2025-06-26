# Frontend Cache Implementation Guide

## Overview

BlindsCommerce now uses a **frontend-only caching system** with manual invalidation. This approach ensures:
- Maximum 10 database connections (hard limit)
- Zero backend caching overhead
- Complete control over cache invalidation
- Better performance through browser storage

## Architecture Changes

### Before (Backend Caching)
- 177 API files with individual caching logic
- 152+ database connections due to cache misses
- Automatic TTL-based expiry
- Server memory usage for caching

### After (Frontend Caching)
- Consolidated v2 API structure (50 endpoints)
- Maximum 10 database connections
- Manual cache invalidation only
- Browser-based storage (localStorage + memory)

## Key Components

### 1. Cache Hook (`/hooks/useCache.ts`)
```typescript
const { data, loading, error, invalidate, refresh } = useCache(
  'products-list',
  async () => fetch('/api/v2/commerce/products').then(r => r.json()),
  { persist: true }
);
```

Features:
- Automatic localStorage persistence
- Manual invalidation only (no TTL)
- Cross-component cache sharing
- Loading and error states

### 2. Cache Context (`/context/CacheContext.tsx`)
Provides centralized cache management:
- `invalidateProducts()` - Clear product caches
- `invalidateCart()` - Clear cart data
- `invalidateUser()` - Clear user data
- `invalidateVendor(vendorId?)` - Clear vendor data
- `invalidateOrders()` - Clear order data
- `invalidateAll()` - Clear everything

### 3. Admin Cache Management (`/app/admin/cache`)
- Visual cache statistics
- One-click invalidation buttons
- Pattern-based cache clearing
- Real-time cache monitoring

## Implementation Examples

### Basic Data Fetching
```typescript
import { useCache } from '@/hooks/useCache';

function ProductList() {
  const { data: products, loading, error, invalidate } = useCache(
    'products-list',
    async () => {
      const response = await fetch('/api/v2/commerce/products');
      return response.json();
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      <button onClick={invalidate}>Refresh Products</button>
    </div>
  );
}
```

### After Data Mutation
```typescript
async function updateProduct(id: number, data: any) {
  await fetch(`/api/v2/commerce/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  
  // Invalidate related caches
  invalidateProducts();
  invalidatePattern(`cache:product:${id}`);
}
```

### Admin Controls Integration
```typescript
import { CacheProvider } from '@/context/CacheContext';
import { CacheControls } from '@/components/CacheControls';

function AdminLayout({ children }) {
  return (
    <CacheProvider>
      {children}
      <CacheControls /> {/* Floating cache control UI */}
    </CacheProvider>
  );
}
```

## V2 API Structure

### Service Endpoints
- `/api/v2/commerce/*` - Products, cart, orders
- `/api/v2/users/*` - User profiles, preferences
- `/api/v2/vendors/*` - Vendor dashboard, products
- `/api/v2/admin/*` - Administrative functions
- `/api/v2/analytics/*` - Reports and analytics
- `/api/v2/auth/*` - Authentication

### Action-Based Routing
```
GET  /api/v2/commerce/products
POST /api/v2/commerce/cart/add
PUT  /api/v2/commerce/cart/items/:id
DELETE /api/v2/commerce/cart/items/:id
```

## Cache Invalidation Guidelines

### When to Invalidate

1. **Products**: After editing product info, prices, or inventory
2. **Cart**: After adding/removing items or applying coupons
3. **User**: After profile updates or preference changes
4. **Vendor**: After vendor settings or product changes
5. **Orders**: After order status updates

### Best Practices

1. **Granular Invalidation**: Clear only affected caches
   ```typescript
   // Good
   invalidatePattern(`cache:product:${productId}`);
   
   // Avoid (unless necessary)
   invalidateAll();
   ```

2. **Batch Operations**: Invalidate once after bulk updates
   ```typescript
   await Promise.all(updates);
   invalidateProducts(); // Once at the end
   ```

3. **User Feedback**: Show cache clear confirmation
   ```typescript
   invalidateCart();
   toast.success('Cart refreshed!');
   ```

## Performance Optimization

### 1. Service Layer Benefits
- Single database query per operation
- Optimized JOINs reduce round trips
- Parallel query execution
- Connection pooling (max 10)

### 2. Query Optimization Tools
```typescript
import { QueryOptimizer } from '@/lib/db/QueryOptimizer';

// Analyze query performance
const analysis = await QueryOptimizer.analyzeQuery(
  'SELECT * FROM products WHERE category_id = ?',
  [categoryId]
);

// Batch similar queries
const batchQuery = QueryOptimizer.createBatchQuery(
  baseQuery,
  conditions
);
```

### 3. Frontend Cache Stats
```typescript
import { getCacheStats } from '@/hooks/useCache';

const stats = getCacheStats();
console.log({
  memoryCacheSize: stats.memoryCacheSize,
  localStorageEntries: stats.localStorageEntries,
  totalSizeBytes: stats.totalSizeBytes
});
```

## Migration from Old APIs

### Old Pattern
```typescript
// 177 individual API calls
const products = await fetch('/api/products');
const pricing = await fetch('/api/products/pricing');
const vendors = await fetch('/api/products/vendors');
```

### New Pattern
```typescript
// Single consolidated call
const { data } = await fetch('/api/v2/commerce/products');
// Returns products with pricing and vendor info
```

## Troubleshooting

### Cache Not Updating
1. Check if cache was manually invalidated
2. Verify correct cache key pattern
3. Check browser localStorage limits

### Database Connection Errors
1. Monitor connection pool usage
2. Check for N+1 queries
3. Use QueryBatcher for bulk operations

### Performance Issues
1. Enable browser DevTools Network tab
2. Check cache hit/miss ratio
3. Monitor API response times

## Summary

The new architecture achieves:
- ✅ Hard limit of 10 database connections
- ✅ 88% reduction in API files (177 → 20 services)
- ✅ Frontend-only caching with manual control
- ✅ Better performance through optimized queries
- ✅ Cleaner, more maintainable codebase

Remember: **Always manually invalidate caches after data changes!**