import { getPool } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function runPaymentMigration() {
  try {
    console.log('🚀 Starting payment integration migration...');
    
    const pool = await getPool();
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_payment_integrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('create table')) {
        const tableName = extractTableName(statement);
        console.log(`📋 Creating table: ${tableName}`);
      } else if (statement.toLowerCase().includes('alter table')) {
        const tableName = extractAlterTableName(statement);
        console.log(`🔧 Altering table: ${tableName}`);
      } else if (statement.toLowerCase().includes('insert into')) {
        const tableName = extractInsertTableName(statement);
        console.log(`📦 Inserting data into: ${tableName}`);
      } else if (statement.toLowerCase().includes('create index')) {
        console.log(`🔍 Creating index`);
      }
      
      try {
        await pool.execute(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        console.log(`Statement: ${statement.substring(0, 100)}...`);
        
        // Continue with other statements even if one fails
        continue;
      }
    }
    
    console.log('🎉 Payment integration migration completed!');
    
    // Verify the new tables were created
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

function extractInsertTableName(statement: string): string {
  const match = statement.match(/INSERT INTO\s+`?(\w+)`?/i);
  return match ? match[1] : 'unknown';
}

async function verifyTables(pool: any) {
  const tablesToCheck = [
    'payment_intents',
    'payment_method_configurations', 
    'payment_analytics',
    'payment_disputes',
    'payment_refunds'
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
  
  // Check updated columns in existing tables
  try {
    const [columns] = await pool.execute(`SHOW COLUMNS FROM saved_payment_methods LIKE 'provider'`);
    if ((columns as any[]).length > 0) {
      console.log(`✅ Column 'provider' added to saved_payment_methods`);
    } else {
      console.log(`❌ Column 'provider' not found in saved_payment_methods`);
    }
  } catch (error) {
    console.log(`❌ Error checking saved_payment_methods columns:`, error);
  }
}

// Run the migration
runPaymentMigration().catch(console.error);