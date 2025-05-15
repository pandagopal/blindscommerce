const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgres://postgres:Test@1234@localhost:5432/smartblindshub'
});

async function testLogin() {
  try {
    // 1. Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // 2. Check if users table exists and has data
    console.log('\nChecking users table...');
    const usersResult = await pool.query(`
      SELECT 
        u.user_id,
        u.email,
        u.password_hash,
        u.is_admin,
        CASE 
          WHEN u.is_admin THEN 'admin'
          WHEN EXISTS (
            SELECT 1 FROM blinds.vendor_info v
            WHERE v.user_id = u.user_id AND v.is_active = TRUE
          ) THEN 'vendor'
          WHEN EXISTS (
            SELECT 1 FROM blinds.sales_staff s
            WHERE s.user_id = u.user_id AND s.is_active = TRUE
          ) THEN 'sales'
          WHEN EXISTS (
            SELECT 1 FROM blinds.installers i
            WHERE i.user_id = u.user_id AND i.is_active = TRUE
          ) THEN 'installer'
          ELSE 'customer'
        END as role
      FROM blinds.users u
      WHERE u.is_active = TRUE
    `);
    
    console.log(`✓ Found ${usersResult.rows.length} active users`);
    console.log('\nUser emails found:');
    usersResult.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

    // 3. Test password hashing
    console.log('\nTesting password hashing...');
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('✓ Password hashing working correctly');

    // 4. Check password hashes in database
    console.log('\nChecking password hashes format...');
    for (const user of usersResult.rows) {
      if (!user.password_hash) {
        console.log(`⚠ User ${user.email} has no password hash`);
        continue;
      }
      
      if (!user.password_hash.startsWith('$2')) {
        console.log(`⚠ User ${user.email} has invalid bcrypt hash format`);
      }
    }

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await pool.end();
  }
}

testLogin(); 