const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

const pool = new Pool({
  connectionString: 'postgres://postgres:Test@1234@localhost:5432/smartblindshub'
});

async function testAuth() {
  try {
    // 1. Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // 2. Apply schema
    console.log('\nApplying schema...');
    const schema = await fs.readFile('database/schema-update.sql', 'utf8');
    await pool.query(schema);
    console.log('✓ Schema applied successfully');

    // 3. Create admin user with known password
    console.log('\nCreating admin user...');
    const adminEmail = 'admin@smartblindshub.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Delete existing admin user if exists
    await pool.query('DELETE FROM blinds.users WHERE email = $1', [adminEmail]);

    // Create new admin user
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
        $1,
        $2,
        'Admin',
        'User',
        TRUE,
        TRUE,
        TRUE
      )
    `, [adminEmail, hashedPassword]);
    console.log('✓ Admin user created');

    // 4. Test login with created credentials
    console.log('\nTesting login...');
    const loginResult = await pool.query(`
      SELECT 
        user_id,
        email,
        password_hash,
        is_admin,
        is_active
      FROM blinds.users
      WHERE email = $1 AND is_active = TRUE
    `, [adminEmail]);

    if (loginResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = loginResult.rows[0];
    const isValidPassword = await bcrypt.compare(adminPassword, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Password verification failed');
    }

    console.log('✓ Login test successful');
    console.log('\nAdmin credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

    // 5. Verify user details
    console.log('\nUser details in database:');
    console.log('User ID:', user.user_id);
    console.log('Is Admin:', user.is_admin);
    console.log('Is Active:', user.is_active);
    console.log('Password Hash:', user.password_hash);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testAuth(); 