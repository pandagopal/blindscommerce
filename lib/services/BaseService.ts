/**
 * Base Service Class for BlindsCommerce
 * Provides common database operations and query optimization
 */

import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2';
import { logError } from '@/lib/errorHandling';

export interface QueryResult<T = any> {
  rows: T[];
  total?: number;
}

export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: Array<{ id: any; error: string }>;
}

export abstract class BaseService {
  protected tableName: string;
  protected primaryKey: string = 'id';
  
  constructor(tableName: string, primaryKey?: string) {
    this.tableName = tableName;
    if (primaryKey) this.primaryKey = primaryKey;
  }

  /**
   * Execute a single query with proper connection handling
   */
  protected async executeQuery<T extends RowDataPacket>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    const pool = await getPool();
    try {
      const [rows] = await pool.execute<T[]>(query, params);
      return rows;
    } catch (error) {
      logError(error as Error, { query, params });
      throw error;
    }
  }

  /**
   * Execute a mutation query (INSERT, UPDATE, DELETE)
   */
  protected async executeMutation(
    query: string,
    params: any[] = []
  ): Promise<ResultSetHeader> {
    const pool = await getPool();
    try {
      const [result] = await pool.execute<ResultSetHeader>(query, params);
      return result;
    } catch (error) {
      logError(error as Error, { query, params });
      throw error;
    }
  }

  /**
   * Execute a raw query (alias for executeQuery for compatibility)
   */
  async raw<T extends RowDataPacket>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    return this.executeQuery<T>(query, params);
  }

  /**
   * Execute multiple queries in parallel
   */
  protected async executeParallel<T extends Record<string, any>>(
    queries: Record<keyof T, { query: string; params: any[] }>
  ): Promise<T> {
    const promises = Object.entries(queries).map(async ([key, { query, params }]) => {
      try {
        const result = await this.executeQuery(query, params);
        return [key, result];
      } catch (error) {
        logError(error as Error, { key, query });
        return [key, null];
      }
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results) as T;
  }

  /**
   * Find a single record by ID
   */
  async findById<T extends RowDataPacket>(id: number | string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
    const rows = await this.executeQuery<T>(query, [id]);
    return rows[0] || null;
  }

  /**
   * Find multiple records by IDs using IN clause
   */
  async findByIds<T extends RowDataPacket>(ids: Array<number | string>): Promise<T[]> {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} IN (${placeholders})`;
    return this.executeQuery<T>(query, ids);
  }

  /**
   * Find all records with optional filtering
   */
  async findAll<T extends RowDataPacket>(options: {
    where?: Record<string, any>;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  } = {}): Promise<QueryResult<T>> {
    const { where = {}, orderBy, orderDirection = 'ASC', limit, offset } = options;
    
    // Build WHERE clause
    const whereConditions = Object.entries(where)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([field]) => `${field} = ?`);
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const whereParams = Object.entries(where)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([_, value]) => value);
    
    // Build ORDER BY clause
    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDirection}` : '';
    
    // Build LIMIT clause (using safe interpolation for integers)
    const limitClause = limit ? `LIMIT ${Math.floor(limit)}` : '';
    const offsetClause = offset ? `OFFSET ${Math.floor(offset)}` : '';
    
    // Get total count if pagination is used
    let total: number | undefined;
    if (limit) {
      const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
      const [countResult] = await this.executeQuery<RowDataPacket>(countQuery, whereParams);
      total = countResult.count;
    }
    
    // Get records
    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderClause}
      ${limitClause}
      ${offsetClause}
    `.trim();
    
    const rows = await this.executeQuery<T>(query, whereParams);
    
    return { rows, total };
  }

  /**
   * Create a new record
   */
  async create<T extends RowDataPacket>(data: Partial<T>): Promise<T | null> {
    const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
    const values = fields.map(key => data[key as keyof T]);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;
    
    const result = await this.executeMutation(query, values);
    
    if (result.insertId) {
      return this.findById<T>(result.insertId);
    }
    
    return null;
  }

  /**
   * Update a record by ID
   */
  async update<T extends RowDataPacket>(
    id: number | string,
    data: Partial<T>
  ): Promise<T | null> {
    const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
    const values = fields.map(key => data[key as keyof T]);
    values.push(id);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${this.primaryKey} = ?
    `;
    
    await this.executeMutation(query, values);
    return this.findById<T>(id);
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number | string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const result = await this.executeMutation(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Batch create operation
   */
  async batchCreate<T extends RowDataPacket>(
    records: Partial<T>[]
  ): Promise<BatchOperationResult> {
    if (records.length === 0) {
      return { successful: 0, failed: 0, errors: [] };
    }

    const result: BatchOperationResult = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Get fields from first record
    const fields = Object.keys(records[0]).filter(key => records[0][key as keyof T] !== undefined);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    // Execute in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const pool = await getPool();
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        for (const record of batch) {
          try {
            const values = fields.map(key => record[key as keyof T]);
            await connection.execute(query, values);
            result.successful++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              id: (record as any)[this.primaryKey] || 'unknown',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        result.failed += batch.length;
        result.errors.push({
          id: 'batch',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        connection.release();
      }
    }

    return result;
  }

  /**
   * Execute a raw query with proper typing
   */
  async raw<T extends RowDataPacket>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    return this.executeQuery<T>(query, params);
  }

  /**
   * Execute a complex JOIN query
   */
  protected buildJoinQuery(options: {
    select?: string[];
    joins: Array<{
      type?: 'INNER' | 'LEFT' | 'RIGHT';
      table: string;
      on: string;
    }>;
    where?: Record<string, any>;
    groupBy?: string[];
    having?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): { query: string; params: any[] } {
    const {
      select = ['*'],
      joins,
      where = {},
      groupBy,
      having,
      orderBy,
      orderDirection = 'ASC',
      limit,
      offset
    } = options;

    // Build SELECT clause
    const selectClause = `SELECT ${select.join(', ')}`;
    
    // Build FROM clause
    const fromClause = `FROM ${this.tableName}`;
    
    // Build JOIN clauses
    const joinClauses = joins.map(join => {
      const joinType = join.type || 'INNER';
      return `${joinType} JOIN ${join.table} ON ${join.on}`;
    }).join('\n');
    
    // Build WHERE clause
    const whereConditions = Object.entries(where)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([field]) => `${field} = ?`);
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const whereParams = Object.entries(where)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([_, value]) => value);
    
    // Build GROUP BY clause
    const groupByClause = groupBy ? `GROUP BY ${groupBy.join(', ')}` : '';
    
    // Build HAVING clause
    const havingClause = having ? `HAVING ${having}` : '';
    
    // Build ORDER BY clause
    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDirection}` : '';
    
    // Build LIMIT clause
    const limitClause = limit ? `LIMIT ${Math.floor(limit)}` : '';
    const offsetClause = offset ? `OFFSET ${Math.floor(offset)}` : '';
    
    const query = `
      ${selectClause}
      ${fromClause}
      ${joinClauses}
      ${whereClause}
      ${groupByClause}
      ${havingClause}
      ${orderClause}
      ${limitClause}
      ${offsetClause}
    `.trim().replace(/\s+/g, ' ');
    
    return { query, params: whereParams };
  }

  /**
   * Count records with optional filtering
   */
  async count(where: Record<string, any> = {}): Promise<number> {
    const whereConditions = Object.entries(where)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([field]) => `${field} = ?`);
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const whereParams = Object.entries(where)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([_, value]) => value);
    
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const [result] = await this.executeQuery<RowDataPacket>(query, whereParams);
    
    return result.count || 0;
  }

  /**
   * Check if a record exists
   */
  async exists(id: number | string): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
    const rows = await this.executeQuery(query, [id]);
    return rows.length > 0;
  }
}