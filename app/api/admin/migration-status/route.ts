import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MigrationTracker } from '@/lib/api/migration';
import { APIErrorHandler } from '@/lib/api/errorHandling';

// API endpoint to track migration progress
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Only allow admins to view migration status
    if (!user || user.role !== 'ADMIN') {
      return APIErrorHandler.createResponse(
        APIErrorHandler.createAuthenticationError('forbidden')
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'summary';

    if (format === 'detailed') {
      // Return all migrations with details
      const migrations = MigrationTracker.getAllMigrations();
      
      return NextResponse.json({
        success: true,
        data: {
          migrations,
          totalCount: migrations.length,
          summary: MigrationTracker.getProgressSummary()
        },
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: '/api/admin/migration-status',
          format: 'detailed'
        }
      });
    } else {
      // Return summary only
      const summary = MigrationTracker.getProgressSummary();
      
      return NextResponse.json({
        success: true,
        data: summary,
        metadata: {
          timestamp: new Date().toISOString(),
          endpoint: '/api/admin/migration-status',
          format: 'summary'
        }
      });
    }

  } catch (error) {
    return APIErrorHandler.createResponse(
      APIErrorHandler.createDatabaseError(error as Error, {
        endpoint: '/api/admin/migration-status'
      })
    );
  }
}

// Update migration status (for testing/manual updates)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return APIErrorHandler.createResponse(
        APIErrorHandler.createAuthenticationError('forbidden')
      );
    }

    const body = await req.json();
    const { migrationId, status, metrics } = body;

    if (!migrationId || !status) {
      return APIErrorHandler.createResponse(
        APIErrorHandler.createValidationError('migrationId', 'Migration ID and status are required')
      );
    }

    const updated = MigrationTracker.updateStatus(migrationId, status);
    
    if (!updated) {
      return APIErrorHandler.createResponse(
        APIErrorHandler.createError(
          APIErrorHandler.createError.name as any,
          `Migration ${migrationId} not found`
        )
      );
    }

    // If metrics provided, record them
    if (metrics) {
      MigrationTracker.recordPerformanceMetrics(migrationId, metrics, 'after');
    }

    return NextResponse.json({
      success: true,
      data: {
        migrationId,
        status,
        updated: true
      },
      metadata: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/admin/migration-status'
      }
    });

  } catch (error) {
    return APIErrorHandler.createResponse(
      APIErrorHandler.createDatabaseError(error as Error, {
        endpoint: '/api/admin/migration-status'
      })
    );
  }
}