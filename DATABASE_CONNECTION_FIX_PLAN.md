# Database Connection Leak Fix Plan

## Problem
- Database connections: 33/10 (330% over limit)
- Root cause: 215 APIs with multiple sequential database calls
- Many APIs making 2-6 separate database calls sequentially instead of in parallel

## APIs Already Fixed ✅
1. `/api/account/dashboard/route.ts` - 4 calls → Promise.all()
2. `/api/homepage/data/route.ts` - 2 calls → Promise.all()  
3. `/api/products/search/route.ts` - 6 calls → Promise.all()
4. All getConnection() APIs fixed for immediate release pattern

## High Priority APIs to Fix (Multiple DB Calls)
1. `/api/vendors/[vendorId]/ratings/route.ts` - 7 calls
2. `/api/payments/klarna/webhook/route.ts` - 6 calls
3. `/api/payments/paypal/capture-order/route.ts` - 7 calls
4. `/api/payments/afterpay/capture-payment/route.ts` - 4 calls
5. `/api/payments/affirm/capture-payment/route.ts` - 5 calls
6. `/api/products/search/suggestions/route.ts` - 5 calls
7. `/api/products/data/route.ts` - 4 calls
8. `/api/storefront/[vendor]/page-data/route.ts` - 3 calls

## Solution Strategy
1. **Parallelize queries**: Use Promise.all() for independent queries
2. **Consolidate queries**: Combine related queries where possible
3. **Cache frequently accessed data**: Reduce database hits
4. **Connection pooling**: Ensure proper pool.execute() usage

## API Bloat Analysis (215 APIs vs 50 needed)

### Redundant API Categories:
1. **Cart System**: 22 APIs (should be 3-4)
   - Multiple endpoints for same functionality
   - Separate APIs for each minor feature
   
2. **Admin Dashboard**: 32 APIs (should be 8-10)
   - Too granular - should be consolidated
   
3. **Vendor Portal**: 32 APIs (should be 8-10)
   - Excessive feature fragmentation
   
4. **Payment Processing**: 11 APIs (should be 3-4)
   - One API per payment method instead of unified

### Consolidation Opportunities:
1. **Merge similar endpoints**
2. **Use query parameters instead of separate routes**
3. **Combine CRUD operations**
4. **Reduce over-engineering**

## Target: Reduce to ~50 well-designed APIs