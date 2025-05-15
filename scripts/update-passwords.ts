const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function updatePasswords() {
  // Create a connection pool
  const pool = new Pool({
    user: 'postgres',
    password: 'Test@1234',
    host: 'localhost',
    database: 'smartblindshub',
    port: 5432
  });

  try {
    // Get all users
    const result = await pool.query('SELECT user_id, email FROM blinds.users');
    const users = result.rows;

    // Default password for all users during development
    const defaultPassword = 'password123';
    // Use specific bcrypt settings to ensure compatibility
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Update each user's password
    for (const user of users) {
      await pool.query(
        'UPDATE blinds.users SET password_hash = $1 WHERE user_id = $2',
        [hashedPassword, user.user_id]
      );
      console.log(`Updated password for user: ${user.email}`);
    }

    // Verify the hashes
    const verifyResult = await pool.query('SELECT email, password_hash FROM blinds.users');
    for (const user of verifyResult.rows) {
      const isValid = await bcrypt.compare(defaultPassword, user.password_hash);
      console.log(`Verification for ${user.email}: ${isValid}`);
    }

    console.log('\nAll passwords have been updated successfully');
    console.log('\nDefault credentials:');
    console.log('Admin: admin@smartblindshub.com / password123');
    console.log('Customer: customer@example.com / password123');
    console.log('Vendor: vendor@example.com / password123');
    console.log('Sales: sales@smartblindshub.com / password123');
    console.log('Installer: installer@smartblindshub.com / password123');

  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords(); 