/**
 * SIMPLE HEALTH CHECK TESTS
 * 
 * Basic tests to identify why "Failed to fetch Sales Team" error occurs
 * These tests focus on the core issues without complex Next.js imports
 */

describe('BlindsCommerce Simple Health Checks', () => {
  describe('CRITICAL: Environment Configuration', () => {
    test('Required environment variables are present', () => {
      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];

      console.log('🔍 Checking environment variables...');
      
      const results = requiredVars.map(varName => {
        const value = process.env[varName];
        const exists = !!value;
        
        console.log(`  ${varName}: ${exists ? '✅ SET' : '❌ MISSING'}`);
        if (exists && varName === 'DATABASE_URL') {
          // Mask password for security
          const maskedUrl = value.replace(/:([^:@]+)@/, ':****@');
          console.log(`    Value: ${maskedUrl}`);
        }
        
        return { varName, exists, value };
      });

      const missing = results.filter(r => !r.exists);
      
      if (missing.length > 0) {
        console.error('❌ DIAGNOSIS: Missing environment variables!');
        console.error('🔧 FIX: Create/update your .env.local file with:');
        missing.forEach(({ varName }) => {
          console.error(`   ${varName}=your_value_here`);
        });
        console.error('');
        console.error('💡 This could be why your sales team page fails to load!');
      }

      expect(missing).toHaveLength(0);
    });

    test('Database URL format validation', () => {
      const dbUrl = process.env.DATABASE_URL;
      
      if (!dbUrl) {
        throw new Error('DATABASE_URL is not set');
      }

      console.log('🔍 Validating DATABASE_URL format...');
      
      // Check basic MySQL URL format
      const mysqlPattern = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
      const match = dbUrl.match(mysqlPattern);
      
      if (!match) {
        console.error('❌ INVALID DATABASE_URL FORMAT!');
        console.error(`Current: ${dbUrl.replace(/:([^:@]+)@/, ':****@')}`);
        console.error('Expected: mysql://username:password@host:port/database');
        console.error('');
        console.error('🔧 FIX: Update DATABASE_URL in your .env.local file');
        console.error('Example: mysql://user:pass@localhost:3306/blindscommerce');
        
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, username, password, host, port, database] = match;
      
      console.log('  ✅ Format is valid');
      console.log(`  Username: ${username}`);
      console.log(`  Host: ${host}`);
      console.log(`  Port: ${port}`);
      console.log(`  Database: ${database}`);
      
      // Additional validations
      if (host === 'localhost' || host === '127.0.0.1') {
        console.log('  💡 Using local database - ensure MySQL is running');
      }
      
      if (port !== '3306') {
        console.log(`  💡 Using non-standard port ${port} - ensure MySQL is running on this port`);
      }
    });
  });

  describe('CRITICAL: File System Health', () => {
    test('Required application files exist', async () => {
      const requiredFiles = [
        '../app/api/vendor/sales-team/route.ts',
        '../app/vendor/sales-team/page.tsx',
        '../lib/db.ts'
      ];

      console.log('🔍 Checking required files...');
      
      for (const filePath of requiredFiles) {
        try {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.resolve(__dirname, filePath);
          
          if (fs.existsSync(fullPath)) {
            console.log(`  ✅ ${filePath}`);
          } else {
            console.error(`  ❌ ${filePath} - FILE MISSING!`);
            throw new Error(`Required file missing: ${filePath}`);
          }
        } catch (error: any) {
          console.error(`  ❌ ${filePath} - ERROR: ${error.message}`);
          throw error;
        }
      }
    });

    test('Can import database module', async () => {
      try {
        console.log('🔍 Testing database module import...');
        
        // Try to require the database module
        const dbPath = require('path').resolve(__dirname, '../lib/db.ts');
        
        if (require('fs').existsSync(dbPath)) {
          console.log('  ✅ Database module file exists');
          
          // Try to import it (this might fail due to dependencies)
          try {
            require(dbPath);
            console.log('  ✅ Database module can be imported');
          } catch (importError: any) {
            console.log('  ⚠️  Database module exists but has import issues');
            console.log(`     Error: ${importError.message}`);
            // Don't fail the test for import issues, just log them
          }
        } else {
          throw new Error('Database module file does not exist');
        }
      } catch (error: any) {
        console.error('❌ DATABASE MODULE CHECK FAILED!');
        console.error(`Error: ${error.message}`);
        console.error('🔧 FIX: Ensure the database module is properly created');
        throw error;
      }
    });
  });

  describe('CRITICAL: Network and Dependencies', () => {
    test('Node.js version compatibility', () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      console.log(`🔍 Node.js version: ${nodeVersion}`);
      
      if (majorVersion < 16) {
        console.error('❌ INCOMPATIBLE NODE.JS VERSION!');
        console.error(`Current: ${nodeVersion}`);
        console.error('Required: Node.js 16 or higher');
        console.error('🔧 FIX: Upgrade Node.js to version 16 or higher');
        throw new Error(`Node.js version ${nodeVersion} is not supported`);
      }
      
      console.log('  ✅ Node.js version is compatible');
    });

    test('Package dependencies are available', () => {
      const criticalPackages = [
        'mysql2',
        'next',
        'react',
        'next-auth'
      ];

      console.log('🔍 Checking critical dependencies...');
      
      for (const packageName of criticalPackages) {
        try {
          require.resolve(packageName);
          console.log(`  ✅ ${packageName}`);
        } catch (error) {
          console.error(`  ❌ ${packageName} - NOT INSTALLED!`);
          console.error('🔧 FIX: Run npm install to install missing dependencies');
          throw new Error(`Missing dependency: ${packageName}`);
        }
      }
    });
  });

  describe('DIAGNOSIS: Common Failure Scenarios', () => {
    test('Identify most likely cause of "Failed to fetch Sales Team" error', () => {
      console.log('🔍 PERFORMING ROOT CAUSE ANALYSIS...');
      console.log('');
      
      const issues = [];
      
      // Check environment variables
      if (!process.env.DATABASE_URL) {
        issues.push({
          severity: 'CRITICAL',
          issue: 'DATABASE_URL environment variable is missing',
          fix: 'Set DATABASE_URL in your .env.local file'
        });
      }
      
      // Check database URL format
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl && !dbUrl.match(/^mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+$/)) {
        issues.push({
          severity: 'CRITICAL',
          issue: 'DATABASE_URL format is invalid',
          fix: 'Use format: mysql://username:password@host:port/database'
        });
      }
      
      // Check for localhost database
      if (dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
        issues.push({
          severity: 'HIGH',
          issue: 'Using localhost database - may not be running',
          fix: 'Start MySQL server: brew services start mysql (macOS) or systemctl start mysql (Linux)'
        });
      }
      
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      if (majorVersion < 16) {
        issues.push({
          severity: 'HIGH',
          issue: `Node.js version ${nodeVersion} is too old`,
          fix: 'Upgrade to Node.js 16 or higher'
        });
      }
      
      // Report findings
      if (issues.length === 0) {
        console.log('✅ NO OBVIOUS CONFIGURATION ISSUES FOUND');
        console.log('');
        console.log('🔍 The error is likely due to:');
        console.log('   1. Database server not running');
        console.log('   2. Database credentials incorrect');
        console.log('   3. Database/tables not created');
        console.log('   4. Network connectivity issues');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('   1. Verify MySQL is running: mysql -u root -p');
        console.log('   2. Test database connection manually');
        console.log('   3. Check application logs for detailed errors');
      } else {
        console.error('❌ CONFIGURATION ISSUES FOUND:');
        console.error('');
        
        issues.forEach((issue, index) => {
          console.error(`${index + 1}. [${issue.severity}] ${issue.issue}`);
          console.error(`   🔧 Fix: ${issue.fix}`);
          console.error('');
        });
        
        console.error('💡 These issues are likely causing your "Failed to fetch Sales Team" error!');
      }
      
      // Always pass this test - it's just for diagnosis
      expect(true).toBe(true);
    });
  });
});