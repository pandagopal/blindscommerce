const { createPool } = require('mariadb');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  // Create a connection pool
  const pool = createPool({
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'smartblindshub',
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    // Admin user details
    const adminUser = {
      email: 'admin@smartblindshub.com',
      password: 'Admin@123', // This is a temporary password that should be changed after first login
      firstName: 'Admin',
      lastName: 'User',
      phone: null,
      isAdmin: true,
      isActive: true,
      isVerified: true
    };

    const conn = await pool.getConnection();

    try {
      // Check if admin user already exists
      const existingUser = await conn.query(
        'SELECT user_id FROM users WHERE email = ?',
        [adminUser.email]
      );

      if (existingUser.length > 0) {
        console.log('Admin user already exists');
        return;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);

      // Insert admin user
      await conn.query(
        `INSERT INTO users (
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          is_admin,
          is_active,
          is_verified,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          adminUser.email,
          hashedPassword,
          adminUser.firstName,
          adminUser.lastName,
          adminUser.phone,
          adminUser.isAdmin,
          adminUser.isActive,
          adminUser.isVerified
        ]
      );

      console.log('Admin user created successfully');
      console.log('Email:', adminUser.email);
      console.log('Password:', adminUser.password);
      console.log('Please change the password after first login');

    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
createAdminUser(); 