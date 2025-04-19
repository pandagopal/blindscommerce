import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Create a connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
});

async function setupDatabase() {
  console.log('🔄 Starting database setup...');

  try {
    // Check if Docker is running
    console.log('📦 Checking Docker status...');
    try {
      await execPromise('docker info');
      console.log('✅ Docker is running.');
    } catch (error) {
      console.error('❌ Docker is not running. Please start Docker and try again.');
      process.exit(1);
    }

    // Check if container is running
    console.log('🔍 Checking if PostgreSQL container is running...');
    try {
      const { stdout } = await execPromise('docker ps --filter "name=blindscommerce-postgres" --format "{{.Names}}"');
      if (!stdout.trim()) {
        console.log('🚀 Starting PostgreSQL container...');
        await execPromise('docker-compose up -d');
        console.log('⏳ Waiting for PostgreSQL to be ready...');
        // Wait for PostgreSQL to be fully initialized (up to 30 seconds)
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        console.log('✅ PostgreSQL container is already running.');
      }
    } catch (error) {
      console.error('❌ Error checking container:', error);
      console.log('🚀 Attempting to start the container...');
      try {
        await execPromise('docker-compose up -d');
        // Wait for PostgreSQL to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (startError) {
        console.error('❌ Failed to start container:', startError);
        process.exit(1);
      }
    }

    // Read the schema SQL file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found at ${schemaPath}`);
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Successfully connected to PostgreSQL');

    // Check if smartblindshub database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = 'smartblindshub'`;
    const dbResult = await pool.query(checkDbQuery);

    if (dbResult.rows.length === 0) {
      console.log('🏗️ Creating smartblindshub database...');

      try {
        // Create the database
        await pool.query('CREATE DATABASE smartblindshub');
        console.log('✅ Database created successfully');

        // Use Docker exec to run psql and execute the schema
        console.log('📄 Executing schema.sql...');
        await execPromise(`docker exec blindscommerce-postgres psql -U postgres -d smartblindshub -f /docker-entrypoint-initdb.d/schema.sql`);
        console.log('✅ Schema applied successfully');
      } catch (error: unknown) {
        // Check if the error is because the database already exists
        if (typeof error === 'object' && error !== null && 'message' in error &&
            typeof (error as { message: unknown }).message === 'string' &&
            (error as { message: string }).message.includes('already exists')) {
          console.log('ℹ️ Database already exists');
        } else {
          console.error('❌ Error setting up database:', error);
          throw error;
        }
      }
    } else {
      console.log('ℹ️ Database already exists');

      // Check if the blinds schema exists in the smartblindshub database
      try {
        const newPool = new Pool({
          user: 'postgres',
          host: 'localhost',
          database: 'smartblindshub',
          password: 'postgres',
          port: 5432,
        });

        const checkSchemaQuery = `SELECT 1 FROM information_schema.schemata WHERE schema_name = 'blinds'`;
        const schemaResult = await newPool.query(checkSchemaQuery);

        if (schemaResult.rows.length === 0) {
          console.log('📄 Executing schema.sql to create schema...');
          await execPromise(`docker exec blindscommerce-postgres psql -U postgres -d smartblindshub -f /docker-entrypoint-initdb.d/schema.sql`);
          console.log('✅ Schema applied successfully');
        } else {
          console.log('✅ Database and schema are already set up');
        }

        await newPool.end();
      } catch (error) {
        console.error('❌ Error checking schema:', error);
      }
    }

    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await pool.end();
  }
}

// Run the setup script
setupDatabase().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
