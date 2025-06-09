const mysql = require('mysql2/promise');

async function runSimplePaymentMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting simplified payment integration migration...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Test@1234',
      database: 'blindscommerce'
    });
    
    console.log('✅ Connected to database');
    
    // Step 1: Create payment_intents table
    console.log('📋 Creating payment_intents table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        provider ENUM('stripe', 'paypal', 'klarna', 'afterpay', 'affirm') NOT NULL,
        provider_order_id VARCHAR(255) NOT NULL,
        transaction_id VARCHAR(255) NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency CHAR(3) DEFAULT 'USD',
        status ENUM('pending', 'completed', 'failed', 'cancelled', 'expired') DEFAULT 'pending',
        captured_amount DECIMAL(10,2) NULL,
        order_data JSON NULL,
        processor_response JSON NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_provider_order (provider, provider_order_id),
        INDEX idx_user_provider (user_id, provider),
        INDEX idx_status (status)
      )
    `);
    
    // Step 2: Add columns to saved_payment_methods
    console.log('🔧 Adding columns to saved_payment_methods...');
    try {
      await connection.execute(`ALTER TABLE saved_payment_methods ADD COLUMN provider VARCHAR(50) DEFAULT 'stripe'`);
      console.log('   ✅ Added provider column');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('   ❌ Error adding provider column:', error.message);
      } else {
        console.log('   ℹ️  Provider column already exists');
      }
    }
    
    try {
      await connection.execute(`ALTER TABLE saved_payment_methods ADD COLUMN external_id VARCHAR(255) NULL`);
      console.log('   ✅ Added external_id column');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('   ❌ Error adding external_id column:', error.message);
      } else {
        console.log('   ℹ️  External_id column already exists');
      }
    }
    
    try {
      await connection.execute(`ALTER TABLE saved_payment_methods ADD COLUMN payment_data JSON NULL`);
      console.log('   ✅ Added payment_data column');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('   ❌ Error adding payment_data column:', error.message);
      } else {
        console.log('   ℹ️  Payment_data column already exists');
      }
    }
    
    // Step 3: Update payments table
    console.log('🔧 Updating payments table...');
    try {
      await connection.execute(`
        ALTER TABLE payments 
        MODIFY COLUMN payment_method ENUM(
          'credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer',
          'klarna', 'afterpay', 'affirm', 'apple_pay', 'google_pay'
        ) NOT NULL
      `);
      console.log('   ✅ Updated payment_method enum');
    } catch (error) {
      console.log('   ❌ Error updating payments table:', error.message);
    }
    
    // Step 4: Create payment_method_configurations table
    console.log('📋 Creating payment_method_configurations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_method_configurations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        provider VARCHAR(50) NOT NULL,
        method_id VARCHAR(100) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        min_amount DECIMAL(10,2) DEFAULT 0.01,
        max_amount DECIMAL(10,2) DEFAULT 999999.99,
        supported_currencies JSON NULL,
        supported_countries JSON NULL,
        is_active BOOLEAN DEFAULT true,
        sort_order INT DEFAULT 0,
        configuration JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_provider_method (provider, method_id),
        INDEX idx_active_methods (is_active, sort_order)
      )
    `);
    
    // Step 5: Insert default payment configurations
    console.log('📦 Inserting default payment configurations...');
    await connection.execute(`
      INSERT INTO payment_method_configurations (
        provider, method_id, display_name, description, 
        min_amount, max_amount, supported_currencies, supported_countries,
        is_active, sort_order, configuration
      ) VALUES 
      ('stripe', 'card', 'Credit/Debit Card', 'Visa, Mastercard, American Express, Discover', 
       0.50, 999999.99, '["USD", "EUR", "GBP", "CAD", "AUD"]', '["US", "CA", "GB", "AU", "EU"]',
       true, 1, '{"fee_percentage": 2.9, "fee_fixed": 0.30, "processing_time": "instant"}'),
      
      ('paypal', 'paypal', 'PayPal', 'Pay with your PayPal account or PayPal Credit', 
       0.01, 10000.00, '["USD", "EUR", "GBP", "CAD", "AUD"]', '["US", "CA", "GB", "AU", "EU"]',
       true, 5, '{"fee_percentage": 3.49, "fee_fixed": 0.49, "processing_time": "instant"}'),
      
      ('klarna', 'klarna', 'Klarna', 'Pay in 4 interest-free installments', 
       1.00, 10000.00, '["USD", "EUR", "GBP", "SEK"]', '["US", "CA", "GB", "SE", "DE", "AT"]',
       true, 6, '{"installments": 4, "installment_frequency": "bi_weekly", "interest_rate": 0, "credit_check": "soft"}'),
      
      ('afterpay', 'afterpay', 'Afterpay', 'Pay in 4 installments, always interest-free', 
       1.00, 4000.00, '["USD", "AUD", "CAD", "GBP"]', '["US", "CA", "AU", "GB"]',
       true, 7, '{"installments": 4, "installment_frequency": "bi_weekly", "interest_rate": 0, "credit_check": "soft"}'),
      
      ('affirm', 'affirm', 'Affirm', 'Monthly payments as low as 0% APR', 
       50.00, 17500.00, '["USD", "CAD"]', '["US", "CA"]',
       true, 8, '{"installments": [3, 6, 12, 18, 24, 36], "installment_frequency": "monthly", "interest_rate_range": [0, 36], "credit_check": "soft", "prequalification": true}')
      
      ON DUPLICATE KEY UPDATE
        display_name = VALUES(display_name),
        description = VALUES(description),
        configuration = VALUES(configuration),
        updated_at = CURRENT_TIMESTAMP
    `);
    
    // Step 6: Create payment_analytics table
    console.log('📋 Creating payment_analytics table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_analytics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        total_transactions INT DEFAULT 0,
        total_amount DECIMAL(12,2) DEFAULT 0.00,
        successful_transactions INT DEFAULT 0,
        failed_transactions INT DEFAULT 0,
        average_amount DECIMAL(10,2) DEFAULT 0.00,
        conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_date_method (date, payment_method, provider),
        INDEX idx_date_provider (date, provider),
        INDEX idx_method_performance (payment_method, successful_transactions)
      )
    `);
    
    console.log('🎉 Payment integration migration completed successfully!');
    
    // Verify tables
    console.log('\n🔍 Verifying created tables...');
    const tables = ['payment_intents', 'payment_method_configurations', 'payment_analytics'];
    
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ Table '${table}' has ${rows[0].count} rows`);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSimplePaymentMigration();