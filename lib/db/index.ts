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
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 10000,
      acquireTimeout: 60000,
      timeout: 60000,
      multipleStatements: false, // Prevent SQL injection via multiple statements
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA,
        cert: process.env.DB_SSL_CERT,
        key: process.env.DB_SSL_KEY
      } : false,
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
