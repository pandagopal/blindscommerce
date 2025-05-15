const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:Test@1234@localhost:5432/smartblindshub'
});

async function checkSchema() {
  try {
    // Check if the users table exists and get its structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'blinds'
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    if (tableInfo.rows.length === 0) {
      console.log('Users table not found in blinds schema');
    } else {
      console.log('Users table structure:');
      console.table(tableInfo.rows);
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema(); 