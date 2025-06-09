const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runPaymentMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting payment integration migration...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'blindscommerce',
      multipleStatements: true
    });
    
    console.log('✅ Connected to database');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_payment_integrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration
    console.log('📝 Executing payment integration migration...');
    await connection.execute(migrationSQL);
    
    console.log('🎉 Payment integration migration completed successfully!');
    
    // Verify the new tables were created
    console.log('\n🔍 Verifying created tables...');
    await verifyTables(connection);
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('SQL message:', error.sqlMessage);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('📦 Database connection closed');
    }
  }
}

async function verifyTables(connection) {
  const tablesToCheck = [
    'payment_intents',
    'payment_method_configurations', 
    'payment_analytics',
    'payment_disputes',
    'payment_refunds'
  ];
  
  for (const tableName of tablesToCheck) {
    try {
      const [rows] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);
      if (rows.length > 0) {
        console.log(`✅ Table '${tableName}' exists`);
        
        // Get row count
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult[0].count;
        console.log(`   📊 ${count} rows in ${tableName}`);
      } else {
        console.log(`❌ Table '${tableName}' not found`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${tableName}':`, error.message);
    }
  }
  
  // Check updated columns in existing tables
  try {
    const [columns] = await connection.execute(`SHOW COLUMNS FROM saved_payment_methods LIKE 'provider'`);
    if (columns.length > 0) {
      console.log(`✅ Column 'provider' added to saved_payment_methods`);
    } else {
      console.log(`❌ Column 'provider' not found in saved_payment_methods`);
    }
  } catch (error) {
    console.log(`❌ Error checking saved_payment_methods columns:`, error.message);
  }
}

// Run the migration
runPaymentMigration();