import { Pool } from 'pg';

// Define types for query parameters
interface ProductQueryParams {
  limit?: number;
  offset?: number;
  categoryId?: number | null;
  search?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: string;
  sortOrder?: string;
}

// Create a pool of connections to the PostgreSQL database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'smartblindshub',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Set the search path to the 'blinds' schema
pool.on('connect', (client) => {
  client.query('SET search_path TO blinds, public');
});

// Log database connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Remove process.exit(-1) for Edge compatibility
});

// Helper function for password hashing - using Web Crypto API
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

  return hashHex;
};

// Query functions

// Products
export const getProducts = async ({
  limit = 10,
  offset = 0,
  categoryId = null,
  search = null,
  minPrice = null,
  maxPrice = null,
  sortBy = 'name',
  sortOrder = 'asc'
}: ProductQueryParams = {}) => {
  let query = `
    SELECT
      p.product_id,
      p.name,
      p.slug,
      p.short_description,
      p.base_price,
      p.rating,
      p.review_count,
      c.name as category_name,
      c.slug as category_slug,
      (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.product_id AND is_primary = TRUE
        LIMIT 1
      ) as primary_image
    FROM
      products p
    JOIN
      categories c ON p.category_id = c.category_id
    WHERE
      p.is_active = TRUE
  `;

  const queryParams = [];
  let paramCount = 1;

  if (categoryId) {
    query += ` AND p.category_id = $${paramCount}`;
    queryParams.push(categoryId);
    paramCount++;
  }

  if (search) {
    query += ` AND (p.name ILIKE $${paramCount} OR p.short_description ILIKE $${paramCount})`;
    queryParams.push(`%${search}%`);
    paramCount++;
  }

  if (minPrice !== null) {
    query += ` AND p.base_price >= $${paramCount}`;
    queryParams.push(minPrice);
    paramCount++;
  }

  if (maxPrice !== null) {
    query += ` AND p.base_price <= $${paramCount}`;
    queryParams.push(maxPrice);
    paramCount++;
  }

  // Add sorting
  const validSortFields = ['name', 'base_price', 'rating', 'review_count'];
  const validSortOrders = ['asc', 'desc'];

  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
  const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'asc';

  query += ` ORDER BY p.${finalSortBy} ${finalSortOrder}`;

  // Add pagination
  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  queryParams.push(limit, offset);

  try {
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Database error fetching products:', error);
    throw error;
  }
};

// Get a single product by ID
export const getProductById = async (productId: number) => {
  try {
    const productQuery = `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM
        products p
      JOIN
        categories c ON p.category_id = c.category_id
      WHERE
        p.product_id = $1 AND p.is_active = TRUE
    `;

    const productResult = await pool.query(productQuery, [productId]);

    if (productResult.rows.length === 0) {
      return null;
    }

    const product = productResult.rows[0];

    // Get product images
    const imagesQuery = `
      SELECT * FROM product_images
      WHERE product_id = $1
      ORDER BY is_primary DESC, display_order ASC
    `;
    const imagesResult = await pool.query(imagesQuery, [productId]);
    product.images = imagesResult.rows;

    // Get product features
    const featuresQuery = `
      SELECT f.name, f.description, pf.value
      FROM product_features pf
      JOIN features f ON pf.feature_id = f.feature_id
      WHERE pf.product_id = $1
    `;
    const featuresResult = await pool.query(featuresQuery, [productId]);
    product.features = featuresResult.rows;

    // Get product materials
    const materialsQuery = `
      SELECT m.*, pm.price_modifier, pm.is_default
      FROM product_materials pm
      JOIN materials m ON pm.material_id = m.material_id
      WHERE pm.product_id = $1 AND m.is_active = TRUE
    `;
    const materialsResult = await pool.query(materialsQuery, [productId]);
    product.materials = materialsResult.rows;

    // Get product colors
    const colorsQuery = `
      SELECT c.*, pc.price_modifier, pc.image_url as swatch_image, pc.is_default
      FROM product_colors pc
      JOIN colors c ON pc.color_id = c.color_id
      WHERE pc.product_id = $1 AND c.is_active = TRUE
    `;
    const colorsResult = await pool.query(colorsQuery, [productId]);
    product.colors = colorsResult.rows;

    return product;
  } catch (error) {
    console.error('Database error fetching product by ID:', error);
    throw error;
  }
};

// Get a single product by slug
export const getProductBySlug = async (slug: string) => {
  try {
    const productQuery = `
      SELECT
        p.product_id
      FROM
        products p
      WHERE
        p.slug = $1 AND p.is_active = TRUE
    `;

    const productResult = await pool.query(productQuery, [slug]);

    if (productResult.rows.length === 0) {
      return null;
    }

    return getProductById(productResult.rows[0].product_id);
  } catch (error) {
    console.error('Database error fetching product by slug:', error);
    throw error;
  }
};

// Categories
export const getCategories = async () => {
  try {
    const query = `
      SELECT
        category_id as id,
        name,
        slug,
        description,
        image_url as image,
        is_active
      FROM
        categories
      WHERE
        is_active = TRUE
      ORDER BY
        display_order ASC, name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database error fetching categories:', error);
    throw error;
  }
};

// Get a single category by slug
export const getCategoryBySlug = async (slug: string) => {
  try {
    const query = `
      SELECT
        category_id as id,
        name,
        slug,
        description,
        image_url as image,
        is_active
      FROM
        categories
      WHERE
        slug = $1 AND is_active = TRUE
    `;

    const result = await pool.query(query, [slug]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error fetching category by slug:', error);
    throw error;
  }
};

// User functions

// Get user by ID
export const getUserById = async (userId: number) => {
  try {
    const query = `
      SELECT
        user_id,
        email,
        first_name,
        last_name,
        phone,
        is_admin,
        is_active
      FROM
        users
      WHERE
        user_id = $1 AND is_active = TRUE
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error fetching user by ID:', error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email: string) => {
  try {
    const query = `
      SELECT
        user_id,
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        is_admin,
        is_active
      FROM
        users
      WHERE
        email = $1 AND is_active = TRUE
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error fetching user by email:', error);
    throw error;
  }
};

// Get user role (admin, vendor, customer, etc.)
export const getUserRole = async (userId: number) => {
  try {
    // First check if the user is an admin
    const userQuery = `
      SELECT is_admin FROM users WHERE user_id = $1 AND is_active = TRUE
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (!userResult.rows.length) {
      return null;
    }

    if (userResult.rows[0].is_admin) {
      return 'admin';
    }

    // Check if user is a vendor
    const vendorQuery = `
      SELECT * FROM vendor_info WHERE user_id = $1 AND is_active = TRUE
    `;
    const vendorResult = await pool.query(vendorQuery, [userId]);

    if (vendorResult.rows.length > 0) {
      return 'vendor';
    }

    // Default role is customer
    return 'customer';
  } catch (error) {
    console.error('Database error getting user role:', error);
    throw error;
  }
};

// Get user orders
export const getUserOrders = async (userId: number) => {
  try {
    const query = `
      SELECT
        o.order_id,
        o.order_number,
        o.created_at,
        o.total_amount,
        s.name as status,
        COUNT(oi.order_item_id) as item_count
      FROM
        orders o
      JOIN
        order_status s ON o.status_id = s.status_id
      LEFT JOIN
        order_items oi ON o.order_id = oi.order_id
      WHERE
        o.user_id = $1
      GROUP BY
        o.order_id, o.order_number, o.created_at, o.total_amount, s.name
      ORDER BY
        o.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Database error fetching user orders:', error);
    throw error;
  }
};

// Get order details
export const getOrderById = async (orderId: number, userId: number | null = null) => {
  try {
    // Base query to get order details
    let query = `
      SELECT
        o.*,
        s.name as status_name,
        json_agg(
          json_build_object(
            'order_item_id', oi.order_item_id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'width', oi.width,
            'height', oi.height,
            'color_name', oi.color_name,
            'material_name', oi.material_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM
        orders o
      JOIN
        order_status s ON o.status_id = s.status_id
      LEFT JOIN
        order_items oi ON o.order_id = oi.order_id
      WHERE
        o.order_id = $1
    `;

    // If userId is provided, restrict to orders for that user
    const params = [orderId];
    if (userId !== null) {
      query += ` AND o.user_id = $2`;
      params.push(userId);
    }

    query += `
      GROUP BY
        o.order_id, s.name
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Database error fetching order details:', error);
    throw error;
  }
};

// Get vendor products
export const getVendorProducts = async (vendorId: number) => {
  try {
    const query = `
      SELECT
        product_id,
        name,
        slug,
        type_id,
        is_active,
        is_listing_enabled,
        base_price,
        created_at,
        updated_at
      FROM
        vendor_products
      WHERE
        vendor_id = $1
      ORDER BY
        created_at DESC
    `;

    const result = await pool.query(query, [vendorId]);
    return result.rows;
  } catch (error) {
    console.error('Database error fetching vendor products:', error);
    throw error;
  }
};

// Export the pool for direct use in API routes
export default pool;
