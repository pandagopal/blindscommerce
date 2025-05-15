const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgres://postgres:Test@1234@localhost:5432/smartblindshub'
});

async function fixDatabase() {
  try {
    // 1. Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // 2. Create admin user with known password
    console.log('\nCreating/updating admin user...');
    const adminPassword = 'admin123'; // You can change this password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // First, try to update existing admin
    const updateResult = await pool.query(`
      UPDATE blinds.users 
      SET 
        password_hash = $1,
        is_admin = TRUE,
        is_active = TRUE
      WHERE email = 'admin@smartblindshub.com'
      RETURNING user_id
    `, [hashedPassword]);

    if (updateResult.rows.length === 0) {
      // If admin doesn't exist, create new admin
      await pool.query(`
        INSERT INTO blinds.users (
          email,
          password_hash,
          first_name,
          last_name,
          is_admin,
          is_active
        ) VALUES (
          'admin@smartblindshub.com',
          $1,
          'Admin',
          'User',
          TRUE,
          TRUE
        )
      `, [hashedPassword]);
      console.log('✓ Created new admin user');
    } else {
      console.log('✓ Updated existing admin user');
    }

    // 3. Verify admin user
    const adminUser = await pool.query(`
      SELECT 
        user_id,
        email,
        is_admin,
        is_active
      FROM blinds.users
      WHERE email = 'admin@smartblindshub.com'
    `);

    if (adminUser.rows.length > 0) {
      console.log('\nAdmin user details:');
      console.log('Email:', adminUser.rows[0].email);
      console.log('Is Admin:', adminUser.rows[0].is_admin);
      console.log('Is Active:', adminUser.rows[0].is_active);
      console.log('\nAdmin login credentials:');
      console.log('Email: admin@smartblindshub.com');
      console.log('Password:', adminPassword);
    }

  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await pool.end();
  }
}

fixDatabase(); 