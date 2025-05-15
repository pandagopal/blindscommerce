const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgres://postgres:Test@1234@localhost:5432/smartblindshub'
});

async function updatePasswords() {
  try {
    // Get all users
    const users = await pool.query('SELECT user_id, email FROM blinds.users');
    
    // Default password for testing: 'password123'
    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    
    // Update each user's password
    for (const user of users.rows) {
      await pool.query(
        'UPDATE blinds.users SET password_hash = $1 WHERE user_id = $2',
        [hashedPassword, user.user_id]
      );
      console.log(`Updated password for user: ${user.email}`);
    }
    
    console.log('\nAll passwords have been updated to: password123');
    console.log('You can now log in with any user account using this password.');
    
  } catch (err) {
    console.error('Error updating passwords:', err);
  } finally {
    await pool.end();
  }
}

updatePasswords(); 