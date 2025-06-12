require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function insertCategories() {
  let connection;
  
  try {
    // Create connection using environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: false
    });

    console.log('Connected to database:', process.env.DB_NAME);

    console.log('Connected to database');

    // First, check if categories already exist
    const [existingCategories] = await connection.execute(
      'SELECT COUNT(*) as count FROM categories'
    );

    if (existingCategories[0].count > 0) {
      console.log(`Found ${existingCategories[0].count} existing categories`);
      const response = await new Promise((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question('Do you want to delete existing categories and insert new ones? (yes/no): ', (answer) => {
          readline.close();
          resolve(answer.toLowerCase());
        });
      });

      if (response !== 'yes') {
        console.log('Operation cancelled');
        return;
      }

      // Delete existing categories
      await connection.execute('DELETE FROM categories');
      console.log('Deleted existing categories');
    }

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'migrations', 'insert_categories.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the insert
    await connection.execute(sql);
    console.log('Categories inserted successfully!');

    // Verify insertion
    const [newCategories] = await connection.execute(
      'SELECT category_id, name, slug FROM categories ORDER BY display_order'
    );

    console.log('\nInserted categories:');
    newCategories.forEach(cat => {
      console.log(`- ${cat.category_id}: ${cat.name} (${cat.slug})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the script
insertCategories();