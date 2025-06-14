// Debug script to check vendor setup
const mysql = require('mysql2/promise');

async function debugVendor() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'gopal1234',
      database: 'blindscommerce'
    });

    console.log('Connected to database');

    // Check if users table has any data
    const [users] = await connection.execute('SELECT user_id, email, role FROM users LIMIT 5');
    console.log('Users in database:', users);

    // Check if vendor_info table has any data
    const [vendors] = await connection.execute('SELECT vendor_info_id, user_id, business_name, approval_status, is_verified, is_active FROM vendor_info');
    console.log('Vendors in database:', vendors);

    // Check if vendor_discounts table exists and has data
    const [discounts] = await connection.execute('SELECT COUNT(*) as count FROM vendor_discounts');
    console.log('Discounts count:', discounts[0].count);

    // Check if vendor_coupons table exists and has data
    const [coupons] = await connection.execute('SELECT COUNT(*) as count FROM vendor_coupons');
    console.log('Coupons count:', coupons[0].count);

    // If no vendors exist, let's create one for the first user
    if (vendors.length === 0 && users.length > 0) {
      const firstUser = users[0];
      console.log(`Creating vendor for user ${firstUser.user_id}`);
      
      const [result] = await connection.execute(`
        INSERT INTO vendor_info (
          user_id, business_name, business_email, approval_status, 
          is_verified, is_active, created_at
        ) VALUES (?, ?, ?, 'approved', 1, 1, NOW())
      `, [firstUser.user_id, 'Test Vendor Business', firstUser.email]);
      
      console.log('Created vendor with ID:', result.insertId);

      // Create a sample discount
      await connection.execute(`
        INSERT INTO vendor_discounts (
          vendor_id, discount_name, display_name, description,
          discount_type, is_automatic, discount_value,
          minimum_order_value, valid_from, is_active, created_at
        ) VALUES (?, 'Test Discount', 'Test 10% Off', 'Test discount for debugging',
                  'percentage', 1, 10.00, 0.00, NOW(), 1, NOW())
      `, [result.insertId]);

      // Create a sample coupon
      await connection.execute(`
        INSERT INTO vendor_coupons (
          vendor_id, coupon_code, coupon_name, display_name, description,
          discount_type, discount_value, minimum_order_value,
          usage_limit_per_customer, valid_from, is_active, created_at
        ) VALUES (?, 'TEST10', 'Test Coupon', 'Test 10% Off Coupon', 'Test coupon for debugging',
                  'percentage', 10.00, 0.00, 1, NOW(), 1, NOW())
      `, [result.insertId]);

      console.log('Created sample discount and coupon');
    }

    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

debugVendor();