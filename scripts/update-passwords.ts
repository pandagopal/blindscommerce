const { createPool } = require('mariadb');
const bcrypt = require('bcrypt');

async function updatePasswords() {
  // Create a connection pool
  const pool = createPool({
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    database: 'smartblindshub',
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    // Get all users
    const conn = await pool.getConnection();
    const users = await conn.query('SELECT user_id, email FROM users');

    // Default password for all users during development
    const defaultPassword = 'password123';
    // Use specific bcrypt settings to ensure compatibility
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Update each user's password
    for (const user of users) {
      await conn.query(
        'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [hashedPassword, user.user_id]
      );
      console.log(`Updated password for user: ${user.email}`);
    }

    // Verify the hashes
    const verifyResult = await conn.query('SELECT email, password_hash FROM users');
    for (const user of verifyResult) {
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

    conn.release();
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords(); 