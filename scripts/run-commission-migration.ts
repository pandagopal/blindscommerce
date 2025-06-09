import { getPool } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runCommissionMigration() {
  try {
    console.log('🚀 Starting commission system migration...');
    
    const pool = await getPool();
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_commission_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip certain MySQL-specific statements
      if (statement.includes('SET ') || statement.includes('USE ') || statement.includes('SELECT ')) {
        console.log(`⏭️  Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`);
        continue;
      }
      
      if (statement.toLowerCase().includes('create table')) {
        const tableName = extractTableName(statement);
        console.log(`📋 Creating table: ${tableName}`);
      } else if (statement.toLowerCase().includes('alter table')) {
        const tableName = extractAlterTableName(statement);
        console.log(`🔧 Altering table: ${tableName}`);
      } else if (statement.toLowerCase().includes('create or replace view')) {
        console.log(`👁️ Creating view`);
      } else if (statement.toLowerCase().includes('create index')) {
        console.log(`🔍 Creating index`);
      }
      
      try {
        await pool.execute(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error: any) {
        // Check if it's a "already exists" error - this is okay
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_KEYNAME' ||
            (error.message && (
              error.message.includes('already exists') ||
              error.message.includes('Duplicate column') ||
              error.message.includes('Duplicate key')
            ))) {
          console.log(`⚠️  Already exists - skipping statement ${i + 1}`);
          continue;
        }
        
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        console.log(`Statement: ${statement.substring(0, 100)}...`);
        
        // Continue with other statements even if one fails
        continue;
      }
    }
    
    console.log('🎉 Commission system migration completed!');
    
    // Verify the tables were created
    console.log('\n🔍 Verifying created tables...');
    await verifyTables(pool);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

function extractTableName(statement: string): string {
  const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i);
  return match ? match[1] : 'unknown';
}

function extractAlterTableName(statement: string): string {
  const match = statement.match(/ALTER TABLE\s+`?(\w+)`?/i);
  return match ? match[1] : 'unknown';
}

async function verifyTables(pool: any) {
  const tablesToCheck = [
    'vendor_commissions',
    'vendor_payments',
    'vendor_ratings',
    'commission_disputes'
  ];
  
  for (const tableName of tablesToCheck) {
    try {
      const [rows] = await pool.execute(`SHOW TABLES LIKE '${tableName}'`);
      if ((rows as any[]).length > 0) {
        console.log(`✅ Table '${tableName}' exists`);
        
        // Get row count
        const [countResult] = await pool.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = (countResult as any[])[0].count;
        console.log(`   📊 ${count} rows in ${tableName}`);
      } else {
        console.log(`❌ Table '${tableName}' not found`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${tableName}':`, error);
    }
  }
  
  // Check if commission_rate column was added to vendor_info
  try {
    const [columns] = await pool.execute(`SHOW COLUMNS FROM vendor_info LIKE 'commission_rate'`);
    if ((columns as any[]).length > 0) {
      console.log(`✅ Column 'commission_rate' added to vendor_info`);
    } else {
      console.log(`❌ Column 'commission_rate' not found in vendor_info`);
    }
  } catch (error) {
    console.log(`❌ Error checking vendor_info columns:`, error);
  }
}

// Run the migration
runCommissionMigration().catch(console.error);