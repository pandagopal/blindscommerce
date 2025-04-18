import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';

// This script will run the schema SQL file to set up the database

async function setupDatabase() {
  try {
    console.log('Setting up the database...');

    // Read the schema SQL file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      console.error(`Schema file not found at ${schemaPath}`);
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the SQL
    console.log('Executing schema SQL...');
    await pool.query(schemaSql);

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the setup script
setupDatabase().catch(console.error);
