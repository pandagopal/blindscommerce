/**
 * Update database schema to support new roles
 * Adds super_admin and trade_professional to the users table role enum
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateRoleSchema() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to database successfully');

    // First, check current enum values
    const [currentSchema] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME]);

    console.log('Current role enum:', currentSchema[0]?.COLUMN_TYPE);

    // Update the role enum to include new roles
    console.log('Updating users table role enum...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM(
        'customer',
        'admin',
        'vendor',
        'installer', 
        'sales',
        'super_admin',
        'trade_professional'
      ) DEFAULT 'customer'
    `);

    console.log('✅ Successfully updated users table role enum');

    // Verify the update
    const [updatedSchema] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME]);

    console.log('Updated role enum:', updatedSchema[0]?.COLUMN_TYPE);

    // Create a super admin user if it doesn't exist
    const [existingSuperAdmin] = await connection.execute(
      'SELECT user_id FROM users WHERE role = ?',
      ['super_admin']
    );

    if (existingSuperAdmin.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
      
      await connection.execute(`
        INSERT INTO users (
          email, 
          password_hash, 
          first_name, 
          last_name, 
          role, 
          is_active, 
          is_verified,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'superadmin@blindscommerce.com',
        hashedPassword,
        'Super',
        'Admin',
        'super_admin',
        1,
        1
      ]);

      console.log('✅ Created default super admin user:');
      console.log('   Email: superadmin@blindscommerce.com');
      console.log('   Password: SuperAdmin123!');
    } else {
      console.log('ℹ️  Super admin user already exists');
    }

    // Update any existing admin users that should be super_admin
    // This is commented out to avoid accidentally changing existing data
    // await connection.execute(`
    //   UPDATE users 
    //   SET role = 'super_admin' 
    //   WHERE email = 'admin@blindscommerce.com' OR email = 'owner@blindscommerce.com'
    // `);

    console.log('🎉 Database schema update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  updateRoleSchema()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { updateRoleSchema };