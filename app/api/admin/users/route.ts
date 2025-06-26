import { NextRequest } from 'next/server';
import { AdminUsersHandler } from '@/lib/api/handlers/AdminUsersHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Admin Users API
const handler = new AdminUsersHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'admin-users-consolidation',
  consolidatedEndpoint: '/api/admin/users',
  oldEndpoints: [
    '/api/admin/users',
    '/api/admin/users/[id]',
    '/api/admin/users/[id]/edit',
    '/api/admin/users/bulk',
    '/api/admin/users/export',
    '/api/admin/users/import'
  ],
  description: 'Consolidate admin user management into single comprehensive endpoint',
  expectedBenefits: [
    'Single endpoint for all user operations',
    'Bulk operations support',
    'Advanced filtering and search',
    'Comprehensive user data with stats'
  ],
  metadata: {
    version: '1.0',
    tags: ['admin', 'users', 'phase2'],
    priority: 'high',
    complexity: 'moderate',
    riskLevel: 'low'
  }
});

MigrationTracker.updateStatus('admin-users-consolidation', MigrationStatus.IN_PROGRESS);

export async function GET(req: NextRequest) {
  return handler.handle(req);
}

export async function POST(req: NextRequest) {
  return handler.handle(req);
}

export async function PUT(req: NextRequest) {
  return handler.handle(req);
}

export async function DELETE(req: NextRequest) {
  return handler.handle(req);
} 