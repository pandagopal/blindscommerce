/**
 * Query Batcher for BlindsCommerce
 * Batches multiple database queries for optimal performance
 */

import { getPool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface BatchQuery {
  id: string;
  query: string;
  params: any[];
}

interface BatchResult<T = any> {
  id: string;
  data?: T;
  error?: Error;
}

export class QueryBatcher {
  private queries: BatchQuery[] = [];
  private results: Map<string, BatchResult> = new Map();

  /**
   * Add a query to the batch
   */
  add(id: string, query: string, params: any[] = []): this {
    this.queries.push({ id, query, params });
    return this;
  }

  /**
   * Execute all queries in parallel
   */
  async execute<T extends Record<string, any>>(): Promise<T> {
    if (this.queries.length === 0) {
      return {} as T;
    }

    const pool = await getPool();
    
    // Execute all queries in parallel
    const promises = this.queries.map(async ({ id, query, params }) => {
      try {
        const [rows] = await pool.execute<RowDataPacket[]>(query, params);
        return { id, data: rows, error: undefined };
      } catch (error) {
        return { id, data: undefined, error: error as Error };
      }
    });

    const results = await Promise.all(promises);
    
    // Map results by ID
    const resultMap = results.reduce((acc, result) => {
      acc[result.id] = result.error ? null : result.data;
      return acc;
    }, {} as Record<string, any>);

    // Clear batch
    this.queries = [];
    this.results.clear();

    return resultMap as T;
  }

  /**
   * Execute queries in transaction
   */
  async executeInTransaction<T extends Record<string, any>>(): Promise<{
    success: boolean;
    results?: T;
    error?: Error;
  }> {
    if (this.queries.length === 0) {
      return { success: true, results: {} as T };
    }

    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const results: Record<string, any> = {};

      for (const { id, query, params } of this.queries) {
        const [rows] = await connection.execute(query, params);
        results[id] = rows;
      }

      await connection.commit();

      // Clear batch
      this.queries = [];
      this.results.clear();

      return { success: true, results: results as T };

    } catch (error) {
      await connection.rollback();
      return { success: false, error: error as Error };
    } finally {
      connection.release();
    }
  }

  /**
   * Create a batch query for multiple IDs
   */
  static createBatchSelect(options: {
    table: string;
    columns: string[];
    idColumn: string;
    ids: Array<string | number>;
    additionalWhere?: string;
  }): { query: string; params: any[] } {
    const { table, columns, idColumn, ids, additionalWhere } = options;

    if (ids.length === 0) {
      return { query: '', params: [] };
    }

    const placeholders = ids.map(() => '?').join(',');
    let query = `
      SELECT ${columns.join(', ')}
      FROM ${table}
      WHERE ${idColumn} IN (${placeholders})
    `;

    if (additionalWhere) {
      query += ` AND ${additionalWhere}`;
    }

    return { query: query.trim(), params: ids };
  }

  /**
   * Create optimized JOIN query for related data
   */
  static createRelatedDataQuery(options: {
    primaryTable: string;
    primaryKey: string;
    relations: Array<{
      table: string;
      foreignKey: string;
      columns: string[];
      type?: 'one' | 'many';
    }>;
    where?: string;
    params?: any[];
  }): { query: string; params: any[] } {
    const { primaryTable, primaryKey, relations, where, params = [] } = options;

    // Build column selections
    const selections: string[] = [`${primaryTable}.*`];
    
    relations.forEach((rel, index) => {
      const alias = `r${index}`;
      selections.push(
        ...rel.columns.map(col => `${alias}.${col} as ${rel.table}_${col}`)
      );
    });

    // Build JOINs
    const joins = relations.map((rel, index) => {
      const alias = `r${index}`;
      return `LEFT JOIN ${rel.table} ${alias} ON ${primaryTable}.${primaryKey} = ${alias}.${rel.foreignKey}`;
    }).join('\n');

    let query = `
      SELECT ${selections.join(', ')}
      FROM ${primaryTable}
      ${joins}
    `;

    if (where) {
      query += `\nWHERE ${where}`;
    }

    return { query: query.trim(), params };
  }

  /**
   * Batch multiple COUNT queries
   */
  static async batchCount(
    counts: Array<{
      id: string;
      table: string;
      where?: string;
      params?: any[];
    }>
  ): Promise<Record<string, number>> {
    const batcher = new QueryBatcher();

    counts.forEach(({ id, table, where, params = [] }) => {
      const query = where 
        ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
        : `SELECT COUNT(*) as count FROM ${table}`;
      
      batcher.add(id, query, params);
    });

    const results = await batcher.execute();
    
    // Extract count values
    const countMap: Record<string, number> = {};
    
    Object.entries(results).forEach(([id, rows]) => {
      countMap[id] = rows?.[0]?.count || 0;
    });

    return countMap;
  }

  /**
   * Batch aggregate queries
   */
  static async batchAggregates(
    aggregates: Array<{
      id: string;
      table: string;
      column: string;
      operation: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';
      where?: string;
      params?: any[];
    }>
  ): Promise<Record<string, number>> {
    const batcher = new QueryBatcher();

    aggregates.forEach(({ id, table, column, operation, where, params = [] }) => {
      const query = where 
        ? `SELECT ${operation}(${column}) as result FROM ${table} WHERE ${where}`
        : `SELECT ${operation}(${column}) as result FROM ${table}`;
      
      batcher.add(id, query, params);
    });

    const results = await batcher.execute();
    
    // Extract aggregate values
    const aggregateMap: Record<string, number> = {};
    
    Object.entries(results).forEach(([id, rows]) => {
      aggregateMap[id] = parseFloat(rows?.[0]?.result || 0);
    });

    return aggregateMap;
  }

  /**
   * Create UNION query for similar queries
   */
  static createUnionQuery(
    queries: Array<{
      query: string;
      params: any[];
    }>,
    orderBy?: string,
    limit?: number
  ): { query: string; params: any[] } {
    if (queries.length === 0) {
      return { query: '', params: [] };
    }

    const unionParts = queries.map(q => `(${q.query})`).join('\nUNION ALL\n');
    let finalQuery = unionParts;

    if (orderBy) {
      finalQuery = `SELECT * FROM (\n${unionParts}\n) AS combined\nORDER BY ${orderBy}`;
    }

    if (limit) {
      finalQuery += `\nLIMIT ${limit}`;
    }

    const allParams = queries.flatMap(q => q.params);
    
    return { query: finalQuery, params: allParams };
  }

  /**
   * Optimize multiple UPDATE queries
   */
  static createBatchUpdate(
    table: string,
    updates: Array<{
      id: number | string;
      data: Record<string, any>;
    }>,
    idColumn: string = 'id'
  ): { query: string; params: any[] } {
    if (updates.length === 0) {
      return { query: '', params: [] };
    }

    // Group by common fields to update
    const updateGroups = new Map<string, Array<typeof updates[0]>>();
    
    updates.forEach(update => {
      const fields = Object.keys(update.data).sort().join(',');
      if (!updateGroups.has(fields)) {
        updateGroups.set(fields, []);
      }
      updateGroups.get(fields)!.push(update);
    });

    const queries: string[] = [];
    const params: any[] = [];

    // Create UPDATE for each group
    updateGroups.forEach((group, fields) => {
      const fieldArray = fields.split(',');
      const setClauses = fieldArray.map(field => {
        return `${field} = CASE ${idColumn} ${group.map(() => `WHEN ? THEN ?`).join(' ')} END`;
      }).join(', ');

      const ids = group.map(u => u.id);
      const idPlaceholders = ids.map(() => '?').join(',');

      const query = `
        UPDATE ${table}
        SET ${setClauses}
        WHERE ${idColumn} IN (${idPlaceholders})
      `;

      queries.push(query.trim());

      // Add parameters
      fieldArray.forEach(field => {
        group.forEach(update => {
          params.push(update.id, update.data[field]);
        });
      });
      
      params.push(...ids);
    });

    // Combine queries
    const finalQuery = queries.join(';\n');
    
    return { query: finalQuery, params };
  }
}