/**
 * Query Optimizer for BlindsCommerce
 * Provides utilities for optimizing database queries and detecting performance issues
 */

import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface QueryAnalysis {
  query: string;
  executionTime: number;
  rowsExamined: number;
  rowsReturned: number;
  usingIndex: boolean;
  queryType: string;
  possibleKeys: string[];
  actualKey: string | null;
  recommendations: string[];
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  estimatedImprovement: string;
}

export class QueryOptimizer {
  /**
   * Analyze a query using EXPLAIN
   */
  static async analyzeQuery(query: string, params: any[] = []): Promise<QueryAnalysis> {
    const pool = await getPool();
    const startTime = Date.now();
    
    try {
      // Get EXPLAIN output
      const [explainRows] = await pool.execute<RowDataPacket[]>(
        `EXPLAIN ${query}`,
        params
      );
      
      // Execute actual query to get timing
      const [actualRows] = await pool.execute<RowDataPacket[]>(query, params);
      const executionTime = Date.now() - startTime;
      
      // Analyze EXPLAIN results
      const analysis = this.parseExplainResults(explainRows);
      
      return {
        query,
        executionTime,
        rowsExamined: analysis.rowsExamined,
        rowsReturned: actualRows.length,
        usingIndex: analysis.usingIndex,
        queryType: analysis.queryType,
        possibleKeys: analysis.possibleKeys,
        actualKey: analysis.actualKey,
        recommendations: this.generateRecommendations(analysis, executionTime)
      };
    } catch (error) {
      throw new Error(`Query analysis failed: ${error}`);
    }
  }

  /**
   * Parse EXPLAIN results
   */
  private static parseExplainResults(explainRows: RowDataPacket[]): any {
    let rowsExamined = 0;
    let usingIndex = true;
    let queryType = '';
    const possibleKeys: string[] = [];
    let actualKey: string | null = null;

    explainRows.forEach(row => {
      rowsExamined += parseInt(row.rows || 0);
      
      if (row.type === 'ALL' || row.type === 'index') {
        usingIndex = false;
      }
      
      queryType = row.type || queryType;
      
      if (row.possible_keys) {
        possibleKeys.push(...row.possible_keys.split(','));
      }
      
      if (row.key) {
        actualKey = row.key;
      }
    });

    return {
      rowsExamined,
      usingIndex,
      queryType,
      possibleKeys: [...new Set(possibleKeys)],
      actualKey
    };
  }

  /**
   * Generate optimization recommendations
   */
  private static generateRecommendations(analysis: any, executionTime: number): string[] {
    const recommendations: string[] = [];

    if (!analysis.usingIndex) {
      recommendations.push('Query is not using an index effectively. Consider adding an index.');
    }

    if (analysis.queryType === 'ALL') {
      recommendations.push('Full table scan detected. This can be very slow on large tables.');
    }

    if (analysis.rowsExamined > 1000 && analysis.rowsExamined > analysis.rowsReturned * 10) {
      recommendations.push('Query examines many more rows than it returns. Consider adding a more selective index.');
    }

    if (executionTime > 100) {
      recommendations.push(`Query took ${executionTime}ms. Consider optimization for better performance.`);
    }

    if (analysis.possibleKeys.length > 3) {
      recommendations.push('Multiple possible indexes detected. Consider consolidating indexes.');
    }

    return recommendations;
  }

  /**
   * Detect N+1 queries
   */
  static detectNPlusOneQueries(queries: string[]): Array<{
    pattern: string;
    count: number;
    recommendation: string;
  }> {
    const patterns = new Map<string, number>();
    
    queries.forEach(query => {
      // Normalize query by removing specific IDs
      const normalized = query
        .replace(/\b\d+\b/g, '?')
        .replace(/\s+/g, ' ')
        .trim();
      
      patterns.set(normalized, (patterns.get(normalized) || 0) + 1);
    });

    const nPlusOnePatterns: Array<{
      pattern: string;
      count: number;
      recommendation: string;
    }> = [];

    patterns.forEach((count, pattern) => {
      if (count > 5 && pattern.includes('WHERE') && pattern.includes('= ?')) {
        nPlusOnePatterns.push({
          pattern,
          count,
          recommendation: 'Consider using a JOIN or IN clause to fetch all data in one query.'
        });
      }
    });

    return nPlusOnePatterns;
  }

  /**
   * Recommend indexes based on query patterns
   */
  static async recommendIndexes(
    tableName: string,
    whereColumns: string[],
    orderByColumns: string[] = []
  ): Promise<IndexRecommendation[]> {
    const pool = await getPool();
    const recommendations: IndexRecommendation[] = [];

    try {
      // Get existing indexes
      const [indexes] = await pool.execute<RowDataPacket[]>(
        'SHOW INDEX FROM ??',
        [tableName]
      );

      const existingIndexes = new Set(
        indexes.map(idx => idx.Column_name).filter(Boolean)
      );

      // Check WHERE columns
      whereColumns.forEach(column => {
        if (!existingIndexes.has(column)) {
          recommendations.push({
            table: tableName,
            columns: [column],
            reason: `Column '${column}' is used in WHERE clause but has no index`,
            estimatedImprovement: 'Could reduce query time by 50-90%'
          });
        }
      });

      // Check ORDER BY columns
      if (orderByColumns.length > 0) {
        const orderByKey = orderByColumns.join(',');
        const hasCompositeIndex = indexes.some(idx => 
          idx.Key_name === orderByKey
        );

        if (!hasCompositeIndex) {
          recommendations.push({
            table: tableName,
            columns: orderByColumns,
            reason: 'ORDER BY columns could benefit from a composite index',
            estimatedImprovement: 'Could eliminate filesort operation'
          });
        }
      }

      // Check for covering index opportunity
      if (whereColumns.length > 0 && orderByColumns.length > 0) {
        const coveringColumns = [...whereColumns, ...orderByColumns];
        recommendations.push({
          table: tableName,
          columns: coveringColumns,
          reason: 'Covering index could satisfy query without accessing table data',
          estimatedImprovement: 'Could reduce I/O by 70-95%'
        });
      }

    } catch (error) {
      console.error('Index recommendation failed:', error);
    }

    return recommendations;
  }

  /**
   * Batch multiple similar queries using UNION
   */
  static createBatchQuery(
    baseQuery: string,
    conditions: Array<{ column: string; values: any[] }>
  ): { query: string; params: any[] } {
    if (conditions.length === 0 || conditions[0].values.length === 0) {
      return { query: baseQuery, params: [] };
    }

    const queries: string[] = [];
    const params: any[] = [];

    conditions[0].values.forEach(value => {
      const queryWithPlaceholder = baseQuery.replace(
        `WHERE ${conditions[0].column} = ?`,
        `WHERE ${conditions[0].column} = ?`
      );
      queries.push(`(${queryWithPlaceholder})`);
      params.push(value);
    });

    const batchQuery = queries.join(' UNION ALL ');
    
    return { query: batchQuery, params };
  }

  /**
   * Convert multiple queries to a single JOIN query
   */
  static convertToJoinQuery(options: {
    mainTable: string;
    mainColumns: string[];
    joins: Array<{
      table: string;
      columns: string[];
      condition: string;
    }>;
    where?: string;
    orderBy?: string;
    limit?: number;
  }): string {
    const {
      mainTable,
      mainColumns,
      joins,
      where,
      orderBy,
      limit
    } = options;

    // Build SELECT clause
    const selectColumns: string[] = [
      ...mainColumns.map(col => `${mainTable}.${col}`)
    ];

    joins.forEach(join => {
      selectColumns.push(
        ...join.columns.map(col => `${join.table}.${col} as ${join.table}_${col}`)
      );
    });

    // Build JOIN clauses
    const joinClauses = joins.map(join => 
      `LEFT JOIN ${join.table} ON ${join.condition}`
    ).join('\n');

    // Build complete query
    let query = `
      SELECT ${selectColumns.join(', ')}
      FROM ${mainTable}
      ${joinClauses}
    `;

    if (where) {
      query += `\nWHERE ${where}`;
    }

    if (orderBy) {
      query += `\nORDER BY ${orderBy}`;
    }

    if (limit) {
      query += `\nLIMIT ${limit}`;
    }

    return query.trim();
  }

  /**
   * Optimize pagination queries
   */
  static optimizePagination(options: {
    table: string;
    columns: string[];
    where?: string;
    orderBy: string;
    limit: number;
    offset: number;
    lastKnownId?: number;
  }): { query: string; params: any[] } {
    const {
      table,
      columns,
      where,
      orderBy,
      limit,
      offset,
      lastKnownId
    } = options;

    // Use cursor-based pagination if possible
    if (lastKnownId && orderBy.includes('id')) {
      const query = `
        SELECT ${columns.join(', ')}
        FROM ${table}
        WHERE ${where ? `${where} AND` : ''} id > ?
        ORDER BY ${orderBy}
        LIMIT ${limit}
      `;
      
      return { query: query.trim(), params: [lastKnownId] };
    }

    // Use deferred join for large offsets
    if (offset > 1000) {
      const query = `
        SELECT ${columns.join(', ')}
        FROM ${table}
        INNER JOIN (
          SELECT id
          FROM ${table}
          ${where ? `WHERE ${where}` : ''}
          ORDER BY ${orderBy}
          LIMIT ${limit} OFFSET ${offset}
        ) AS tmp USING(id)
        ORDER BY ${orderBy}
      `;
      
      return { query: query.trim(), params: [] };
    }

    // Standard pagination for small offsets
    const query = `
      SELECT ${columns.join(', ')}
      FROM ${table}
      ${where ? `WHERE ${where}` : ''}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return { query: query.trim(), params: [] };
  }

  /**
   * Create optimized bulk insert
   */
  static createBulkInsert(
    table: string,
    columns: string[],
    rows: any[][],
    updateOnDuplicate?: string[]
  ): { query: string; params: any[] } {
    if (rows.length === 0) {
      throw new Error('No rows to insert');
    }

    const placeholders = rows.map(() => 
      `(${columns.map(() => '?').join(', ')})`
    ).join(', ');

    let query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
    `;

    if (updateOnDuplicate && updateOnDuplicate.length > 0) {
      const updates = updateOnDuplicate.map(col => 
        `${col} = VALUES(${col})`
      ).join(', ');
      
      query += `\nON DUPLICATE KEY UPDATE ${updates}`;
    }

    const params = rows.flat();
    
    return { query: query.trim(), params };
  }
}