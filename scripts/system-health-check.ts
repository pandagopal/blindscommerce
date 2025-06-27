#!/usr/bin/env ts-node
/**
 * System Health Check Script
 * Diagnoses common issues after V2 API migration
 */

import { getPool, getPoolInfo } from '../lib/db';
import { verifyToken } from '../lib/auth';
import * as dotenv from 'dotenv';
import { RowDataPacket } from 'mysql2';

// Load environment variables
dotenv.config();

interface HealthCheckResult {
  category: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: HealthCheckResult[] = [];

function addResult(category: string, check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ category, check, status, message, details });
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  console.log(`${icon} [${category}] ${check}: ${message}`);
  if (details && process.env.VERBOSE) {
    console.log('  Details:', JSON.stringify(details, null, 2));
  }
}

async function checkEnvironmentVariables() {
  console.log('\n=== Checking Environment Variables ===');
  
  const requiredVars = [
    'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'
  ];
  
  const optionalVars = [
    'NEXT_PUBLIC_API_URL', 'ENCRYPTION_KEY', 'TAX_JAR_API_KEY'
  ];
  
  let allRequired = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult('Environment', varName, 'PASS', 'Set');
    } else {
      addResult('Environment', varName, 'FAIL', 'Missing required variable');
      allRequired = false;
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addResult('Environment', varName, 'PASS', 'Set');
    } else {
      addResult('Environment', varName, 'WARN', 'Optional variable not set');
    }
  }
  
  return allRequired;
}

async function checkDatabaseConnection() {
  console.log('\n=== Checking Database Connection ===');
  
  try {
    const pool = await getPool();
    addResult('Database', 'Connection Pool', 'PASS', 'Created successfully');
    
    // Test query
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1 as test');
    if (rows[0]?.test === 1) {
      addResult('Database', 'Test Query', 'PASS', 'Query executed successfully');
    }
    
    // Check pool stats
    const poolInfo = await getPoolInfo();
    if (poolInfo) {
      addResult('Database', 'Pool Stats', 'PASS', 
        `Connections: ${poolInfo.used}/${poolInfo.total} (${poolInfo.queued} queued)`,
        poolInfo
      );
      
      if (poolInfo.used > poolInfo.total * 0.8) {
        addResult('Database', 'Pool Usage', 'WARN', 'Connection pool usage is high');
      }
    }
    
    // Check table count
    const [tables] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?',
      [process.env.DB_NAME]
    );
    addResult('Database', 'Table Count', 'PASS', `${tables[0].count} tables found`);
    
    return true;
  } catch (error: any) {
    addResult('Database', 'Connection', 'FAIL', error.message);
    return false;
  }
}

async function checkCriticalTables() {
  console.log('\n=== Checking Critical Tables ===');
  
  const criticalTables = [
    'users', 'products', 'orders', 'cart_items', 'vendors',
    'categories', 'product_pricing_matrix', 'tax_rates'
  ];
  
  try {
    const pool = await getPool();
    
    for (const table of criticalTables) {
      try {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        addResult('Tables', table, 'PASS', `${rows[0].count} records`);
      } catch (error: any) {
        addResult('Tables', table, 'FAIL', `Table check failed: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    addResult('Tables', 'Check', 'FAIL', 'Could not check tables');
    return false;
  }
}

async function checkAuthSystem() {
  console.log('\n=== Checking Authentication System ===');
  
  // Check JWT secret
  if (!process.env.JWT_SECRET) {
    addResult('Auth', 'JWT Secret', 'FAIL', 'JWT_SECRET not set');
    return false;
  }
  
  addResult('Auth', 'JWT Secret', 'PASS', 'Configured');
  
  // Test token generation/verification
  try {
    const { generateToken } = await import('../lib/auth');
    const testToken = await generateToken({ 
      userId: 1, 
      email: 'test@example.com', 
      role: 'customer'
    } as any);
    const decoded = await verifyToken(testToken);
    
    if (decoded && decoded.userId === 1) {
      addResult('Auth', 'Token Verification', 'PASS', 'Token generation and verification working');
    } else {
      addResult('Auth', 'Token Verification', 'FAIL', 'Token verification failed');
    }
  } catch (error: any) {
    addResult('Auth', 'Token System', 'FAIL', error.message);
  }
  
  // Check for circular dependency fix
  try {
    const authFile = require('fs').readFileSync('./lib/auth.ts', 'utf8');
    if (authFile.includes('// FIXED: Direct database query')) {
      addResult('Auth', 'Circular Dependency Fix', 'PASS', 'Auth.ts has been patched');
    } else {
      addResult('Auth', 'Circular Dependency Fix', 'WARN', 'Auth.ts may still have circular dependency');
    }
  } catch (error) {
    addResult('Auth', 'File Check', 'WARN', 'Could not check auth.ts file');
  }
  
  return true;
}

async function checkV2APIs() {
  console.log('\n=== Checking V2 API Endpoints ===');
  
  const v2Endpoints = [
    '/api/v2/commerce/products',
    '/api/v2/commerce/categories',
    '/api/v2/users/profile',
    '/api/v2/content/hero-banners'
  ];
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  for (const endpoint of v2Endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success !== undefined) {
          addResult('V2 API', endpoint, 'PASS', 'Endpoint responding correctly');
        } else {
          addResult('V2 API', endpoint, 'WARN', 'Response format may be incorrect');
        }
      } else {
        addResult('V2 API', endpoint, response.status === 401 ? 'WARN' : 'FAIL', 
          `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      addResult('V2 API', endpoint, 'FAIL', `Request failed: ${error.message}`);
    }
  }
}

async function checkPricingColumns() {
  console.log('\n=== Checking Pricing Column Consistency ===');
  
  try {
    const pool = await getPool();
    
    // Check for decimal precision issues
    const [columns] = await pool.execute<RowDataPacket[]>(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND COLUMN_NAME LIKE '%price%' 
       AND DATA_TYPE = 'decimal'`,
      [process.env.DB_NAME]
    );
    
    let inconsistent = false;
    const precisionMap: Record<string, number> = {};
    
    columns.forEach((col: any) => {
      const match = col.COLUMN_TYPE.match(/decimal\((\d+),(\d+)\)/);
      if (match) {
        const precision = match[2];
        precisionMap[precision] = (precisionMap[precision] || 0) + 1;
        
        if (precision !== '2' && col.COLUMN_NAME !== 'price_per_sqft') {
          addResult('Pricing', `${col.TABLE_NAME}.${col.COLUMN_NAME}`, 'WARN', 
            `Uses ${col.COLUMN_TYPE} instead of decimal(10,2)`);
          inconsistent = true;
        }
      }
    });
    
    if (!inconsistent) {
      addResult('Pricing', 'Column Precision', 'PASS', 'All pricing columns are consistent');
    }
    
    // Check for missing pricing columns from the SQL migration
    const newColumns = [
      { table: 'cart_items', column: 'configuration_price' },
      { table: 'cart_items', column: 'material_surcharge' },
      { table: 'orders', column: 'seasonal_discount_amount' }
    ];
    
    for (const { table, column } of newColumns) {
      const [exists] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [process.env.DB_NAME, table, column]
      );
      
      if (exists[0].count > 0) {
        addResult('Pricing', `${table}.${column}`, 'PASS', 'Migration column exists');
      } else {
        addResult('Pricing', `${table}.${column}`, 'WARN', 'Migration not yet applied');
      }
    }
    
  } catch (error: any) {
    addResult('Pricing', 'Column Check', 'FAIL', error.message);
  }
}

async function generateReport() {
  console.log('\n\n=== HEALTH CHECK SUMMARY ===\n');
  
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    warnings: results.filter(r => r.status === 'WARN').length
  };
  
  console.log(`Total Checks: ${summary.total}`);
  console.log(`✓ Passed: ${summary.passed}`);
  console.log(`✗ Failed: ${summary.failed}`);
  console.log(`⚠ Warnings: ${summary.warnings}`);
  
  if (summary.failed > 0) {
    console.log('\n=== CRITICAL ISSUES TO FIX ===\n');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`- [${r.category}] ${r.check}: ${r.message}`);
    });
  }
  
  if (summary.warnings > 0) {
    console.log('\n=== WARNINGS TO ADDRESS ===\n');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`- [${r.category}] ${r.check}: ${r.message}`);
    });
  }
  
  console.log('\n=== RECOMMENDATIONS ===\n');
  
  if (results.some(r => r.category === 'Auth' && r.status !== 'PASS')) {
    console.log('1. Authentication Issues:');
    console.log('   - Ensure JWT_SECRET is properly set');
    console.log('   - Verify the auth.ts circular dependency fix is applied');
    console.log('   - Restart the application after fixes\n');
  }
  
  if (results.some(r => r.category === 'Database' && r.status === 'FAIL')) {
    console.log('2. Database Connection Issues:');
    console.log('   - Check database credentials in .env');
    console.log('   - Ensure MySQL server is running');
    console.log('   - Verify network connectivity to database\n');
  }
  
  if (results.some(r => r.category === 'V2 API' && r.status === 'FAIL')) {
    console.log('3. V2 API Issues:');
    console.log('   - Check if the application server is running');
    console.log('   - Verify NEXT_PUBLIC_API_URL is correctly set');
    console.log('   - Check for any middleware errors\n');
  }
  
  if (results.some(r => r.category === 'Pricing' && r.status === 'WARN')) {
    console.log('4. Pricing Column Updates:');
    console.log('   - Run: mysql < scripts/fix-pricing-columns.sql');
    console.log('   - This will standardize decimal precision');
    console.log('   - Add missing configuration columns\n');
  }
}

// Main execution
async function main() {
  console.log('BlindsCommerce System Health Check');
  console.log('==================================\n');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Run all checks
  await checkEnvironmentVariables();
  
  const dbOk = await checkDatabaseConnection();
  if (dbOk) {
    await checkCriticalTables();
    await checkPricingColumns();
  }
  
  await checkAuthSystem();
  
  // Only check APIs if not in test environment
  if (process.env.NODE_ENV !== 'test') {
    await checkV2APIs();
  }
  
  // Generate report
  await generateReport();
  
  // Exit with appropriate code
  const failedCount = results.filter(r => r.status === 'FAIL').length;
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run the health check
if (require.main === module) {
  main().catch(error => {
    console.error('\nHealth check failed with error:', error);
    process.exit(1);
  });
}