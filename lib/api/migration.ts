/**
 * Migration Tracking System for API Consolidation
 * Tracks progress, performance improvements, and backwards compatibility
 */

import { db } from '@/lib/db';
import { logError, logWarning } from '@/lib/errorHandling';

// Migration status types
export enum MigrationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DEPRECATED = 'deprecated',
  ROLLBACK = 'rollback'
}

// Performance metrics for comparison
export interface PerformanceMetrics {
  avgResponseTime: number;     // in milliseconds
  dbConnections: number;       // average connections used
  cacheHitRate: number;       // percentage (0-100)
  errorRate: number;          // percentage (0-100)
  throughput: number;         // requests per second
  memoryUsage: number;        // in MB
  cpuUsage: number;          // percentage (0-100)
}

// Migration tracking record
export interface Migration {
  id: string;
  consolidatedEndpoint: string;
  oldEndpoints: string[];
  status: MigrationStatus;
  startDate: string;
  completionDate?: string;
  rollbackDate?: string;
  
  // Performance comparison
  beforeMetrics?: PerformanceMetrics;
  afterMetrics?: PerformanceMetrics;
  
  // Migration details
  description: string;
  expectedBenefits: string[];
  actualBenefits: string[];
  issues: string[];
  
  // Compatibility
  backwardsCompatible: boolean;
  deprecationDate?: string;
  removalDate?: string;
  
  // Usage statistics
  oldEndpointUsage: Record<string, number>; // requests per day
  newEndpointUsage: number;
  
  // Team tracking
  assignedTo: string;
  reviewedBy?: string;
  approvedBy?: string;
  
  metadata: {
    version: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'simple' | 'moderate' | 'complex';
    riskLevel: 'low' | 'medium' | 'high';
  };
}

// Migration tracker class
export class MigrationTracker {
  private static migrations = new Map<string, Migration>();
  private static initialized = false;

  // Initialize the migration tracker
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create migration tracking table if it doesn't exist
      await this.createMigrationTable();
      
      // Load existing migrations from database
      await this.loadMigrationsFromDatabase();
      
      // Register default migrations
      this.registerDefaultMigrations();
      
      this.initialized = true;
    } catch (error) {
      logError(error as Error, { context: 'MigrationTracker.initialize' });
    }
  }

  // Register a new migration
  static registerMigration(migration: Partial<Migration> & { 
    id: string; 
    consolidatedEndpoint: string; 
    oldEndpoints: string[] 
  }): void {
    const fullMigration: Migration = {
      status: MigrationStatus.PENDING,
      startDate: new Date().toISOString(),
      description: '',
      expectedBenefits: [],
      actualBenefits: [],
      issues: [],
      backwardsCompatible: true,
      oldEndpointUsage: {},
      newEndpointUsage: 0,
      assignedTo: 'system',
      metadata: {
        version: '1.0',
        tags: [],
        priority: 'medium',
        complexity: 'moderate',
        riskLevel: 'medium'
      },
      ...migration
    };

    this.migrations.set(migration.id, fullMigration);
    this.saveMigrationToDatabase(fullMigration);
  }

  // Update migration status
  static updateStatus(
    migrationId: string, 
    status: MigrationStatus, 
    additionalData?: Partial<Migration>
  ): boolean {
    const migration = this.migrations.get(migrationId);
    if (!migration) return false;

    migration.status = status;
    
    if (status === MigrationStatus.COMPLETED) {
      migration.completionDate = new Date().toISOString();
    } else if (status === MigrationStatus.ROLLBACK) {
      migration.rollbackDate = new Date().toISOString();
    }

    if (additionalData) {
      Object.assign(migration, additionalData);
    }

    this.migrations.set(migrationId, migration);
    this.saveMigrationToDatabase(migration);
    
    return true;
  }

  // Record performance metrics
  static recordPerformanceMetrics(
    migrationId: string, 
    metrics: PerformanceMetrics, 
    phase: 'before' | 'after'
  ): void {
    const migration = this.migrations.get(migrationId);
    if (!migration) return;

    if (phase === 'before') {
      migration.beforeMetrics = metrics;
    } else {
      migration.afterMetrics = metrics;
      
      // Calculate actual benefits
      if (migration.beforeMetrics) {
        migration.actualBenefits = this.calculateBenefits(migration.beforeMetrics, metrics);
      }
    }

    this.migrations.set(migrationId, migration);
    this.saveMigrationToDatabase(migration);
  }

  // Track endpoint usage
  static recordEndpointUsage(endpoint: string, requestCount: number): void {
    for (const migration of this.migrations.values()) {
      // Check if it's an old endpoint
      if (migration.oldEndpoints.includes(endpoint)) {
        migration.oldEndpointUsage[endpoint] = requestCount;
        this.saveMigrationToDatabase(migration);
      }
      
      // Check if it's the new consolidated endpoint
      if (migration.consolidatedEndpoint === endpoint) {
        migration.newEndpointUsage = requestCount;
        this.saveMigrationToDatabase(migration);
      }
    }
  }

  // Get migration progress summary
  static getProgressSummary(): {
    totalMigrations: number;
    byStatus: Record<MigrationStatus, number>;
    completionRate: number;
    performanceGains: {
      avgResponseTimeImprovement: number;
      dbConnectionReduction: number;
      cacheHitRateImprovement: number;
    };
    timeline: Array<{ date: string; event: string; migration: string }>;
  } {
    const migrations = Array.from(this.migrations.values());
    const total = migrations.length;
    
    const byStatus = migrations.reduce((acc, migration) => {
      acc[migration.status] = (acc[migration.status] || 0) + 1;
      return acc;
    }, {} as Record<MigrationStatus, number>);

    const completed = byStatus[MigrationStatus.COMPLETED] || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate performance gains
    const completedMigrations = migrations.filter(m => 
      m.status === MigrationStatus.COMPLETED && 
      m.beforeMetrics && 
      m.afterMetrics
    );

    let totalResponseTimeImprovement = 0;
    let totalDbConnectionReduction = 0;
    let totalCacheHitRateImprovement = 0;

    completedMigrations.forEach(migration => {
      const before = migration.beforeMetrics!;
      const after = migration.afterMetrics!;
      
      totalResponseTimeImprovement += ((before.avgResponseTime - after.avgResponseTime) / before.avgResponseTime) * 100;
      totalDbConnectionReduction += ((before.dbConnections - after.dbConnections) / before.dbConnections) * 100;
      totalCacheHitRateImprovement += after.cacheHitRate - before.cacheHitRate;
    });

    const count = completedMigrations.length;
    const performanceGains = {
      avgResponseTimeImprovement: count > 0 ? Math.round(totalResponseTimeImprovement / count) : 0,
      dbConnectionReduction: count > 0 ? Math.round(totalDbConnectionReduction / count) : 0,
      cacheHitRateImprovement: count > 0 ? Math.round(totalCacheHitRateImprovement / count) : 0
    };

    // Create timeline
    const timeline = migrations
      .filter(m => m.completionDate)
      .map(m => ({
        date: m.completionDate!,
        event: 'Migration Completed',
        migration: m.consolidatedEndpoint
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Last 10 events

    return {
      totalMigrations: total,
      byStatus,
      completionRate,
      performanceGains,
      timeline
    };
  }

  // Get detailed migration report
  static getMigrationReport(migrationId: string): Migration | null {
    return this.migrations.get(migrationId) || null;
  }

  // Get all migrations
  static getAllMigrations(): Migration[] {
    return Array.from(this.migrations.values());
  }

  // Get migrations by status
  static getMigrationsByStatus(status: MigrationStatus): Migration[] {
    return Array.from(this.migrations.values()).filter(m => m.status === status);
  }

  // Check if endpoint is deprecated
  static isEndpointDeprecated(endpoint: string): boolean {
    for (const migration of this.migrations.values()) {
      if (migration.oldEndpoints.includes(endpoint) && 
          migration.status === MigrationStatus.DEPRECATED) {
        return true;
      }
    }
    return false;
  }

  // Get deprecation info for endpoint
  static getDeprecationInfo(endpoint: string): {
    deprecated: boolean;
    migrationId?: string;
    newEndpoint?: string;
    deprecationDate?: string;
    removalDate?: string;
  } {
    for (const migration of this.migrations.values()) {
      if (migration.oldEndpoints.includes(endpoint)) {
        return {
          deprecated: migration.status === MigrationStatus.DEPRECATED,
          migrationId: migration.id,
          newEndpoint: migration.consolidatedEndpoint,
          deprecationDate: migration.deprecationDate,
          removalDate: migration.removalDate
        };
      }
    }
    
    return { deprecated: false };
  }

  // Performance monitoring for consolidated endpoints
  static async monitorPerformance(): Promise<void> {
    const activeMigrations = this.getMigrationsByStatus(MigrationStatus.IN_PROGRESS)
      .concat(this.getMigrationsByStatus(MigrationStatus.COMPLETED));

    for (const migration of activeMigrations) {
      try {
        const metrics = await this.collectPerformanceMetrics(migration.consolidatedEndpoint);
        
        if (migration.status === MigrationStatus.COMPLETED) {
          // Update after metrics for completed migrations
          this.recordPerformanceMetrics(migration.id, metrics, 'after');
        }
        
        // Check for performance degradation
        if (migration.afterMetrics && metrics.avgResponseTime > migration.afterMetrics.avgResponseTime * 1.5) {
          logWarning('Performance degradation detected', {
            migrationId: migration.id,
            endpoint: migration.consolidatedEndpoint,
            previousResponseTime: migration.afterMetrics.avgResponseTime,
            currentResponseTime: metrics.avgResponseTime
          });
        }
        
      } catch (error) {
        logError(error as Error, { 
          context: 'Migration performance monitoring',
          migrationId: migration.id 
        });
      }
    }
  }

  // Private helper methods
  private static calculateBenefits(before: PerformanceMetrics, after: PerformanceMetrics): string[] {
    const benefits: string[] = [];
    
    const responseTimeImprovement = ((before.avgResponseTime - after.avgResponseTime) / before.avgResponseTime) * 100;
    if (responseTimeImprovement > 5) {
      benefits.push(`${Math.round(responseTimeImprovement)}% faster response time`);
    }
    
    const dbConnectionReduction = ((before.dbConnections - after.dbConnections) / before.dbConnections) * 100;
    if (dbConnectionReduction > 5) {
      benefits.push(`${Math.round(dbConnectionReduction)}% fewer database connections`);
    }
    
    const cacheImprovement = after.cacheHitRate - before.cacheHitRate;
    if (cacheImprovement > 5) {
      benefits.push(`${Math.round(cacheImprovement)}% better cache hit rate`);
    }
    
    const errorReduction = before.errorRate - after.errorRate;
    if (errorReduction > 1) {
      benefits.push(`${Math.round(errorReduction)}% fewer errors`);
    }
    
    return benefits;
  }

  private static async collectPerformanceMetrics(endpoint: string): Promise<PerformanceMetrics> {
    // This would integrate with actual monitoring systems
    // For now, return mock data
    return {
      avgResponseTime: Math.random() * 200 + 50,
      dbConnections: Math.random() * 10 + 5,
      cacheHitRate: Math.random() * 30 + 70,
      errorRate: Math.random() * 2,
      throughput: Math.random() * 100 + 50,
      memoryUsage: Math.random() * 50 + 25,
      cpuUsage: Math.random() * 30 + 10
    };
  }

  private static async createMigrationTable(): Promise<void> {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS api_migrations (
          id VARCHAR(255) PRIMARY KEY,
          consolidated_endpoint VARCHAR(500) NOT NULL,
          old_endpoints JSON NOT NULL,
          status ENUM('pending', 'in_progress', 'completed', 'deprecated', 'rollback') NOT NULL,
          start_date DATETIME NOT NULL,
          completion_date DATETIME NULL,
          rollback_date DATETIME NULL,
          before_metrics JSON NULL,
          after_metrics JSON NULL,
          description TEXT,
          expected_benefits JSON,
          actual_benefits JSON,
          issues JSON,
          backwards_compatible BOOLEAN DEFAULT TRUE,
          deprecation_date DATETIME NULL,
          removal_date DATETIME NULL,
          old_endpoint_usage JSON,
          new_endpoint_usage INT DEFAULT 0,
          assigned_to VARCHAR(255),
          reviewed_by VARCHAR(255) NULL,
          approved_by VARCHAR(255) NULL,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      logError(error as Error, { context: 'Creating migration table' });
    }
  }

  private static async loadMigrationsFromDatabase(): Promise<void> {
    try {
      const [rows] = await db.execute<any[]>('SELECT * FROM api_migrations');
      
      rows.forEach(row => {
        const migration: Migration = {
          id: row.id,
          consolidatedEndpoint: row.consolidated_endpoint,
          oldEndpoints: JSON.parse(row.old_endpoints),
          status: row.status as MigrationStatus,
          startDate: row.start_date,
          completionDate: row.completion_date,
          rollbackDate: row.rollback_date,
          beforeMetrics: row.before_metrics ? JSON.parse(row.before_metrics) : undefined,
          afterMetrics: row.after_metrics ? JSON.parse(row.after_metrics) : undefined,
          description: row.description || '',
          expectedBenefits: row.expected_benefits ? JSON.parse(row.expected_benefits) : [],
          actualBenefits: row.actual_benefits ? JSON.parse(row.actual_benefits) : [],
          issues: row.issues ? JSON.parse(row.issues) : [],
          backwardsCompatible: row.backwards_compatible,
          deprecationDate: row.deprecation_date,
          removalDate: row.removal_date,
          oldEndpointUsage: row.old_endpoint_usage ? JSON.parse(row.old_endpoint_usage) : {},
          newEndpointUsage: row.new_endpoint_usage || 0,
          assignedTo: row.assigned_to,
          reviewedBy: row.reviewed_by,
          approvedBy: row.approved_by,
          metadata: row.metadata ? JSON.parse(row.metadata) : {
            version: '1.0',
            tags: [],
            priority: 'medium',
            complexity: 'moderate',
            riskLevel: 'medium'
          }
        };
        
        this.migrations.set(migration.id, migration);
      });
    } catch (error) {
      logWarning('Failed to load migrations from database', { error });
    }
  }

  private static async saveMigrationToDatabase(migration: Migration): Promise<void> {
    try {
      await db.execute(`
        INSERT INTO api_migrations (
          id, consolidated_endpoint, old_endpoints, status, start_date,
          completion_date, rollback_date, before_metrics, after_metrics,
          description, expected_benefits, actual_benefits, issues,
          backwards_compatible, deprecation_date, removal_date,
          old_endpoint_usage, new_endpoint_usage, assigned_to,
          reviewed_by, approved_by, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          completion_date = VALUES(completion_date),
          rollback_date = VALUES(rollback_date),
          before_metrics = VALUES(before_metrics),
          after_metrics = VALUES(after_metrics),
          actual_benefits = VALUES(actual_benefits),
          issues = VALUES(issues),
          old_endpoint_usage = VALUES(old_endpoint_usage),
          new_endpoint_usage = VALUES(new_endpoint_usage),
          reviewed_by = VALUES(reviewed_by),
          approved_by = VALUES(approved_by),
          updated_at = CURRENT_TIMESTAMP
      `, [
        migration.id,
        migration.consolidatedEndpoint,
        JSON.stringify(migration.oldEndpoints),
        migration.status,
        migration.startDate,
        migration.completionDate,
        migration.rollbackDate,
        migration.beforeMetrics ? JSON.stringify(migration.beforeMetrics) : null,
        migration.afterMetrics ? JSON.stringify(migration.afterMetrics) : null,
        migration.description,
        JSON.stringify(migration.expectedBenefits),
        JSON.stringify(migration.actualBenefits),
        JSON.stringify(migration.issues),
        migration.backwardsCompatible,
        migration.deprecationDate,
        migration.removalDate,
        JSON.stringify(migration.oldEndpointUsage),
        migration.newEndpointUsage,
        migration.assignedTo,
        migration.reviewedBy,
        migration.approvedBy,
        JSON.stringify(migration.metadata)
      ]);
    } catch (error) {
      logError(error as Error, { context: 'Saving migration to database', migrationId: migration.id });
    }
  }

  private static registerDefaultMigrations(): void {
    // Register the planned API consolidations from the implementation plan
    
    // Admin Dashboard Consolidation
    this.registerMigration({
      id: 'admin-dashboard-consolidation',
      consolidatedEndpoint: '/api/admin/dashboard-consolidated',
      oldEndpoints: [
        '/api/admin/dashboard',
        '/api/admin/dashboard/stats',
        '/api/admin/dashboard/export'
      ],
      description: 'Consolidate admin dashboard endpoints into single comprehensive endpoint',
      expectedBenefits: [
        '85% reduction in database connections',
        '80% reduction in HTTP requests',
        'Improved dashboard load time'
      ],
      metadata: {
        version: '1.0',
        tags: ['admin', 'dashboard', 'phase1'],
        priority: 'high',
        complexity: 'moderate',
        riskLevel: 'low'
      }
    });

    // Cart API Consolidation
    this.registerMigration({
      id: 'cart-api-consolidation',
      consolidatedEndpoint: '/api/cart',
      oldEndpoints: [
        '/api/cart/enhanced/items/[id]/gift',
        '/api/cart/enhanced/items/[id]/installation',
        '/api/cart/enhanced/items/[id]/sample',
        '/api/cart/enhanced/items/[id]/save-for-later',
        '/api/cart/enhanced/items/[id]/quantity',
        '/api/cart/apply-coupon',
        '/api/cart/bulk',
        '/api/cart/recommendations'
      ],
      description: 'Consolidate 22 cart endpoints into single action-based API',
      expectedBenefits: [
        '90% reduction in API endpoints',
        'Simplified cart management',
        'Better error handling'
      ],
      metadata: {
        version: '1.0',
        tags: ['cart', 'customer', 'phase4'],
        priority: 'high',
        complexity: 'complex',
        riskLevel: 'medium'
      }
    });

    // Payment API Consolidation
    this.registerMigration({
      id: 'payment-api-consolidation',
      consolidatedEndpoint: '/api/payments/process',
      oldEndpoints: [
        '/api/payments/stripe/create-payment-intent',
        '/api/payments/paypal/create-order',
        '/api/payments/klarna/create-session',
        '/api/payments/affirm/create-checkout',
        '/api/payments/afterpay/create-checkout'
      ],
      description: 'Unify payment processing across all providers',
      expectedBenefits: [
        '73% reduction in payment endpoints',
        'Unified payment flow',
        'Better error handling'
      ],
      metadata: {
        version: '1.0',
        tags: ['payments', 'customer', 'phase4'],
        priority: 'critical',
        complexity: 'complex',
        riskLevel: 'high'
      }
    });
  }
}

// Initialize on import
MigrationTracker.initialize();