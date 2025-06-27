import mysql from 'mysql2/promise';

async function testFeaturedProducts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Test@1234',
    database: 'blindscommerce_test'
  });

  try {
    console.log('Testing featured products query...\n');

    // Direct database query
    const [directResults] = await connection.execute(
      'SELECT product_id, name, is_featured, is_active FROM products WHERE is_featured = 1 AND is_active = 1'
    );
    console.log('Direct database query results:', directResults);

    // Check the actual boolean values
    const [booleanCheck] = await connection.execute(
      'SELECT product_id, name, is_featured, is_active, is_featured = 1 as featured_check, is_active = 1 as active_check FROM products WHERE product_id IN (1, 2, 3)'
    );
    console.log('\nBoolean value check:', booleanCheck);

    // Test the exact query from ProductService
    const whereConditions = ['p.is_active = ?', 'p.is_featured = ?'];
    const whereParams = [true, true];
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT DISTINCT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        MIN(vp.vendor_price) as vendor_price,
        MIN(vd.discount_type) as discount_type,
        MIN(vd.discount_value) as discount_value,
        pi.image_url as primary_image_url,
        COALESCE(AVG(pr.rating), 0) as avg_rating,
        COUNT(DISTINCT pr.review_id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
      LEFT JOIN vendor_discounts vd ON vp.vendor_id = vd.vendor_id 
        AND vd.is_active = 1
        AND (vd.valid_from IS NULL OR vd.valid_from <= NOW())
        AND (vd.valid_until IS NULL OR vd.valid_until >= NOW())
      LEFT JOIN product_images pi ON p.product_id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
      ${whereClause}
      GROUP BY p.product_id, p.name, p.slug, p.sku, p.short_description, 
               p.full_description, p.base_price, p.cost_price, p.category_id, p.brand_id, 
               p.primary_image_url, p.is_active, p.is_featured, p.rating, p.review_count, 
               p.created_at, p.updated_at, c.name, c.slug, b.name, pi.image_url
      ORDER BY p.name ASC
      LIMIT 12 OFFSET 0
    `;

    console.log('\nTesting ProductService query with params:', whereParams);
    const [serviceResults] = await connection.execute(query, whereParams);
    console.log('ProductService query results:', serviceResults.length, 'products found');
    if (serviceResults.length > 0) {
      console.log('First product:', {
        id: serviceResults[0].product_id,
        name: serviceResults[0].name,
        is_featured: serviceResults[0].is_featured,
        is_active: serviceResults[0].is_active
      });
    }

    // Test with numeric values
    console.log('\nTesting with numeric values (1 instead of true)...');
    const [numericResults] = await connection.execute(query, [1, 1]);
    console.log('Numeric query results:', numericResults.length, 'products found');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testFeaturedProducts();