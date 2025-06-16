#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

async function createConnection() {
  return await mysql.createConnection({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 3306,
    user: process.env.TEST_DB_USER || 'root',
    password: process.env.TEST_DB_PASSWORD || '',
    database: process.env.TEST_DB_NAME || 'blindscommerce_test',
    multipleStatements: true
  });
}

async function setupTestUsers(connection) {
  console.log('Setting up test users...');
  
  const hashedPassword = await bcrypt.hash('Admin@1234', 10);
  
  const users = [
    {
      email: 'admin@smartblindshub.com',
      password: hashedPassword,
      role: 'admin',
      name: 'Test Admin User',
      phone: '555-000-0001'
    },
    {
      email: 'vendor@smartblindshub.com',
      password: hashedPassword,
      role: 'vendor',
      name: 'Test Vendor User',
      phone: '555-000-0002'
    },
    {
      email: 'customer@smartblindshub.com',
      password: hashedPassword,
      role: 'customer',
      name: 'Test Customer User',
      phone: '555-000-0003'
    },
    {
      email: 'sales@smartblindshub.com',
      password: hashedPassword,
      role: 'sales',
      name: 'Test Sales Representative',
      phone: '555-000-0004'
    },
    {
      email: 'installer@smartblindshub.com',
      password: hashedPassword,
      role: 'installer',
      name: 'Test Installer User',
      phone: '555-000-0005'
    },
    {
      email: 'vendor2@smartblindshub.com',
      password: hashedPassword,
      role: 'vendor',
      name: 'Second Test Vendor',
      phone: '555-000-0006'
    }
  ];

  for (const user of users) {
    try {
      await connection.execute(
        `INSERT INTO users (email, password, role, name, phone, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
         password = VALUES(password), 
         name = VALUES(name), 
         phone = VALUES(phone),
         updated_at = NOW()`,
        [user.email, user.password, user.role, user.name, user.phone]
      );
      console.log(`✓ Created/Updated user: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`✗ Failed to create user ${user.email}:`, error.message);
    }
  }
}

async function setupTestProducts(connection) {
  console.log('Setting up test products...');

  // First, get vendor IDs
  const [vendors] = await connection.execute(
    "SELECT user_id, email FROM users WHERE role = 'vendor'"
  );

  if (vendors.length === 0) {
    console.error('No vendors found. Please run setupTestUsers first.');
    return;
  }

  const vendorId = vendors[0].user_id;
  const vendor2Id = vendors.length > 1 ? vendors[1].user_id : vendorId;

  const products = [
    {
      name: 'Premium Roller Shade',
      slug: 'premium-roller-shade',
      short_description: 'High-quality roller shade for modern homes',
      full_description: 'Premium roller shade with advanced light filtering technology and smooth operation mechanism',
      sku: 'PRS-001',
      base_price: 199.99,
      category: 'Roller Shades',
      min_width: 12,
      max_width: 120,
      min_height: 12,
      max_height: 144,
      vendor_id: vendorId
    },
    {
      name: 'Cellular Shade Deluxe',
      slug: 'cellular-shade',
      short_description: 'Energy-efficient cellular shades',
      full_description: 'Honeycomb cellular shades providing excellent insulation and light control',
      sku: 'CSD-001',
      base_price: 249.99,
      category: 'Cellular Shades',
      min_width: 10,
      max_width: 96,
      min_height: 10,
      max_height: 120,
      vendor_id: vendorId
    },
    {
      name: 'Motorized Smart Blind',
      slug: 'motorized-smart-blind',
      short_description: 'Smart home compatible motorized blinds',
      full_description: 'Wi-Fi enabled motorized blinds with smartphone app control and voice assistant compatibility',
      sku: 'MSB-001',
      base_price: 399.99,
      category: 'Smart Blinds',
      min_width: 18,
      max_width: 84,
      min_height: 24,
      max_height: 108,
      vendor_id: vendor2Id
    },
    {
      name: 'Vendor A Roller Shade',
      slug: 'vendor-a-roller-shade',
      short_description: 'Vendor A specialty roller shade',
      full_description: 'Custom roller shade from Vendor A with unique design patterns',
      sku: 'VAS-001',
      base_price: 179.99,
      category: 'Roller Shades',
      min_width: 12,
      max_width: 96,
      min_height: 12,
      max_height: 120,
      vendor_id: vendorId
    },
    {
      name: 'Vendor B Cellular Shade',
      slug: 'vendor-b-cellular-shade',
      short_description: 'Vendor B energy-efficient shade',
      full_description: 'Premium cellular shade from Vendor B with superior insulation properties',
      sku: 'VBS-001',
      base_price: 229.99,
      category: 'Cellular Shades',
      min_width: 10,
      max_width: 108,
      min_height: 10,
      max_height: 132,
      vendor_id: vendor2Id
    }
  ];

  for (const product of products) {
    try {
      const [result] = await connection.execute(
        `INSERT INTO products (
          name, slug, short_description, full_description, sku, base_price, 
          category, min_width, max_width, min_height, max_height, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        short_description = VALUES(short_description),
        full_description = VALUES(full_description),
        base_price = VALUES(base_price),
        updated_at = NOW()`,
        [
          product.name, product.slug, product.short_description, 
          product.full_description, product.sku, product.base_price,
          product.category, product.min_width, product.max_width,
          product.min_height, product.max_height
        ]
      );

      const productId = result.insertId;

      // Create vendor-product relationship
      await connection.execute(
        `INSERT INTO vendor_products (vendor_id, product_id, vendor_sku, vendor_price, created_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE vendor_price = VALUES(vendor_price)`,
        [product.vendor_id, productId, product.sku, product.base_price]
      );

      console.log(`✓ Created/Updated product: ${product.name}`);
    } catch (error) {
      console.error(`✗ Failed to create product ${product.name}:`, error.message);
    }
  }
}

async function setupTestCategories(connection) {
  console.log('Setting up test categories...');

  const categories = [
    { name: 'Roller Shades', slug: 'roller-shades', description: 'Modern roller shades for any room' },
    { name: 'Cellular Shades', slug: 'cellular-shades', description: 'Energy-efficient honeycomb shades' },
    { name: 'Smart Blinds', slug: 'smart-blinds', description: 'Motorized and smart home compatible blinds' },
    { name: 'Venetian Blinds', slug: 'venetian-blinds', description: 'Classic horizontal slat blinds' },
    { name: 'Vertical Blinds', slug: 'vertical-blinds', description: 'Vertical slat blinds for large windows' }
  ];

  for (const category of categories) {
    try {
      await connection.execute(
        `INSERT INTO categories (name, slug, description, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
         description = VALUES(description),
         updated_at = NOW()`,
        [category.name, category.slug, category.description]
      );
      console.log(`✓ Created/Updated category: ${category.name}`);
    } catch (error) {
      console.error(`✗ Failed to create category ${category.name}:`, error.message);
    }
  }
}

async function setupTestConfiguration(connection) {
  console.log('Setting up test configuration options...');

  // Colors
  const colors = [
    { name: 'Classic White', code: '#FFFFFF', category: 'whites' },
    { name: 'Ivory', code: '#FFFFF0', category: 'whites' },
    { name: 'Beige', code: '#F5F5DC', category: 'neutrals' },
    { name: 'Light Gray', code: '#D3D3D3', category: 'grays' },
    { name: 'Charcoal', code: '#36454F', category: 'grays' },
    { name: 'Navy Blue', code: '#000080', category: 'blues' }
  ];

  for (const color of colors) {
    try {
      await connection.execute(
        `INSERT INTO colors (name, color_code, category, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
         color_code = VALUES(color_code),
         category = VALUES(category)`,
        [color.name, color.code, color.category]
      );
      console.log(`✓ Created/Updated color: ${color.name}`);
    } catch (error) {
      console.error(`✗ Failed to create color ${color.name}:`, error.message);
    }
  }

  // Materials
  const materials = [
    { name: 'Light Filtering', description: 'Softly filters light while maintaining privacy', opacity: 'semi-translucent' },
    { name: 'Blackout', description: 'Blocks out light completely for total darkness', opacity: 'opaque' },
    { name: 'Sheer', description: 'Lightweight fabric that gently diffuses light', opacity: 'translucent' },
    { name: 'Room Darkening', description: 'Reduces light significantly without complete blackout', opacity: 'semi-opaque' }
  ];

  for (const material of materials) {
    try {
      await connection.execute(
        `INSERT INTO materials (name, description, opacity_level, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
         description = VALUES(description),
         opacity_level = VALUES(opacity_level)`,
        [material.name, material.description, material.opacity]
      );
      console.log(`✓ Created/Updated material: ${material.name}`);
    } catch (error) {
      console.error(`✗ Failed to create material ${material.name}:`, error.message);
    }
  }
}

async function setupTestOrders(connection) {
  console.log('Setting up test orders...');

  // Get customer and product IDs
  const [customers] = await connection.execute(
    "SELECT user_id FROM users WHERE role = 'customer' LIMIT 1"
  );

  const [products] = await connection.execute(
    "SELECT product_id, base_price FROM products LIMIT 3"
  );

  if (customers.length === 0 || products.length === 0) {
    console.log('No customers or products found for test orders');
    return;
  }

  const customerId = customers[0].user_id;

  const orders = [
    {
      user_id: customerId,
      subtotal: 399.98,
      tax_amount: 32.00,
      shipping_cost: 15.00,
      total_amount: 446.98,
      status: 'pending',
      payment_status: 'paid'
    },
    {
      user_id: customerId,
      subtotal: 249.99,
      tax_amount: 20.00,
      shipping_cost: 15.00,
      total_amount: 284.99,
      status: 'processing',
      payment_status: 'paid'
    }
  ];

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    try {
      const orderNumber = `ORD-${Date.now()}-${i}`;
      
      const [result] = await connection.execute(
        `INSERT INTO orders (
          order_number, user_id, subtotal, tax_amount, shipping_cost, 
          total_amount, status, payment_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderNumber, order.user_id, order.subtotal, order.tax_amount,
          order.shipping_cost, order.total_amount, order.status, order.payment_status
        ]
      );

      const orderId = result.insertId;

      // Add order items
      for (let j = 0; j < Math.min(products.length, 2); j++) {
        const product = products[j];
        const configuration = {
          width: 48.5,
          height: 72.0,
          color_id: 1,
          material_id: 1,
          control_type: 'cordless'
        };

        await connection.execute(
          `INSERT INTO order_items (
            order_id, product_id, quantity, price, options, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
          [orderId, product.product_id, 1, product.base_price, JSON.stringify(configuration)]
        );
      }

      console.log(`✓ Created test order: ${orderNumber}`);
    } catch (error) {
      console.error(`✗ Failed to create test order:`, error.message);
    }
  }
}

async function setupTestFiles() {
  console.log('Setting up test files...');

  const testFilesDir = path.join(__dirname, '..', 'test-files');
  
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }

  // Create sample CSV for bulk upload tests
  const csvContent = `name,sku,price,category,description
"Test Bulk Shade 1","TBS-001",199.99,"Roller Shades","Bulk uploaded roller shade"
"Test Bulk Shade 2","TBS-002",249.99,"Cellular Shades","Bulk uploaded cellular shade"
"Test Bulk Shade 3","TBS-003",299.99,"Smart Blinds","Bulk uploaded smart blind"`;

  fs.writeFileSync(path.join(testFilesDir, 'bulk-products.csv'), csvContent);

  // Create placeholder image files
  const placeholderImageContent = 'placeholder-image-content';
  
  const imageFiles = [
    'before1.jpg', 'before2.jpg', 'after1.jpg', 'after2.jpg',
    'damage.jpg', 'product-image.jpg'
  ];

  imageFiles.forEach(filename => {
    fs.writeFileSync(path.join(testFilesDir, filename), placeholderImageContent);
  });

  console.log(`✓ Created test files in ${testFilesDir}`);
}

async function cleanupTestData(connection) {
  console.log('Cleaning up existing test data...');

  try {
    // Delete in order of dependencies
    await connection.execute("DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE order_number LIKE 'ORD-%')");
    await connection.execute("DELETE FROM orders WHERE order_number LIKE 'ORD-%'");
    await connection.execute("DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%smartblindshub.com'))");
    await connection.execute("DELETE FROM carts WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%smartblindshub.com')");
    await connection.execute("DELETE FROM vendor_products WHERE vendor_id IN (SELECT user_id FROM users WHERE email LIKE '%smartblindshub.com')");
    await connection.execute("DELETE FROM products WHERE sku LIKE 'PRS-%' OR sku LIKE 'CSD-%' OR sku LIKE 'MSB-%' OR sku LIKE 'VAS-%' OR sku LIKE 'VBS-%' OR sku LIKE 'TBS-%'");
    await connection.execute("DELETE FROM users WHERE email LIKE '%smartblindshub.com'");
    
    console.log('✓ Cleaned up existing test data');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

async function main() {
  let connection;
  
  try {
    console.log('🚀 Starting test data setup...\n');
    
    connection = await createConnection();
    console.log('✓ Connected to database\n');

    // Clean up existing test data
    if (process.argv.includes('--cleanup')) {
      await cleanupTestData(connection);
      console.log('\n');
    }

    // Set up test data
    await setupTestCategories(connection);
    console.log('');
    
    await setupTestUsers(connection);
    console.log('');
    
    await setupTestProducts(connection);
    console.log('');
    
    await setupTestConfiguration(connection);
    console.log('');
    
    await setupTestOrders(connection);
    console.log('');
    
    await setupTestFiles();
    console.log('');
    
    console.log('🎉 Test data setup completed successfully!');
    console.log('\nTest users created:');
    console.log('  - admin@smartblindshub.com (Admin)');
    console.log('  - vendor@smartblindshub.com (Vendor)');
    console.log('  - customer@smartblindshub.com (Customer)');
    console.log('  - sales@smartblindshub.com (Sales)');
    console.log('  - installer@smartblindshub.com (Installer)');
    console.log('\nAll passwords: Admin@1234');
    console.log('\nYou can now run the test suite:');
    console.log('  npm test');

  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { main, setupTestUsers, setupTestProducts, setupTestCategories };