import * as mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

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
