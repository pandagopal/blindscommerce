import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PerformanceMonitor } from '@/lib/api/performance';
import { MigrationTracker } from '@/lib/api/migration';
import { CachePerformanceMonitor } from '@/lib/api/caching';
import { APIErrorHandler } from '@/lib/api/errorHandling';

// Performance Dashboard API for monitoring API consolidation results
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Only allow admins to view performance data
    if (!user || user.role !== 'ADMIN') {
      return APIErrorHandler.createResponse(
        APIErrorHandler.createAuthenticationError('forbidden')
      );
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'summary';
    const endpoint = searchParams.get('endpoint');

    const response: any = {
      success: true,
      metadata: {
        timestamp: new Date().toISOString(),
        view,
        endpoint: '/api/admin/performance-dashboard'
      }
    };

    switch (view) {
      case 'detailed':
        // Detailed system report
        response.data = {
          systemReport: PerformanceMonitor.getSystemReport(),
          migrationProgress: MigrationTracker.getProgressSummary(),
          cacheStats: CachePerformanceMonitor.getOverallStats(),
          recommendations: CachePerformanceMonitor.getRecommendations()
        };
        break;

      case 'endpoint':
        // Specific endpoint performance
        if (!endpoint) {
          return APIErrorHandler.createResponse(
            APIErrorHandler.createValidationError('endpoint', 'Endpoint parameter required for endpoint view')
          );
        }
        
        const endpointStats = PerformanceMonitor.getEndpointStats(endpoint);
        if (!endpointStats) {
          return APIErrorHandler.createResponse(
            APIErrorHandler.createError(
              'RESOURCE_NOT_FOUND' as any,
              `No performance data found for endpoint: ${endpoint}`
            )
          );
        }

        response.data = {
          endpoint,
          stats: endpointStats,
          comparison: await getEndpointComparison(endpoint)
        };
        break;

      case 'migration':
        // Migration-specific performance data
        const completedMigrations = MigrationTracker.getMigrationsByStatus('completed' as any);
        const migrationPerformance = [];

        for (const migration of completedMigrations) {
          const comparison = PerformanceMonitor.compareEndpoints(
            migration.consolidatedEndpoint,
            migration.oldEndpoints
          );
          
          if (comparison) {
            migrationPerformance.push({
              migrationId: migration.id,
              consolidatedEndpoint: migration.consolidatedEndpoint,
              oldEndpoints: migration.oldEndpoints,
              performance: comparison,
              completionDate: migration.completionDate
            });
          }
        }

        response.data = {
          migrations: migrationPerformance,
          summary: MigrationTracker.getProgressSummary(),
          totalImprovements: calculateTotalImprovements(migrationPerformance)
        };
        break;

      case 'export':
        // Export performance data
        const format = searchParams.get('format') || 'json';
        const exportData = PerformanceMonitor.exportData(format as 'json' | 'csv');
        
        if (format === 'csv') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="performance-report-${new Date().toISOString().split('T')[0]}.csv"`
            }
          });
        }

        response.data = {
          format,
          exportData: JSON.parse(exportData),
          downloadUrl: `/api/admin/performance-dashboard?view=export&format=csv`
        };
        break;

      default:
        // Summary view (default)
        const systemReport = PerformanceMonitor.getSystemReport();
        const migrationSummary = MigrationTracker.getProgressSummary();
        
        response.data = {
          overview: {
            consolidationProgress: migrationSummary.completionRate,
            totalEndpoints: systemReport.overview.totalEndpoints,
            systemHealth: systemReport.overview.systemHealthScore,
            avgResponseTime: systemReport.overview.avgSystemResponseTime,
            performanceGains: {
              responseTime: migrationSummary.performanceGains.avgResponseTimeImprovement,
              dbConnections: migrationSummary.performanceGains.dbConnectionReduction,
              cacheHitRate: migrationSummary.performanceGains.cacheHitRateImprovement
            }
          },
          highlights: {
            topPerformers: systemReport.consolidation.topPerformers.slice(0, 5),
            needsAttention: systemReport.consolidation.needsAttention.slice(0, 5),
            recentMigrations: migrationSummary.timeline.slice(-5)
          },
          quickStats: {
            migrationsCompleted: migrationSummary.byStatus?.completed || 0,
            migrationsInProgress: migrationSummary.byStatus?.in_progress || 0,
            migrationsPending: migrationSummary.byStatus?.pending || 0,
            cacheHitRate: CachePerformanceMonitor.getOverallStats().overall.hitRate
          },
          recommendations: systemReport.recommendations.concat(
            CachePerformanceMonitor.getRecommendations()
          ).slice(0, 10)
        };
        break;
    }

    return NextResponse.json(response);

  } catch (error) {
    return APIErrorHandler.createResponse(
      APIErrorHandler.createDatabaseError(error as Error, {
        endpoint: '/api/admin/performance-dashboard',
        view: searchParams.get('view') || 'summary'
      })
    );
  }
}

// Helper function to get endpoint comparison
async function getEndpointComparison(endpoint: string) {
  // Find if this endpoint is part of a migration
  const migrations = MigrationTracker.getAllMigrations();
  const migration = migrations.find(m => 
    m.consolidatedEndpoint === endpoint || m.oldEndpoints.includes(endpoint)
  );

  if (!migration) {
    return null;
  }

  // If it's a consolidated endpoint, compare with old endpoints
  if (migration.consolidatedEndpoint === endpoint) {
    return PerformanceMonitor.compareEndpoints(endpoint, migration.oldEndpoints);
  }

  // If it's an old endpoint, show migration info
  return {
    isDeprecated: true,
    newEndpoint: migration.consolidatedEndpoint,
    migrationStatus: migration.status,
    deprecationDate: migration.deprecationDate,
    removalDate: migration.removalDate
  };
}

// Helper function to calculate total improvements
function calculateTotalImprovements(migrationPerformance: any[]) {
  if (migrationPerformance.length === 0) {
    return {
      avgResponseTimeImprovement: 0,
      avgDbConnectionReduction: 0,
      avgCacheHitRateImprovement: 0,
      totalEndpointsConsolidated: 0
    };
  }

  const totals = migrationPerformance.reduce((acc, migration) => {
    const perf = migration.performance;
    return {
      responseTime: acc.responseTime + perf.improvement.responseTime.improvement,
      dbConnections: acc.dbConnections + perf.improvement.dbConnections.reduction,
      cacheHitRate: acc.cacheHitRate + perf.improvement.cacheHitRate.improvement,
      endpoints: acc.endpoints + migration.oldEndpoints.length
    };
  }, { responseTime: 0, dbConnections: 0, cacheHitRate: 0, endpoints: 0 });

  const count = migrationPerformance.length;

  return {
    avgResponseTimeImprovement: Math.round(totals.responseTime / count),
    avgDbConnectionReduction: Math.round(totals.dbConnections / count),
    avgCacheHitRateImprovement: Math.round(totals.cacheHitRate / count),
    totalEndpointsConsolidated: totals.endpoints
  };
}