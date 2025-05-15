const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgres://postgres:Test@1234@localhost:5432/smartblindshub'
});

async function verifySetup() {
  try {
    // 1. Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // 2. Verify users table structure
    console.log('\nVerifying users table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'blinds'
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table columns:');
    console.table(tableInfo.rows);

    // 3. Create admin user if it doesn't exist
    console.log('\nChecking/Creating admin user...');
    const adminEmail = 'admin@smartblindshub.com';
    const adminPassword = 'admin123';
    
    // Check if admin exists
    const adminCheck = await pool.query(
      'SELECT user_id, email FROM blinds.users WHERE email = $1',
      [adminEmail]
    );

    if (adminCheck.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await pool.query(`
        INSERT INTO blinds.users (
          email,
          password_hash,
          first_name,
          last_name,
          is_admin,
          is_active,
          is_verified
        ) VALUES (
          $1, $2, 'Admin', 'User', TRUE, TRUE, TRUE
        )
      `, [adminEmail, hashedPassword]);
      console.log('✓ Admin user created');
    } else {
      console.log('✓ Admin user already exists');
    }

    // 4. Test admin login
    console.log('\nTesting admin login...');
    const loginResult = await pool.query(`
      SELECT 
        user_id,
        email,
        password_hash,
        is_admin,
        is_active,
        is_verified
      FROM blinds.users
      WHERE email = $1 AND is_active = TRUE
    `, [adminEmail]);

    if (loginResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }

    const user = loginResult.rows[0];
    console.log('Admin user details:');
    console.log('- User ID:', user.user_id);
    console.log('- Email:', user.email);
    console.log('- Is Admin:', user.is_admin);
    console.log('- Is Active:', user.is_active);
    console.log('- Is Verified:', user.is_verified);

    console.log('\nLogin credentials for testing:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await pool.end();
  }
}

verifySetup(); 