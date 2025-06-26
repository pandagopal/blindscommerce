# BlindsCommerce Database Connection Patterns

## Overview

This document outlines the current database connection patterns used in the BlindsCommerce application and provides guidelines for consistent database access across all components.

## Core Database Module (`/lib/db/index.ts`)

### Connection Pool Management

The application uses a singleton connection pool pattern with the following features:

1. **Single Pool Instance**: One pool shared across the entire application
2. **Connection Limit**: 10 connections maximum
3. **Connection Recovery**: Automatic retry logic with exponential backoff
4. **Health Monitoring**: Pool status tracking and recovery mechanisms

```typescript
// Pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blindscommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
  multipleStatements: false
});
```

### Key Functions

1. **`getPool()`**: Returns the singleton pool instance
   - Implements connection retry logic
   - Handles recovery after failures
   - Validates environment variables

2. **`executeQuery<T>()`**: Generic query execution with error handling
   - Type-safe results
   - Consistent error messages
   - Prevents sensitive data exposure

3. **`db.execute()` and `db.query()`**: Direct query execution methods
   - Used for parameterized queries
   - Returns typed results

## Connection Patterns

### Pattern 1: Direct Pool Execution (Recommended)

For simple queries without transactions:

```typescript
const pool = await getPool();
const [rows] = await pool.execute<RowDataPacket[]>(
  'SELECT * FROM users WHERE user_id = ?',
  [userId]
);
```

**Advantages**:
- No manual connection management
- Pool handles connection lifecycle
- Prevents connection leaks

### Pattern 2: Transaction Pattern

For operations requiring transactions:

```typescript
const pool = await getPool();
const connection = await pool.getConnection();

try {
  await connection.beginTransaction();
  
  // Multiple queries
  await connection.execute('INSERT INTO orders ...', [...]);
  await connection.execute('UPDATE inventory ...', [...]);
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release(); // CRITICAL: Always release
}
```

### Pattern 3: Consolidated API Handler Pattern

The new consolidated API pattern uses the base handler:

```typescript
export class MyHandler extends ConsolidatedAPIHandler {
  async handleGET(req: NextRequest, user: any | null) {
    const pool = await getPool();
    
    // Use executeParallelQueries for multiple queries
    const data = await this.executeParallelQueries({
      orders: () => pool.execute('SELECT * FROM orders WHERE user_id = ?', [user.id]),
      stats: () => pool.execute('SELECT COUNT(*) FROM orders WHERE user_id = ?', [user.id])
    });
    
    return this.successResponse(data);
  }
}
```

## MySQL2 Parameter Binding Issues

### Problem
MySQL2 has issues with parameter binding for LIMIT and OFFSET clauses.

### Solution
Use safe string interpolation for validated integers:

```typescript
// ❌ WRONG - Causes "Incorrect arguments to mysqld_stmt_execute"
const [rows] = await pool.execute(
  'SELECT * FROM products LIMIT ? OFFSET ?',
  [limit, offset]
);

// ✅ CORRECT - Safe interpolation for validated integers
const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
const safeOffset = Math.max(0, Math.floor(offset));
const [rows] = await pool.execute(
  `SELECT * FROM products LIMIT ${safeLimit} OFFSET ${safeOffset}`,
  []
);
```

### Safe Interpolation Rules

**SAFE to interpolate (after validation)**:
- Validated integers (LIMIT, OFFSET)
- Predefined column names (ORDER BY)
- Predefined sort directions (ASC/DESC)

**NEVER interpolate**:
- User input strings
- Dynamic table names
- WHERE clause values
- Any untrusted data

## Connection Leak Prevention

### Common Causes of Leaks

1. **Forgetting to release connections**:
```typescript
// ❌ LEAK - Connection never released
const connection = await pool.getConnection();
const [rows] = await connection.execute('SELECT ...');
// Missing: connection.release()
```

2. **Not handling errors in transactions**:
```typescript
// ❌ LEAK - Connection not released on error
const connection = await pool.getConnection();
await connection.beginTransaction();
await connection.execute('INSERT ...'); // If this fails, connection leaks
await connection.commit();
connection.release();
```

### Prevention Strategies

1. **Always use try-finally**:
```typescript
const connection = await pool.getConnection();
try {
  // Do work
} finally {
  connection.release();
}
```

2. **Prefer pool.execute() for non-transactional queries**:
```typescript
// ✅ No manual connection management needed
const [rows] = await pool.execute('SELECT ...', params);
```

3. **Monitor pool status**:
```typescript
const poolInfo = await getPoolInfo();
console.log('Connections:', poolInfo);
// { total: 10, free: 8, used: 2, queued: 0 }
```

## Caching Integration

The consolidated API handlers integrate caching:

```typescript
const result = await this.getFromCacheOrDatabase(
  cacheKey,
  async () => {
    const pool = await getPool();
    const [rows] = await pool.execute('SELECT ...', params);
    return rows;
  }
);
```

## Error Handling

### Database Error Categories

1. **Connection Errors**: Handled by retry logic
2. **Query Errors**: Wrapped in generic error messages
3. **Validation Errors**: Caught before query execution

### Error Response Pattern

```typescript
try {
  const pool = await getPool();
  const [rows] = await pool.execute(query, params);
  return NextResponse.json({ success: true, data: rows });
} catch (error) {
  // Log detailed error internally
  logError(error, { endpoint, query });
  
  // Return generic error to client
  return NextResponse.json(
    { 
      success: false, 
      error: 'Database operation failed' 
    },
    { status: 500 }
  );
}
```

## Performance Optimization

### Connection Pool Tuning

- **Connection Limit**: 10 (adjust based on load)
- **Queue Limit**: 0 (unlimited queue)
- **Connection Timeout**: 20 seconds
- **Wait for Connections**: true

### Query Optimization

1. **Use indexes**: Ensure proper indexing
2. **Limit results**: Always paginate large datasets
3. **Parallel queries**: Use Promise.all for independent queries
4. **Caching**: Cache frequently accessed data

### Monitoring

Track these metrics:
- Active connections
- Query execution time
- Cache hit rates
- Connection wait time

## Migration to Consolidated APIs

### Benefits

1. **Reduced Connections**: Single handler for multiple operations
2. **Built-in Caching**: Automatic cache management
3. **Standardized Responses**: Consistent API structure
4. **Role-based Access**: Centralized authorization

### Migration Steps

1. Create handler extending `ConsolidatedAPIHandler`
2. Implement required methods (GET, POST, etc.)
3. Use `executeParallelQueries` for multiple queries
4. Add caching with `getFromCacheOrDatabase`
5. Update routes to use new handler

## Best Practices Summary

1. **Always use parameterized queries** (except for safe interpolation)
2. **Release connections in finally blocks**
3. **Prefer pool.execute() over manual connections**
4. **Validate all inputs before queries**
5. **Use transactions only when necessary**
6. **Implement proper error handling**
7. **Monitor connection pool usage**
8. **Cache frequently accessed data**
9. **Use consolidated handlers for new APIs**
10. **Test for connection leaks**

## Environment Variables

Required database configuration:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blindscommerce
```

## Troubleshooting

### High Connection Count

1. Check for missing `connection.release()`
2. Review transaction error handling
3. Monitor long-running queries
4. Check for connection leaks in loops

### "Incorrect arguments to mysqld_stmt_execute"

1. Check LIMIT/OFFSET parameter binding
2. Use safe interpolation for pagination
3. Verify parameter types match query

### Connection Timeouts

1. Increase `connectTimeout` if needed
2. Check database server load
3. Review query performance
4. Consider connection pooling limits