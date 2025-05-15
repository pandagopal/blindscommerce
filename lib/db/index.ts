import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';

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

// Use a singleton pattern for the database connection
let pool: Pool | null = null;
let isConnecting = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 2000; // 2 seconds
let dbConnectionFailed = false; // Add a flag to track if the DB connection failed

// Function to get the database connection pool
export const getPool = async (): Promise<Pool> => {
  if (pool) return pool;

  if (isConnecting) {
    // If already attempting to connect, wait for current attempt
    await new Promise(resolve => setTimeout(resolve, 100));
    return getPool();
  }

  // In development, limit connection attempts more aggressively
  const maxRetries = process.env.NODE_ENV === 'production' ? MAX_RETRIES : 1;

  if (dbConnectionFailed && connectionRetries >= maxRetries) {
    // If we've already tried and failed all retries, return a minimal pool
    // that will trigger the fallback data in query functions
    console.warn('Using minimal pool - previous connection attempts failed');
    const minimalPool = new Pool();
    // Override the query method to always throw an error
    // This ensures consistent behavior for fallback data
    minimalPool.query = async () => {
      throw new Error('Database connection is not available');
    };
    return minimalPool;
  }

  isConnecting = true;

  try {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'smartblindshub',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      // Add connection timeout to avoid hanging on connection issues
      connectionTimeoutMillis: 5000,
      // Limit concurrent connections
      max: 20,
      // How long a client can remain idle before being closed
      idleTimeoutMillis: 30000
    });

    // Set the search path
    pool.on('connect', (client: PoolClient) => {
      client.query('SET search_path TO blinds, public')
        .catch(err => console.error('Error setting search path:', err));
    });

    // Log database connection errors
    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
      // Reset the pool on connection error so we create a new one next time
      pool = null;
      isConnecting = false;
    });

    // Test connection
    const client = await pool.connect();
    client.release();
    console.log('Successfully connected to database');
    connectionRetries = 0;
    isConnecting = false;
    dbConnectionFailed = false; // Reset the failure flag on successful connection
    return pool;
  } catch (error) {
    console.error('Failed to create database pool:', error);
    pool = null;
    isConnecting = false;

    // Retry connection if not exceeded max retries
    if (connectionRetries < maxRetries) {
      connectionRetries++;
      console.log(`Retrying database connection (${connectionRetries}/${maxRetries}) in ${RETRY_INTERVAL/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return getPool();
    }

    // Set the failure flag
    dbConnectionFailed = true;

    // In development, use a minimal pool that will return errors when used
    console.warn('Using minimal pool - no database connection available after all retries');
    const minimalPool = new Pool();
    // Override the query method to always throw an error
    // This ensures consistent behavior for fallback data
    minimalPool.query = async () => {
      throw new Error('Database connection is not available');
    };
    return minimalPool;
  }
};

// Helper function to execute queries with proper error handling
async function executeQuery<T>(queryFn: () => Promise<T>, errorMessage: string, defaultValue?: T): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    console.error(`${errorMessage}:`, error);

    if (defaultValue !== undefined) {
      // In development, log that we're using fallback data
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Using fallback data for: ${errorMessage}`);
      }
      return defaultValue;
    }

    throw error;
  }
}

// Helper function for password hashing - using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Categories
export const getCategories = async () => {
  const query = `
    SELECT
      category_id as id,
      name,
      slug,
      description,
      image_url as image,
      parent_id,
      is_active
    FROM
      blinds.categories
    WHERE
      is_active = TRUE
    ORDER BY
      display_order ASC, name ASC
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query);
      return result.rows;
    },
    'Database error fetching categories',
    [] // Return empty array as fallback
  );
};

// Get a single category by slug
export const getCategoryBySlug = async (slug: string) => {
  const query = `
    SELECT
      category_id as id,
      name,
      slug,
      description,
      image_url as image,
      parent_id,
      is_active
    FROM
      blinds.categories
    WHERE
      slug = $1 AND is_active = TRUE
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, [slug]);
      return result.rows[0] || null;
    },
    `Database error fetching category by slug: ${slug}`,
    null
  );
};

// Get subcategories for a parent category
export const getSubcategories = async (parentId: number) => {
  const query = `
    SELECT
      category_id as id,
      name,
      slug,
      description,
      image_url as image,
      parent_id,
      is_active
    FROM
      blinds.categories
    WHERE
      parent_id = $1 AND is_active = TRUE
    ORDER BY
      display_order ASC, name ASC
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, [parentId]);
      return result.rows;
    },
    `Database error fetching subcategories for parent ID: ${parentId}`,
    []
  );
};

// Fix TypeScript errors by explicitly typing the query parameters
export const getProductsCount = async ({
  categoryId = null,
  search = null,
  minPrice = null,
  maxPrice = null
}: Omit<ProductQueryParams, 'limit' | 'offset' | 'sortBy' | 'sortOrder'> = {}) => {
  let query = `
    SELECT
      COUNT(*) as total
    FROM
      blinds.products p
    JOIN
      blinds.categories c ON p.category_id = c.category_id
    WHERE
      p.is_active = TRUE
  `;

  const queryParams: unknown[] = [];
  let paramCount = 1;

  if (categoryId) {
    query += ` AND (p.category_id = $${paramCount} OR c.parent_id = $${paramCount})`;
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

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, queryParams);
      return parseInt(result.rows[0].total, 10);
    },
    'Database error fetching product count',
    0
  );
};

// Products with pagination and filtering
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
        FROM blinds.product_images
        WHERE product_id = p.product_id AND is_primary = TRUE
        LIMIT 1
      ) as primary_image
    FROM
      blinds.products p
    JOIN
      blinds.categories c ON p.category_id = c.category_id
    WHERE
      p.is_active = TRUE
  `;

  const queryParams: unknown[] = [];
  let paramCount = 1;

  if (categoryId) {
    // Include both direct category and its subcategories
    query += ` AND (p.category_id = $${paramCount} OR c.parent_id = $${paramCount})`;
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
  const validSortFields = ['name', 'base_price', 'rating', 'review_count', 'product_id'];
  const validSortOrders = ['asc', 'desc'];

  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
  const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'asc';

  query += ` ORDER BY p.${finalSortBy} ${finalSortOrder}`;

  // Add pagination
  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  queryParams.push(limit, offset);

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, queryParams);
      return result.rows;
    },
    'Database error fetching products',
    []
  );
};

// Get a single product by slug
export const getProductBySlug = async (slug: string) => {
  return executeQuery(
    async () => {
      const pool = await getPool();
      const productQuery = `
        SELECT
          p.product_id
        FROM
          blinds.products p
        WHERE
          p.slug = $1 AND p.is_active = TRUE
      `;

      const productResult = await pool.query(productQuery, [slug]);

      if (productResult.rows.length === 0) {
        return null;
      }

      return getProductById(productResult.rows[0].product_id);
    },
    `Database error fetching product by slug: ${slug}`,
    null
  );
};

// Get a single product by ID
export const getProductById = async (productId: number) => {
  return executeQuery(
    async () => {
      const pool = await getPool();
      const productQuery = `
        SELECT
          p.*,
          c.name as category_name,
          c.slug as category_slug
        FROM
          blinds.products p
        JOIN
          blinds.categories c ON p.category_id = c.category_id
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
        SELECT * FROM blinds.product_images
        WHERE product_id = $1
        ORDER BY is_primary DESC, display_order ASC
      `;
      const imagesResult = await pool.query(imagesQuery, [productId]);
      product.images = imagesResult.rows;

      // Get product features
      const featuresQuery = `
        SELECT f.name, f.description, pf.value
        FROM blinds.product_features pf
        JOIN blinds.features f ON pf.feature_id = f.feature_id
        WHERE pf.product_id = $1
      `;
      const featuresResult = await pool.query(featuresQuery, [productId]);
      product.features = featuresResult.rows;

      // Get product colors
      const colorsQuery = `
        SELECT c.*, pc.price_modifier, pc.image_url as swatch_image, pc.is_default
        FROM blinds.product_colors pc
        JOIN blinds.colors c ON pc.color_id = c.color_id
        WHERE pc.product_id = $1 AND c.is_active = TRUE
      `;
      const colorsResult = await pool.query(colorsQuery, [productId]);
      product.colors = colorsResult.rows;

      // Get product materials
      const materialsQuery = `
        SELECT m.*, pm.price_modifier, pm.is_default
        FROM blinds.product_materials pm
        JOIN blinds.materials m ON pm.material_id = m.material_id
        WHERE pm.product_id = $1 AND m.is_active = TRUE
      `;
      const materialsResult = await pool.query(materialsQuery, [productId]);
      product.materials = materialsResult.rows;

      return product;
    },
    `Database error fetching product by ID: ${productId}`,
    null
  );
};

// Get featured products for homepage
export const getFeaturedProducts = async (limit = 6) => {
  const query = `
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
      blinds.products p
    JOIN
      blinds.categories c ON p.category_id = c.category_id
    WHERE
      p.is_active = TRUE AND p.is_featured = TRUE
    ORDER BY
      p.rating DESC, p.review_count DESC
    LIMIT $1
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, [limit]);
      return result.rows;
    },
    'Database error fetching featured products',
    []
  );
};

// Get product features for filters
export const getProductFeatures = async () => {
  const query = `
    SELECT
      feature_id as id,
      name,
      description
    FROM
      blinds.features
    WHERE
      is_active = TRUE
    ORDER BY
      name
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query);
      return result.rows;
    },
    'Database error fetching product features',
    []
  );
};

// User functions

// Get user by ID
export const getUserById = async (userId: number) => {
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
      blinds.users
    WHERE
      user_id = $1 AND is_active = TRUE
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    },
    `Database error fetching user by ID: ${userId}`,
    null
  );
};

// Get user by email
export const getUserByEmail = async (email: string) => {
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
      blinds.users
    WHERE
      email = $1 AND is_active = TRUE
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    },
    `Database error fetching user by email: ${email}`,
    null
  );
};

// Get user role (admin, vendor, customer, etc.)
export const getUserRole = async (userId: number) => {
  return executeQuery(
    async () => {
      // First check if the user is an admin
      const pool = await getPool();
      const userQuery = `
        SELECT is_admin FROM blinds.users WHERE user_id = $1 AND is_active = TRUE
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
        SELECT * FROM blinds.vendor_info WHERE user_id = $1 AND is_active = TRUE
      `;
      const vendorResult = await pool.query(vendorQuery, [userId]);

      if (vendorResult.rows.length > 0) {
        return 'vendor';
      }

      // Default role is customer
      return 'customer';
    },
    `Database error getting user role for user ID: ${userId}`,
    'customer'
  );
};

// Get user orders
export const getUserOrders = async (userId: number) => {
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
      blinds.order_status s ON o.status_id = s.status_id
    LEFT JOIN
      blinds.order_items oi ON o.order_id = oi.order_id
    WHERE
      o.user_id = $1
    GROUP BY
      o.order_id, o.order_number, o.created_at, o.total_amount, s.name
    ORDER BY
      o.created_at DESC
  `;

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, [userId]);
      return result.rows;
    },
    `Database error fetching orders for user ID: ${userId}`,
    []
  );
};

// Get order details
export const getOrderById = async (orderId: number, userId: number | null = null) => {
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
      blinds.orders o
    JOIN
      blinds.order_status s ON o.status_id = s.status_id
    LEFT JOIN
      blinds.order_items oi ON o.order_id = oi.order_id
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

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    },
    `Database error fetching order details for order ID: ${orderId}`,
    null
  );
};

// Get vendor products
export const getVendorProducts = async (vendorId: number) => {
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

  return executeQuery(
    async () => {
      const pool = await getPool();
      const result = await pool.query(query, [vendorId]);
      return result.rows;
    },
    `Database error fetching products for vendor ID: ${vendorId}`,
    []
  );
};

// Export the pool getter for direct use in API routes
export default getPool;
