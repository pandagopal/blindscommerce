/**
 * Performance Monitoring for API Consolidation
 * Measures and tracks performance improvements from consolidated endpoints
 */

import { getPool } from '@/lib/db';
import { CachePerformanceMonitor } from '@/lib/api/caching';
import { MigrationTracker } from '@/lib/api/migration';
import { logWarning } from '@/lib/errorHandling';

// Performance metrics interface
export interface PerformanceSnapshot {
  timestamp: string;
  endpoint: string;
  
  // Response metrics
  responseTime: number;
  statusCode: number;
  payloadSize: number;
  
  // Database metrics
  dbConnections: {
    active: number;
    total: number;
    poolSize: number;
  };
  
  // Cache metrics
  cache: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    memoryUsageMB: number;
  };
  
  // System metrics
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
  
  // Request context
  userAgent?: string;
  ipAddress?: string;
  userId?: number;
}

// Performance comparison result
export interface PerformanceComparison {
  endpoint: string;
  improvement: {
    responseTime: {
      before: number;
      after: number;
      improvement: number; // percentage
    };
    dbConnections: {
      before: number;
      after: number;
      reduction: number; // percentage
    };
    cacheHitRate: {
      before: number;
      after: number;
      improvement: number; // percentage points
    };
    payloadEfficiency: {
      before: number;
      after: number;
      improvement: number; // percentage
    };
  };
  summary: {
    overallScore: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  };
}

// Performance monitor class
export class PerformanceMonitor {
  private static snapshots = new Map<string, PerformanceSnapshot[]>();
  private static maxSnapshotsPerEndpoint = 100;

  // Record performance snapshot
  static recordSnapshot(snapshot: PerformanceSnapshot): void {
    const key = snapshot.endpoint;
    
    if (!this.snapshots.has(key)) {
      this.snapshots.set(key, []);
    }
    
    const snapshots = this.snapshots.get(key)!;
    snapshots.push(snapshot);
    
    // Keep only recent snapshots
    if (snapshots.length > this.maxSnapshotsPerEndpoint) {
      snapshots.shift();
    }
  }

  // Create performance snapshot for an endpoint
  static async createSnapshot(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    payloadSize: number,
    context?: {
      userAgent?: string;
      ipAddress?: string;
      userId?: number;
    }
  ): Promise<PerformanceSnapshot> {
    
    const snapshot: PerformanceSnapshot = {
      timestamp: new Date().toISOString(),
      endpoint,
      responseTime,
      statusCode,
      payloadSize,
      
      dbConnections: await this.getDbConnectionInfo(),
      cache: await this.getCacheInfo(),
      system: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage?.()
      },
      
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      userId: context?.userId
    };

    this.recordSnapshot(snapshot);
    return snapshot;
  }

  // Get performance statistics for an endpoint
  static getEndpointStats(endpoint: string): {
    count: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    avgDbConnections: number;
    avgCacheHitRate: number;
    errorRate: number;
    recent: PerformanceSnapshot[];
  } | null {
    
    const snapshots = this.snapshots.get(endpoint);
    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    const responseTimes = snapshots.map(s => s.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    
    const errors = snapshots.filter(s => s.statusCode >= 400).length;
    const errorRate = (errors / snapshots.length) * 100;

    return {
      count: snapshots.length,
      avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[p95Index] || responseTimes[responseTimes.length - 1],
      avgDbConnections: snapshots.reduce((sum, s) => sum + s.dbConnections.active, 0) / snapshots.length,
      avgCacheHitRate: snapshots.reduce((sum, s) => sum + s.cache.hitRate, 0) / snapshots.length,
      errorRate,
      recent: snapshots.slice(-10) // Last 10 snapshots
    };
  }

  // Compare consolidated vs old endpoint performance
  static compareEndpoints(
    consolidatedEndpoint: string,
    oldEndpoints: string[]
  ): PerformanceComparison | null {
    
    const consolidatedStats = this.getEndpointStats(consolidatedEndpoint);
    if (!consolidatedStats) {
      return null;
    }

    // Aggregate old endpoint stats
    let totalOldSnapshots = 0;
    let totalOldResponseTime = 0;
    let totalOldDbConnections = 0;
    let totalOldCacheHitRate = 0;
    let totalOldPayloadSize = 0;

    for (const oldEndpoint of oldEndpoints) {
      const oldStats = this.getEndpointStats(oldEndpoint);
      if (oldStats) {
        totalOldSnapshots += oldStats.count;
        totalOldResponseTime += oldStats.avgResponseTime * oldStats.count;
        totalOldDbConnections += oldStats.avgDbConnections * oldStats.count;
        totalOldCacheHitRate += oldStats.avgCacheHitRate * oldStats.count;
        
        const oldSnapshots = this.snapshots.get(oldEndpoint) || [];
        totalOldPayloadSize += oldSnapshots.reduce((sum, s) => sum + s.payloadSize, 0);
      }
    }

    if (totalOldSnapshots === 0) {
      return null;
    }

    const avgOldResponseTime = totalOldResponseTime / totalOldSnapshots;
    const avgOldDbConnections = totalOldDbConnections / totalOldSnapshots;
    const avgOldCacheHitRate = totalOldCacheHitRate / totalOldSnapshots;
    const avgOldPayloadSize = totalOldPayloadSize / totalOldSnapshots;

    const consolidatedSnapshots = this.snapshots.get(consolidatedEndpoint) || [];
    const avgNewPayloadSize = consolidatedSnapshots.reduce((sum, s) => sum + s.payloadSize, 0) / consolidatedSnapshots.length;

    // Calculate improvements
    const responseTimeImprovement = ((avgOldResponseTime - consolidatedStats.avgResponseTime) / avgOldResponseTime) * 100;
    const dbConnectionReduction = ((avgOldDbConnections - consolidatedStats.avgDbConnections) / avgOldDbConnections) * 100;
    const cacheHitRateImprovement = consolidatedStats.avgCacheHitRate - avgOldCacheHitRate;
    const payloadEfficiencyImprovement = ((avgOldPayloadSize - avgNewPayloadSize) / avgOldPayloadSize) * 100;

    // Calculate overall score
    const scores = [
      Math.max(0, Math.min(100, responseTimeImprovement)),
      Math.max(0, Math.min(100, dbConnectionReduction)),
      Math.max(0, Math.min(100, cacheHitRateImprovement * 2)), // Weight cache improvements
      Math.max(0, Math.min(100, payloadEfficiencyImprovement))
    ];
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Generate recommendations
    const recommendations: string[] = [];
    if (responseTimeImprovement < 10) {
      recommendations.push('Consider further optimization of database queries');
    }
    if (dbConnectionReduction < 20) {
      recommendations.push('Review connection pooling and query optimization');
    }
    if (cacheHitRateImprovement < 10) {
      recommendations.push('Improve caching strategy and TTL settings');
    }
    if (consolidatedStats.errorRate > 5) {
      recommendations.push('Address error rate - currently above 5%');
    }

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallScore >= 80) status = 'excellent';
    else if (overallScore >= 60) status = 'good';
    else if (overallScore >= 40) status = 'fair';
    else status = 'poor';

    return {
      endpoint: consolidatedEndpoint,
      improvement: {
        responseTime: {
          before: avgOldResponseTime,
          after: consolidatedStats.avgResponseTime,
          improvement: responseTimeImprovement
        },
        dbConnections: {
          before: avgOldDbConnections,
          after: consolidatedStats.avgDbConnections,
          reduction: dbConnectionReduction
        },
        cacheHitRate: {
          before: avgOldCacheHitRate,
          after: consolidatedStats.avgCacheHitRate,
          improvement: cacheHitRateImprovement
        },
        payloadEfficiency: {
          before: avgOldPayloadSize,
          after: avgNewPayloadSize,
          improvement: payloadEfficiencyImprovement
        }
      },
      summary: {
        overallScore: Math.round(overallScore),
        status,
        recommendations
      }
    };
  }

  // Get system-wide performance report
  static getSystemReport(): {
    overview: {
      totalEndpoints: number;
      totalRequests: number;
      avgSystemResponseTime: number;
      systemHealthScore: number;
    };
    consolidation: {
      migrationProgress: any;
      performanceGains: PerformanceComparison[];
      topPerformers: string[];
      needsAttention: string[];
    };
    recommendations: string[];
  } {
    
    const allEndpoints = Array.from(this.snapshots.keys());
    const totalRequests = Array.from(this.snapshots.values())
      .reduce((sum, snapshots) => sum + snapshots.length, 0);

    let totalResponseTime = 0;
    let totalSnapshots = 0;

    for (const snapshots of this.snapshots.values()) {
      for (const snapshot of snapshots) {
        totalResponseTime += snapshot.responseTime;
        totalSnapshots++;
      }
    }

    const avgSystemResponseTime = totalSnapshots > 0 ? totalResponseTime / totalSnapshots : 0;

    // Get migration progress
    const migrationProgress = MigrationTracker.getProgressSummary();

    // Get performance comparisons for completed migrations
    const performanceGains: PerformanceComparison[] = [];
    const completedMigrations = MigrationTracker.getMigrationsByStatus('completed' as any);
    
    for (const migration of completedMigrations) {
      const comparison = this.compareEndpoints(migration.consolidatedEndpoint, migration.oldEndpoints);
      if (comparison) {
        performanceGains.push(comparison);
      }
    }

    // Identify top performers and those needing attention
    const topPerformers = performanceGains
      .filter(p => p.summary.overallScore >= 80)
      .map(p => p.endpoint);

    const needsAttention = performanceGains
      .filter(p => p.summary.overallScore < 60)
      .map(p => p.endpoint);

    // Calculate system health score
    const healthFactors = [
      Math.min(100, (migrationProgress.completionRate || 0)),
      Math.max(0, 100 - (avgSystemResponseTime / 10)), // Penalize high response times
      Math.min(100, (performanceGains.length * 20)), // Reward performance improvements
      Math.max(0, 100 - (needsAttention.length * 20)) // Penalize endpoints needing attention
    ];
    const systemHealthScore = healthFactors.reduce((sum, score) => sum + score, 0) / healthFactors.length;

    // Generate system recommendations
    const recommendations: string[] = [];
    if (migrationProgress.completionRate < 80) {
      recommendations.push('Accelerate API consolidation migration progress');
    }
    if (avgSystemResponseTime > 500) {
      recommendations.push('Focus on reducing system-wide response times');
    }
    if (needsAttention.length > 0) {
      recommendations.push(`Review and optimize ${needsAttention.length} underperforming endpoints`);
    }
    if (topPerformers.length === 0) {
      recommendations.push('No high-performing consolidated endpoints yet - review consolidation strategy');
    }

    return {
      overview: {
        totalEndpoints: allEndpoints.length,
        totalRequests,
        avgSystemResponseTime: Math.round(avgSystemResponseTime),
        systemHealthScore: Math.round(systemHealthScore)
      },
      consolidation: {
        migrationProgress,
        performanceGains,
        topPerformers,
        needsAttention
      },
      recommendations
    };
  }

  // Clear old snapshots (for memory management)
  static cleanup(olderThanHours: number = 24): number {
    let deletedCount = 0;
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));

    for (const [endpoint, snapshots] of this.snapshots.entries()) {
      const originalLength = snapshots.length;
      const filtered = snapshots.filter(snapshot => 
        new Date(snapshot.timestamp) > cutoffTime
      );
      
      if (filtered.length !== originalLength) {
        this.snapshots.set(endpoint, filtered);
        deletedCount += (originalLength - filtered.length);
      }
    }

    return deletedCount;
  }

  // Export performance data
  static exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      systemReport: this.getSystemReport(),
      endpointStats: Object.fromEntries(
        Array.from(this.snapshots.keys()).map(endpoint => [
          endpoint,
          this.getEndpointStats(endpoint)
        ])
      ),
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const lines = ['Endpoint,Requests,Avg Response Time,P95 Response Time,Avg DB Connections,Cache Hit Rate,Error Rate'];
      
      for (const [endpoint, stats] of Object.entries(data.endpointStats)) {
        if (stats) {
          lines.push([
            endpoint,
            stats.count,
            Math.round(stats.avgResponseTime),
            Math.round(stats.p95ResponseTime),
            Math.round(stats.avgDbConnections),
            Math.round(stats.avgCacheHitRate),
            Math.round(stats.errorRate)
          ].join(','));
        }
      }
      
      return lines.join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  // Private helper methods
  private static async getDbConnectionInfo(): Promise<{
    active: number;
    total: number;
    poolSize: number;
  }> {
    try {
      const pool = await getPool();
      const [rows] = await pool.execute('SHOW STATUS LIKE "Threads_connected"');
      const activeConnections = parseInt((rows as any)[0]?.Value || '0');
      
      return {
        active: activeConnections,
        total: activeConnections, // Simplified
        poolSize: 10 // From our pool configuration
      };
    } catch (error) {
      logWarning('Failed to get DB connection info', { error });
      return { active: 0, total: 0, poolSize: 10 };
    }
  }

  private static async getCacheInfo(): Promise<{
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    memoryUsageMB: number;
  }> {
    try {
      const cacheStats = CachePerformanceMonitor.getOverallStats();
      
      return {
        hitRate: cacheStats.overall.hitRate,
        totalHits: cacheStats.overall.totalHits,
        totalMisses: cacheStats.overall.totalMisses,
        memoryUsageMB: cacheStats.overall.totalMemoryMB
      };
    } catch (error) {
      logWarning('Failed to get cache info', { error });
      return { hitRate: 0, totalHits: 0, totalMisses: 0, memoryUsageMB: 0 };
    }
  }
}

// Performance middleware for automatic monitoring
export function createPerformanceMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const payloadSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
      
      // Record performance snapshot
      PerformanceMonitor.createSnapshot(
        req.url,
        responseTime,
        res.statusCode,
        payloadSize,
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          userId: req.user?.id
        }
      ).catch(error => {
        logWarning('Failed to record performance snapshot', { error });
      });

      return originalSend.call(this, data);
    };

    next();
  };
}