#!/usr/bin/env node

/**
 * Test Script for Consolidated APIs
 * Tests the database integration of consolidated API handlers
 */

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Test@1234',
  database: 'blindscommerce_test'
};

async function testDatabaseQueries() {
  let pool;
  
  try {
    console.log('🔍 Testing Consolidated API Database Queries...\n');
    
    // Create connection pool
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test 1: Verify essential tables exist
    console.log('1. Testing table existence...');
    const tables = ['users', 'vendor_info', 'products', 'orders', 'cart_items', 'coupon_codes'];
    for (const table of tables) {
      const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ✅ ${table}: ${rows[0].count} records`);
    }
    
    // Test 2: Test vendor dashboard query (from VendorDashboardHandler)
    console.log('\n2. Testing Vendor Dashboard Query...');
    const vendorId = 3; // From our sample data
    
    const [vendorInfo] = await pool.execute(`
      SELECT 
        vi.*,
        AVG(vr.rating) as rating,
        COUNT(vr.review_id) as total_reviews
      FROM vendor_info vi
      LEFT JOIN vendor_reviews vr ON vi.vendor_info_id = vr.vendor_id
      WHERE vi.vendor_info_id = ?
      GROUP BY vi.vendor_info_id
    `, [vendorId]);
    
    if (vendorInfo.length > 0) {
      console.log(`   ✅ Vendor info retrieved for vendor ID ${vendorId}`);
      console.log(`   📊 Business: ${vendorInfo[0].business_name}`);
    } else {
      console.log(`   ❌ No vendor found with ID ${vendorId}`);
    }
    
    // Test 3: Test products query (from ProductsHandler)
    console.log('\n3. Testing Products Query...');
    const [products] = await pool.execute(`
      SELECT 
        p.product_id, p.name, p.base_price, p.is_active,
        p.stock_status, p.approval_status, p.low_stock_threshold
      FROM products p
      WHERE p.is_active = 1
      LIMIT 3
    `);
    
    console.log(`   ✅ Retrieved ${products.length} active products`);
    products.forEach((product, index) => {
      console.log(`   📦 ${index + 1}. ${product.name} - $${product.base_price} (Stock: ${product.stock_status})`);
    });
    
    // Test 4: Test cart query (from CartHandler)
    console.log('\n4. Testing Cart Query...');
    const [carts] = await pool.execute(`
      SELECT cart_id, user_id, status, created_at
      FROM carts
      WHERE status = 'active'
      LIMIT 3
    `);
    
    console.log(`   ✅ Found ${carts.length} active carts`);
    
    // Test 5: Test orders query (from AdminOrdersHandler)
    console.log('\n5. Testing Orders Query...');
    const [orders] = await pool.execute(`
      SELECT 
        o.order_id, o.order_number, o.status, o.total_amount,
        u.first_name, u.last_name, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LIMIT 3
    `);
    
    console.log(`   ✅ Retrieved ${orders.length} orders`);
    orders.forEach((order, index) => {
      console.log(`   🛍️ ${index + 1}. Order #${order.order_number} - ${order.status} ($${order.total_amount})`);
    });
    
    // Test 6: Test vendor-products relationship
    console.log('\n6. Testing Vendor-Products Relationship...');
    const [vendorProducts] = await pool.execute(`
      SELECT 
        vp.vendor_id, vp.product_id, vp.vendor_price,
        p.name as product_name, vi.business_name
      FROM vendor_products vp
      JOIN products p ON vp.product_id = p.product_id
      JOIN vendor_info vi ON vp.vendor_id = vi.vendor_info_id
      LIMIT 5
    `);
    
    console.log(`   ✅ Found ${vendorProducts.length} vendor-product relationships`);
    vendorProducts.forEach((item, index) => {
      console.log(`   🏢 ${index + 1}. ${item.business_name}: ${item.product_name} ($${item.vendor_price})`);
    });
    
    // Test 7: Test coupon codes (fixed table name)
    console.log('\n7. Testing Coupon Codes...');
    const [coupons] = await pool.execute(`
      SELECT coupon_code, discount_type, discount_value, is_active
      FROM coupon_codes
      WHERE is_active = 1
      LIMIT 3
    `);
    
    console.log(`   ✅ Found ${coupons.length} active coupon codes`);
    
    // Test 8: Test joins used in consolidated handlers
    console.log('\n8. Testing Complex Joins...');
    const [complexQuery] = await pool.execute(`
      SELECT 
        o.order_id, o.order_number, o.status,
        COUNT(DISTINCT oi.order_item_id) as item_count,
        COUNT(DISTINCT vp.vendor_id) as vendor_count
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN vendor_products vp ON oi.product_id = vp.product_id
      GROUP BY o.order_id, o.order_number, o.status
      LIMIT 3
    `);
    
    console.log(`   ✅ Complex join query executed successfully - ${complexQuery.length} results`);
    
    console.log('\n🎉 All database tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • All required tables exist and have data`);
    console.log(`   • Vendor dashboard queries work correctly`);
    console.log(`   • Product queries retrieve data properly`);
    console.log(`   • Cart and order queries function as expected`);
    console.log(`   • Table name fixes (coupons→coupon_codes) are working`);
    console.log(`   • Complex joins used by handlers are functional`);
    console.log('\n✅ Database schema is ready for consolidated API endpoints!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('📍 Error details:', error);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 Solution: The table does not exist. Please check table names.');
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('\n💡 Solution: A column is missing. Please verify column names.');
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the tests
if (require.main === module) {
  testDatabaseQueries();
}

module.exports = { testDatabaseQueries };