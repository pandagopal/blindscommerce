const mysql = require('mysql2/promise');
require('dotenv').config();

async function testVendorDiscounts() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Test@1234',
      database: process.env.DB_NAME || 'blindscommerce_test'
    });
    
    console.log('Connected to database successfully');
    
    // First, let's check the table structure
    console.log('\n=== Table Structure ===');
    const [tableInfo] = await connection.execute('DESCRIBE vendor_discounts');
    console.table(tableInfo);
    
    // Query for vendor discounts with volume tiers
    console.log('\n=== Vendor Discounts with Volume Tiers ===');
    const [discounts] = await connection.execute(`
      SELECT 
        vendor_id, 
        discount_name, 
        volume_tiers, 
        minimum_quantity, 
        is_active, 
        valid_from, 
        valid_until 
      FROM vendor_discounts 
      WHERE volume_tiers IS NOT NULL
    `);
    
    if (discounts.length === 0) {
      console.log('No vendor discounts with volume tiers found.');
      
      // Let's check all vendor discounts
      console.log('\n=== All Vendor Discounts ===');
      const [allDiscounts] = await connection.execute(`
        SELECT 
          vendor_id, 
          discount_name, 
          discount_type,
          discount_value,
          volume_tiers, 
          minimum_quantity, 
          is_active 
        FROM vendor_discounts 
        LIMIT 10
      `);
      
      if (allDiscounts.length === 0) {
        console.log('No vendor discounts found at all.');
      } else {
        console.table(allDiscounts);
      }
    } else {
      // Display discounts with volume tiers
      discounts.forEach(discount => {
        console.log('\n--- Discount Details ---');
        console.log(`Vendor ID: ${discount.vendor_id}`);
        console.log(`Name: ${discount.discount_name}`);
        console.log(`Active: ${discount.is_active}`);
        console.log(`Valid From: ${discount.valid_from}`);
        console.log(`Valid Until: ${discount.valid_until}`);
        console.log(`Minimum Quantity: ${discount.minimum_quantity}`);
        
        if (discount.volume_tiers) {
          try {
            const tiers = JSON.parse(discount.volume_tiers);
            console.log('Volume Tiers:');
            console.table(tiers);
          } catch (e) {
            console.log('Volume Tiers (raw):', discount.volume_tiers);
          }
        }
      });
    }
    
    // Check if there are any active volume-based discounts
    console.log('\n=== Active Volume-Based Discounts ===');
    const [activeDiscounts] = await connection.execute(`
      SELECT 
        vendor_id, 
        discount_name, 
        discount_type,
        discount_value,
        volume_tiers, 
        minimum_quantity
      FROM vendor_discounts 
      WHERE is_active = 1 
        AND (volume_tiers IS NOT NULL OR discount_type = 'volume')
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
    `);
    
    if (activeDiscounts.length > 0) {
      console.table(activeDiscounts);
    } else {
      console.log('No active volume-based discounts found.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnection closed');
    }
  }
}

testVendorDiscounts();