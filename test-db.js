const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:Test@1234@localhost:5432/smartblindshub'
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Try to query the users table
    const result = await client.query('SELECT COUNT(*) FROM blinds.users');
    console.log('Number of users:', result.rows[0].count);
    
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

testConnection(); 