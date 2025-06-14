import * as mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Types for database operations
type QueryParams = string | number | boolean | Date | Buffer | null;

interface RoomVisualization {
  id: string;
  userId: number;
  productId: number;
  roomImage: string;
  resultImage: string;
  placement?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
  };
  created_at: Date;
  updated_at: Date;
}

interface RoomVisualizationRow extends RowDataPacket {
  id: string;
  user_id: number;
  product_id: number;
  room_image: string;
  result_image: string;
  placement: string | null;
  created_at: Date;
  updated_at: Date;
}

// Helper function to generate unique IDs
const generateId = () => uuidv4();

// Database connection singleton
let pool: mysql.Pool | null = null;
let isConnecting = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 2000;
let dbConnectionFailed = false;

// Generic execute query function with proper typing
export async function executeQuery<T extends RowDataPacket>(
  pool: mysql.Pool,
  query: string,
  params: QueryParams[],
  errorMessage: string
): Promise<T[]> {
  try {
    const [rows] = await pool.execute<T[]>(query, params);
    return rows;
  } catch (error) {
    // Log error safely without exposing sensitive data
    if (process.env.NODE_ENV !== 'production') {
      console.error(errorMessage, error);
    } else {
      console.error(errorMessage);
    }
    throw new Error(errorMessage);
  }
}

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
    // Validate required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'blindscommerce',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: false
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    connectionRetries = 0;
    isConnecting = false;
    dbConnectionFailed = false;
    return pool;
  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to create database pool:', error);
    } else {
      console.error('Database connection failed');
    }
    pool = null;
    isConnecting = false;

    if (connectionRetries < maxRetries) {
      connectionRetries++;
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return getPool();
    }

    dbConnectionFailed = true;
    throw new Error('Database connection failed after all retries');
  }
};

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Safe error logging without exposing details
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error during password comparison:', error);
    } else {
      console.error('Password comparison failed');
    }
    return false;
  }
};

// Room Visualization Functions
export const createRoomVisualization = async (
  userId: number,
  productId: number,
  roomImage: string,
  resultImage: string,
  placement: RoomVisualization['placement']
): Promise<RoomVisualization> => {
  const pool = await getPool();
  const id = generateId();
  
  await pool.execute<ResultSetHeader>(
    `INSERT INTO room_visualizations 
     (id, user_id, product_id, room_image, result_image, placement) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, productId, roomImage, resultImage, placement ? JSON.stringify(placement) : null]
  );

  return getRoomVisualization(id) as Promise<RoomVisualization>;
};

export const getRoomVisualizations = async (userId: number): Promise<RoomVisualization[]> => {
  const pool = await getPool();
  const [rows] = await pool.execute<RoomVisualizationRow[]>(
    `SELECT * FROM room_visualizations WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    roomImage: row.room_image,
    resultImage: row.result_image,
    placement: row.placement ? JSON.parse(row.placement) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
};

export const getRoomVisualization = async (id: string): Promise<RoomVisualization | null> => {
  const pool = await getPool();
  const [rows] = await pool.execute<RoomVisualizationRow[]>(
    'SELECT * FROM room_visualizations WHERE id = ?',
    [id]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    roomImage: row.room_image,
    resultImage: row.result_image,
    placement: row.placement ? JSON.parse(row.placement) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

export const deleteRoomVisualization = async (id: string, userId: number): Promise<void> => {
  const pool = await getPool();
  await pool.execute(
    'DELETE FROM room_visualizations WHERE id = ? AND user_id = ?',
    [id, userId]
  );
};

export const updateRoomVisualization = async (
  id: string,
  userId: number,
  data: Partial<RoomVisualization>
): Promise<RoomVisualization | null> => {
  const pool = await getPool();
  
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.roomImage) {
    updates.push('room_image = ?');
    values.push(data.roomImage);
  }

  if (data.resultImage) {
    updates.push('result_image = ?');
    values.push(data.resultImage);
  }

  if (data.placement) {
    updates.push('placement = ?');
    values.push(JSON.stringify(data.placement));
  }

  if (updates.length === 0) return getRoomVisualization(id);

  values.push(id, userId);

  await pool.execute(
    `UPDATE room_visualizations 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ?`,
    values
  );

  return getRoomVisualization(id);
};

// User management functions
export const getUserById = async (userId: string | number): Promise<any | null> => {
  const pool = await getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT user_id, email, first_name, last_name, phone, role, is_active, is_verified, created_at FROM users WHERE user_id = ?',
    [userId]
  );

  if (rows.length === 0) return null;
  return rows[0];
};

export const getUserOrders = async (userId: string | number, limit: number = 10, offset: number = 0): Promise<any[]> => {
  const pool = await getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      order_id,
      order_number,
      status,
      total_amount,
      currency,
      created_at,
      updated_at
    FROM orders 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return rows;
};

// Get order by ID with optional user ID check
export const getOrderById = async (orderId: number, userId?: number | null): Promise<any | null> => {
  const pool = await getPool();
  
  // Build query based on whether we need to filter by user
  let query = `
    SELECT 
      o.order_id,
      o.order_number,
      o.user_id,
      o.status,
      o.total_amount,
      o.subtotal,
      o.tax_amount,
      o.shipping_amount,
      o.discount_amount,
      o.currency,
      o.shipping_address,
      o.billing_address,
      o.payment_method,
      o.payment_status,
      o.tracking_number,
      o.notes,
      o.created_at,
      o.updated_at,
      u.email as user_email,
      u.first_name,
      u.last_name,
      u.phone
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?`;
  
  const params: (number | null)[] = [orderId];
  
  // If userId is provided, add it to the WHERE clause
  if (userId !== null && userId !== undefined) {
    query += ' AND o.user_id = ?';
    params.push(userId);
  }
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  
  if (rows.length === 0) return null;
  
  const order = rows[0];
  
  // Get order items
  const [items] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      oi.order_item_id,
      oi.product_id,
      oi.quantity,
      oi.price,
      oi.discount_amount,
      oi.tax_amount,
      oi.total,
      p.name as product_name,
      p.sku,
      p.image_url
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.product_id
    WHERE oi.order_id = ?`,
    [orderId]
  );
  
  order.items = items;
  
  return order;
};

// Category functions
export const getCategoryBySlug = async (slug: string): Promise<any | null> => {
  const pool = await getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      category_id,
      name,
      slug,
      description,
      image_url,
      parent_id,
      display_order,
      is_active,
      created_at,
      updated_at
    FROM categories 
    WHERE slug = ? AND is_active = 1`,
    [slug]
  );

  if (rows.length === 0) return null;
  return rows[0];
};

// Product functions
export const getProductBySlug = async (slug: string): Promise<any | null> => {
  const pool = await getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      p.product_id,
      p.name,
      p.slug,
      p.sku,
      p.short_description,
      p.full_description,
      p.base_price,
      p.category_id,
      c.name as category_name,
      c.slug as category_slug,
      p.brand_id,
      b.name as brand_name,
      p.primary_image_url,
      p.rating,
      p.review_count,
      p.is_active,
      p.is_featured,
      p.created_at,
      p.updated_at
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN brands b ON p.brand_id = b.brand_id
    WHERE p.slug = ? AND p.is_active = 1
    LIMIT 1`,
    [slug]
  );

  if (rows.length === 0) return null;
  
  const product = rows[0];
  
  // Transform data to match expected format
  return {
    ...product,
    // Ensure numeric types
    base_price: parseFloat(product.base_price || 0),
    rating: parseFloat(product.rating || 0),
    review_count: parseInt(product.review_count || 0),
    
    // Add missing fields expected by the UI
    is_on_sale: false, // Default for now
    sale_price: null,  // Default for now
    
    // Handle images - create array from primary_image_url if no images exist
    images: product.primary_image_url ? [
      {
        image_id: 1,
        image_url: product.primary_image_url,
        is_primary: true
      }
    ] : [],
    
    // Default empty arrays for missing features
    features: []
  };
};

// New function to get products by partial slug match (for category-like pages)
export const getProductsBySlugPattern = async (slug: string): Promise<any[]> => {
  const pool = await getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
      p.product_id,
      p.name,
      p.slug,
      p.sku,
      p.short_description,
      p.full_description,
      p.base_price,
      p.category_id,
      c.name as category_name,
      c.slug as category_slug,
      p.brand_id,
      b.name as brand_name,
      p.primary_image_url,
      p.rating,
      p.review_count,
      p.is_active,
      p.is_featured,
      p.created_at,
      p.updated_at
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN brands b ON p.brand_id = b.brand_id
    WHERE p.slug LIKE ? AND p.is_active = 1
    ORDER BY 
      CASE WHEN p.slug = ? THEN 1 ELSE 2 END,
      p.name
    LIMIT 50`,
    [`%${slug}%`, slug]
  );

  // Transform all products
  return rows.map(product => ({
    ...product,
    // Ensure numeric types
    base_price: parseFloat(product.base_price || 0),
    rating: parseFloat(product.rating || 0),
    review_count: parseInt(product.review_count || 0),
    
    // Add missing fields expected by the UI
    is_on_sale: false, // Default for now
    sale_price: null,  // Default for now
    
    // Handle images - create array from primary_image_url if no images exist
    images: product.primary_image_url ? [
      {
        image_id: 1,
        image_url: product.primary_image_url,
        is_primary: true
      }
    ] : [],
    
    // Default empty arrays for missing features
    features: []
  }));
};

// Get products with filtering, pagination, and sorting
interface GetProductsParams {
  limit?: number;
  offset?: number;
  categoryId?: number | null;
  search?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: string;
  sortOrder?: string;
}

export const getProducts = async (params: GetProductsParams): Promise<any[]> => {
  const {
    limit = 10,
    offset = 0,
    categoryId,
    search,
    minPrice,
    maxPrice,
    sortBy = 'name',
    sortOrder = 'asc'
  } = params;

  const pool = await getPool();
  
  // Build WHERE clause
  const conditions: string[] = ['p.is_active = 1'];
  const queryParams: any[] = [];
  
  if (categoryId) {
    conditions.push('p.category_id = ?');
    queryParams.push(categoryId);
  }
  
  if (search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`);
  }
  
  if (minPrice !== null) {
    conditions.push('p.base_price >= ?');
    queryParams.push(minPrice);
  }
  
  if (maxPrice !== null) {
    conditions.push('p.base_price <= ?');
    queryParams.push(maxPrice);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Validate sort column to prevent SQL injection
  const allowedSortColumns = ['name', 'base_price', 'created_at', 'rating'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
  const sortDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  
  // Add limit and offset
  queryParams.push(limit, offset);
  
  const query = `
    SELECT 
      p.product_id,
      p.name,
      p.slug,
      p.sku,
      p.description,
      p.base_price,
      p.category_id,
      c.name as category_name,
      c.slug as category_slug,
      p.primary_image_url,
      p.is_featured,
      COALESCE(AVG(pr.rating), 0) as rating,
      COUNT(DISTINCT pr.review_id) as review_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_reviews pr ON p.product_id = pr.product_id
    ${whereClause}
    GROUP BY p.product_id
    ORDER BY ${sortColumn === 'rating' ? 'rating' : `p.${sortColumn}`} ${sortDirection}
    LIMIT ? OFFSET ?
  `;
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, queryParams);
  return rows;
};

// Get database connection (returns a connection from the pool)
export const getConnection = async () => {
  const pool = await getPool();
  return pool.getConnection();
};

// Export db object with execute method for direct queries
export const db = {
  execute: async <T extends RowDataPacket>(query: string, params?: any[]): Promise<[T[], any]> => {
    const pool = await getPool();
    return pool.execute<T[]>(query, params || []);
  },
  
  query: async <T extends RowDataPacket>(query: string, params?: any[]): Promise<[T[], any]> => {
    const pool = await getPool();
    return pool.query<T[]>(query, params || []);
  }
};
