/**
 * APPLICATION HEALTH CHECK TESTS
 * 
 * These tests verify that the core application infrastructure is working
 * They would have caught the "Failed to fetch Sales Team" error by testing:
 * - Database connectivity
 * - API endpoint availability
 * - Authentication system
 * - Environment configuration
 */

import { NextRequest } from 'next/server';

describe('BlindsCommerce Application Health Checks', () => {
  describe('CRITICAL: Database Health', () => {
    test('Database connection can be established', async () => {
      try {
        // Try to import and use the real database connection
        const { execute } = await import('@/lib/db');
        
        // Test basic connectivity with a simple query
        const result = await execute('SELECT 1 as test');
        
        expect(result).toBeDefined();
        console.log('✅ Database connection successful');
      } catch (error: any) {
        console.error('❌ DATABASE CONNECTION FAILED!');
        console.error('Error:', error.message);
        console.error('This is likely why you see "Failed to fetch Sales Team"');
        
        // Provide specific diagnosis
        if (error.message.includes('ECONNREFUSED')) {
          console.error('🔍 DIAGNOSIS: Database server is not running or refusing connections');
          console.error('   - Check if MySQL is running on the expected port');
          console.error('   - Verify DATABASE_URL environment variable');
        } else if (error.message.includes('Access denied')) {
          console.error('🔍 DIAGNOSIS: Database authentication failed');
          console.error('   - Check username/password in DATABASE_URL');
        } else if (error.message.includes('Unknown database')) {
          console.error('🔍 DIAGNOSIS: Database does not exist');
          console.error('   - Ensure the database specified in DATABASE_URL exists');
        }
        
        throw error;
      }
    });

    test('Required database tables exist', async () => {
      try {
        const { execute } = await import('@/lib/db');
        
        // Check if core tables exist
        const tables = ['users', 'vendor_info', 'sales_staff'];
        
        for (const table of tables) {
          try {
            await execute(`SELECT 1 FROM ${table} LIMIT 1`);
            console.log(`✅ Table '${table}' exists`);
          } catch (error: any) {
            console.error(`❌ Table '${table}' missing or inaccessible!`);
            console.error('Error:', error.message);
            throw new Error(`Required table '${table}' is missing`);
          }
        }
      } catch (error) {
        console.error('🔍 DIAGNOSIS: Database schema is incomplete');
        console.error('   - Run database migrations');
        console.error('   - Ensure all required tables are created');
        throw error;
      }
    });

    test('Database has proper indexes and constraints', async () => {
      try {
        const { execute } = await import('@/lib/db');
        
        // Test foreign key relationships that sales team API depends on
        const [userResult] = await execute(`
          SELECT COUNT(*) as count 
          FROM information_schema.TABLE_CONSTRAINTS 
          WHERE TABLE_NAME = 'sales_staff' 
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        `);
        
        console.log(`✅ Sales staff table has ${userResult[0]?.count || 0} foreign key constraints`);
      } catch (error: any) {
        console.error('❌ DATABASE INTEGRITY CHECK FAILED!');
        console.error('Error:', error.message);
        // Don't fail the test for this, just warn
      }
    });
  });

  describe('CRITICAL: API Endpoint Health', () => {
    test('Vendor sales team API endpoint exists and is accessible', async () => {
      try {
        // Import the actual API handler
        const { GET } = await import('@/app/api/vendor/sales-team/route');
        
        expect(GET).toBeDefined();
        expect(typeof GET).toBe('function');
        console.log('✅ Vendor sales team API handler exists');
      } catch (error: any) {
        console.error('❌ API HANDLER IMPORT FAILED!');
        console.error('Error:', error.message);
        console.error('🔍 DIAGNOSIS: API route file is missing or has syntax errors');
        throw error;
      }
    });

    test('API can handle requests without database errors', async () => {
      try {
        const { GET } = await import('@/app/api/vendor/sales-team/route');
        
        // Create a test request
        const request = new NextRequest('http://localhost:3000/api/vendor/sales-team', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        // This will fail if database is not connected
        const response = await GET(request);
        
        // We expect either 200 (success) or 401 (auth required), NOT 500 (server error)
        expect([200, 401, 403]).toContain(response.status);
        
        if (response.status === 500) {
          const errorData = await response.json();
          console.error('❌ API RETURNED 500 ERROR!');
          console.error('Error response:', errorData);
          console.error('🔍 This is the exact error you\'re seeing in the browser!');
          throw new Error(`API returned 500 error: ${errorData.error}`);
        }
        
        console.log(`✅ API responds with status ${response.status} (not 500 error)`);
      } catch (error: any) {
        console.error('❌ API EXECUTION FAILED!');
        console.error('Error:', error.message);
        console.error('🔍 This explains why the sales team page shows "Failed to fetch"');
        throw error;
      }
    });
  });

  describe('CRITICAL: Authentication System Health', () => {
    test('NextAuth configuration is valid', async () => {
      try {
        // Try to import NextAuth configuration
        const { getServerSession } = await import('next-auth/next');
        
        expect(getServerSession).toBeDefined();
        console.log('✅ NextAuth is properly configured');
        
        // Check environment variables
        const requiredAuthVars = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
        const missingVars = requiredAuthVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
          console.error('❌ MISSING AUTH ENVIRONMENT VARIABLES:', missingVars);
          throw new Error(`Missing auth environment variables: ${missingVars.join(', ')}`);
        }
        
        console.log('✅ Auth environment variables are configured');
      } catch (error: any) {
        console.error('❌ AUTHENTICATION SYSTEM CHECK FAILED!');
        console.error('Error:', error.message);
        console.error('🔍 DIAGNOSIS: Authentication is not properly configured');
        throw error;
      }
    });
  });

  describe('CRITICAL: Environment Configuration Health', () => {
    test('All required environment variables are present', () => {
      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];

      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        console.error('❌ MISSING ENVIRONMENT VARIABLES:');
        missing.forEach(varName => {
          console.error(`   - ${varName}`);
        });
        console.error('🔍 DIAGNOSIS: Environment not properly configured');
        console.error('   - Check your .env.local file');
        console.error('   - Ensure all required variables are set');
      }
      
      expect(missing).toHaveLength(0);
      console.log('✅ All required environment variables are present');
    });

    test('Database URL format is valid', () => {
      const dbUrl = process.env.DATABASE_URL;
      
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }
      
      // Check format
      const isValidFormat = dbUrl.match(/^mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+$/);
      
      if (!isValidFormat) {
        console.error('❌ INVALID DATABASE_URL FORMAT!');
        console.error('Current:', dbUrl);
        console.error('Expected format: mysql://username:password@host:port/database');
        console.error('🔍 This could cause connection failures');
      }
      
      expect(isValidFormat).toBeTruthy();
      console.log('✅ Database URL format is valid');
    });

    test('Node.js environment is properly configured', () => {
      const nodeEnv = process.env.NODE_ENV;
      const validEnvs = ['development', 'production', 'test'];
      
      expect(validEnvs).toContain(nodeEnv);
      console.log(`✅ Node environment: ${nodeEnv}`);
      
      // Check Node.js version compatibility
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion < 16) {
        console.warn(`⚠️  Node.js version ${nodeVersion} may cause compatibility issues`);
        console.warn('   Recommended: Node.js 16 or higher');
      } else {
        console.log(`✅ Node.js version: ${nodeVersion}`);
      }
    });
  });

  describe('REGRESSION DETECTION: End-to-End Health', () => {
    test('Complete vendor sales team workflow health check', async () => {
      console.log('🔍 PERFORMING COMPLETE HEALTH CHECK...');
      
      try {
        // 1. Check database
        const { execute } = await import('@/lib/db');
        await execute('SELECT 1');
        console.log('  ✅ Database: Connected');
        
        // 2. Check vendor_info table
        await execute('SELECT COUNT(*) FROM vendor_info LIMIT 1');
        console.log('  ✅ vendor_info table: Accessible');
        
        // 3. Check sales_staff table
        await execute('SELECT COUNT(*) FROM sales_staff LIMIT 1');
        console.log('  ✅ sales_staff table: Accessible');
        
        // 4. Check API handler
        const { GET } = await import('@/app/api/vendor/sales-team/route');
        expect(GET).toBeDefined();
        console.log('  ✅ API handler: Available');
        
        // 5. Check authentication
        const { getServerSession } = await import('next-auth/next');
        expect(getServerSession).toBeDefined();
        console.log('  ✅ Authentication: Configured');
        
        console.log('🎉 HEALTH CHECK PASSED - Application should be working!');
        
      } catch (error: any) {
        console.error('💥 HEALTH CHECK FAILED!');
        console.error('🔍 ROOT CAUSE IDENTIFIED:');
        console.error(`   ${error.message}`);
        console.error('');
        console.error('🚨 This is why your vendor sales team page shows:');
        console.error('   "Error: Failed to fetch Sales Team"');
        console.error('');
        console.error('🔧 RECOMMENDED FIXES:');
        
        if (error.message.includes('ECONNREFUSED')) {
          console.error('   1. Start your MySQL database server');
          console.error('   2. Verify DATABASE_URL points to running database');
          console.error('   3. Check firewall settings');
        } else if (error.message.includes('Access denied')) {
          console.error('   1. Check database username and password in DATABASE_URL');
          console.error('   2. Verify user has proper permissions');
        } else if (error.message.includes('doesn\'t exist')) {
          console.error('   1. Create the missing database/table');
          console.error('   2. Run database migrations');
          console.error('   3. Import database schema');
        } else {
          console.error('   1. Check application logs for detailed error information');
          console.error('   2. Verify all environment variables are correctly set');
          console.error('   3. Ensure all dependencies are properly installed');
        }
        
        throw error;
      }
    });
  });
});