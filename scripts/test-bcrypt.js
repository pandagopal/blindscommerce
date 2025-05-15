const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function testBcrypt() {
  // Test bcrypt functionality
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
  
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Password matches hash:', isMatch);

  // Test database connection and update
  const pool = new Pool({
    user: 'postgres',
    password: 'Test@1234',
    host: 'localhost',
    database: 'smartblindshub',
    port: 5432
  });

  try {
    // First, check current users
    const currentUsers = await pool.query('SELECT user_id, email, password_hash FROM blinds.users');
    console.log('\nCurrent users:', currentUsers.rows);

    // Update admin user with new hash
    const updateResult = await pool.query(
      'UPDATE blinds.users SET password_hash = $1 WHERE email = $2 RETURNING user_id, email',
      [hash, 'admin@smartblindshub.com']
    );
    console.log('\nUpdated user:', updateResult.rows[0]);

    // Verify the update
    const verifyResult = await pool.query(
      'SELECT user_id, email, password_hash FROM blinds.users WHERE email = $1',
      ['admin@smartblindshub.com']
    );
    console.log('\nVerified user data:', verifyResult.rows[0]);

    // Test password verification
    const storedHash = verifyResult.rows[0].password_hash;
    const verifyPassword = await bcrypt.compare(password, storedHash);
    console.log('\nVerification test with stored hash:', verifyPassword);

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

testBcrypt().catch(console.error); 