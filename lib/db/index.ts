import * as mysql from 'mysql2/promise';
import { RowDataPacket, FieldPacket, ResultSetHeader, OkPacket } from 'mysql2';
import bcrypt from 'bcrypt';

// Define types for query parameters and results
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

interface BaseRow extends RowDataPacket {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  is_active?: boolean;
}

interface UserRow extends RowDataPacket {
  user_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_admin: boolean;
  is_active: boolean;
}

// Define result types
type QueryResult<T> = [T[], FieldPacket[]];
type SingleQueryResult<T> = [T[], FieldPacket[]];
type CountQueryResult = [RowDataPacket & { total: number }[], FieldPacket[]];

// Use a singleton pattern for the database connection
let pool: mysql.Pool | null = null;
let isConnecting = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 2000; // 2 seconds
let dbConnectionFailed = false;

// Function to get the database connection pool
export const getPool = async (): Promise<mysql.Pool> => {
  if (pool) return pool;

  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return getPool();
  }

  const maxRetries = process.env.NODE_ENV === 'production' ? MAX_RETRIES : 1;

  if (dbConnectionFailed && connectionRetries >= maxRetries) {
    throw new Error('Database connection is not available after all retries');
  }

  isConnecting = true;

  try {
    // Log connection attempt
    console.log('Attempting database connection with config:', {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'smartblindshub'
    });

    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Test@1234',
      database: process.env.DB_NAME || 'smartblindshub',
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 10000,
      multipleStatements: false
    });

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    
    // Log successful connection
    const [result] = await connection.execute<RowDataPacket[]>('SELECT VERSION() as version');
    console.log('Successfully connected to database. Server info:', result);
    
    connection.release();
    connectionRetries = 0;
    isConnecting = false;
    dbConnectionFailed = false;
    return pool;
  } catch (error) {
    console.error('Failed to create database pool:', {
      error,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    pool = null;
    isConnecting = false;

    if (connectionRetries < maxRetries) {
      connectionRetries++;
      console.log(`Retrying database connection (${connectionRetries}/${maxRetries}) in ${RETRY_INTERVAL/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return getPool();
    }

    dbConnectionFailed = true;
    throw new Error('Database connection failed after all retries');
  }
};

// Helper function to execute queries with proper error handling
async function executeQuery<T extends RowDataPacket>(
  pool: mysql.Pool,
  query: string,
  params: any[],
  errorMessage: string
): Promise<T[]> {
  try {
    const [results] = await pool.execute<T[]>(query, params);
    return results;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return [];
  }
}

// Helper function for single row queries
async function executeSingleRowQuery<T extends RowDataPacket>(
  pool: mysql.Pool,
  query: string,
  params: any[],
  errorMessage: string
): Promise<T | null> {
  try {
    const [results] = await pool.execute<T[]>(query, params);
    return results[0] || null;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return null;
  }
}

// Helper function for count queries
async function executeCountQuery(
  pool: mysql.Pool,
  query: string,
  params: any[],
  errorMessage: string
): Promise<number> {
  try {
    interface CountResult extends RowDataPacket {
      total: number;
    }
    const [results] = await pool.execute<CountResult[]>(query, params);
    return results[0]?.total || 0;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return 0;
  }
}

// Helper function for password hashing - using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  console.log('Comparing password...');
  console.log('Password length:', password.length);
  console.log('Password type:', typeof password);
  console.log('Hash length:', hash.length);
  console.log('Hash type:', typeof hash);
  try {
    const result = await bcrypt.compare(password, hash);
    console.log('Bcrypt comparison result:', result);
    return result;
  } catch (error) {
    console.error('Error during password comparison:', error);
    return false;
  }
};

// Categories
export const getCategories = async (): Promise<BaseRow[]> => {
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
      categories
    WHERE
      is_active = TRUE
    ORDER BY
      display_order ASC, name ASC
  `;

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<BaseRow[]>(query);
    return rows;
  } catch (error) {
    console.error('Database error fetching categories:', error);
    return [];
  }
};

// Get a single category by slug
export const getCategoryBySlug = async (slug: string): Promise<BaseRow | null> => {
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
      categories
    WHERE
      slug = ? AND is_active = TRUE
  `;

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<BaseRow[]>(query, [slug]);
    return rows[0] || null;
  } catch (error) {
    console.error(`Database error fetching category by slug: ${slug}:`, error);
    return null;
  }
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
      categories
    WHERE
      parent_id = ? AND is_active = TRUE
    ORDER BY
      display_order ASC, name ASC
  `;

  return executeQuery(
    await getPool(),
    query,
    [parentId],
    `Database error fetching subcategories for parent ID: ${parentId}`
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
      products p
    JOIN
      categories c ON p.category_id = c.category_id
    WHERE
      p.is_active = TRUE
  `;

  const queryParams: unknown[] = [];
  let paramCount = 1;

  if (categoryId) {
    query += ` AND (p.category_id = ? OR c.parent_id = ?)`;
    queryParams.push(categoryId, categoryId);
    paramCount++;
  }

  if (search) {
    query += ` AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.short_description) LIKE LOWER(?))`;
    queryParams.push(`%${search}%`, `%${search}%`);
    paramCount++;
  }

  if (minPrice !== null) {
    query += ` AND p.base_price >= ?`;
    queryParams.push(minPrice);
    paramCount++;
  }

  if (maxPrice !== null) {
    query += ` AND p.base_price <= ?`;
    queryParams.push(maxPrice);
    paramCount++;
  }

  return executeCountQuery(
    await getPool(),
    query,
    queryParams,
    'Database error fetching product count'
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

  const queryParams: unknown[] = [];
  let paramCount = 1;

  if (categoryId) {
    // Include both direct category and its subcategories
    query += ` AND (p.category_id = ? OR c.parent_id = ?)`;
    queryParams.push(categoryId, categoryId);
    paramCount++;
  }

  if (search) {
    query += ` AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.short_description) LIKE LOWER(?))`;
    queryParams.push(`%${search}%`, `%${search}%`);
    paramCount++;
  }

  if (minPrice !== null) {
    query += ` AND p.base_price >= ?`;
    queryParams.push(minPrice);
    paramCount++;
  }

  if (maxPrice !== null) {
    query += ` AND p.base_price <= ?`;
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
  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);

  return executeQuery(
    await getPool(),
    query,
    queryParams,
    'Database error fetching products'
  );
};

// Get a single product by slug
export const getProductBySlug = async (slug: string) => {
  return executeSingleRowQuery(
    await getPool(),
    `
      SELECT
        p.product_id
      FROM
        products p
      WHERE
        p.slug = ? AND p.is_active = TRUE
    `,
    [slug],
    `Database error fetching product by slug: ${slug}`
  );
};

// Get a single product by ID
export const getProductById = async (productId: number) => {
  return executeSingleRowQuery(
    await getPool(),
    `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM
        products p
      JOIN
        categories c ON p.category_id = c.category_id
      WHERE
        p.product_id = ? AND p.is_active = TRUE
    `,
    [productId],
    `Database error fetching product by ID: ${productId}`
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
      products p
    JOIN
      categories c ON p.category_id = c.category_id
    WHERE
      p.is_active = TRUE AND p.is_featured = TRUE
    ORDER BY
      p.rating DESC, p.review_count DESC
    LIMIT ?
  `;

  return executeQuery(
    await getPool(),
    query,
    [limit],
    'Database error fetching featured products'
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
      features
    WHERE
      is_active = TRUE
    ORDER BY
      name
  `;

  return executeQuery(
    await getPool(),
    query,
    [],
    'Database error fetching product features'
  );
};

// User functions

// Get user by ID
export const getUserById = async (userId: number): Promise<UserRow | null> => {
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
      user_id = ? AND is_active = TRUE
  `;

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<UserRow[]>(query, [userId]);
    return rows[0] || null;
  } catch (error) {
    console.error(`Database error fetching user by ID: ${userId}:`, error);
    return null;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<UserRow | null> => {
  const query = `
    SELECT
      user_id,
      email,
      password_hash,
      first_name,
      last_name,
      is_admin,
      is_active
    FROM users
    WHERE email = ? AND is_active = TRUE
  `;

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<UserRow[]>(query, [email]);
    return rows[0] || null;
  } catch (error) {
    console.error(`Database error fetching user by email: ${email}:`, error);
    return null;
  }
};

// Get user role (admin, vendor, customer, etc.)
export const getUserRole = async (userId: number) => {
  return executeSingleRowQuery(
    await getPool(),
    `
      SELECT is_admin FROM users WHERE user_id = ? AND is_active = TRUE
    `,
    [userId],
    `Database error getting user role for user ID: ${userId}`
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
      order_status s ON o.status_id = s.status_id
    LEFT JOIN
      order_items oi ON o.order_id = oi.order_id
    WHERE
      o.user_id = ?
    GROUP BY
      o.order_id, o.order_number, o.created_at, o.total_amount, s.name
    ORDER BY
      o.created_at DESC
  `;

  return executeQuery(
    await getPool(),
    query,
    [userId],
    `Database error fetching orders for user ID: ${userId}`
  );
};

// Get order details
export const getOrderById = async (orderId: number, userId: number | null = null) => {
  // Base query to get order details
  let query = `
    SELECT
      o.*,
      s.name as status_name,
      JSON_ARRAYAGG(
        JSON_OBJECT(
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
      o.order_id = ?
  `;

  // If userId is provided, restrict to orders for that user
  const params = [orderId];
  if (userId !== null) {
    query += ` AND o.user_id = ?`;
    params.push(userId);
  }

  query += `
    GROUP BY
      o.order_id, s.name
  `;

  return executeSingleRowQuery(
    await getPool(),
    query,
    params,
    `Database error fetching order details for order ID: ${orderId}`
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
      vendor_id = ?
    ORDER BY
      created_at DESC
  `;

  return executeQuery(
    await getPool(),
    query,
    [vendorId],
    `Database error fetching products for vendor ID: ${vendorId}`
  );
};

// Room Visualizer related functions
interface RoomVisualization {
  id: string;
  resultImage: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface RoomVisualizationRow extends RowDataPacket {
  id: string;
  result_image: string;
  created_at: string;
  product_id: string;
  product_name: string;
  product_price: string;
}

export const createRoomVisualization = async (
  userId: string,
  productId: string,
  roomImage: string,
  resultImage: string
): Promise<{ id: string }> => {
  const pool = await getPool();
  const id = generateId();
  await pool.execute<ResultSetHeader>(
    'INSERT INTO room_visualizations (id, user_id, product_id, room_image, result_image, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [id, userId, productId, roomImage, resultImage]
  );
  return { id };
};

export const getRoomVisualizations = async (userId: string): Promise<RoomVisualization[]> => {
  const pool = await getPool();
  const [results] = await pool.execute<RoomVisualizationRow[]>(
    `SELECT 
      rv.id,
      rv.result_image,
      rv.created_at,
      p.id as product_id,
      p.name as product_name,
      p.price as product_price
    FROM room_visualizations rv
    JOIN products p ON rv.product_id = p.id
    WHERE rv.user_id = ?
    ORDER BY rv.created_at DESC`,
    [userId]
  );
  
  return results.map(row => ({
    id: row.id,
    resultImage: row.result_image,
    createdAt: new Date(row.created_at),
    product: {
      id: row.product_id,
      name: row.product_name,
      price: parseFloat(row.product_price)
    }
  }));
};

// Helper function to generate CUID-like IDs
function generateId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Export the pool getter for direct use in API routes
export default getPool;
