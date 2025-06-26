import { NextRequest } from 'next/server';
import { AdminVendorsHandler } from '@/lib/api/handlers/AdminVendorsHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Admin Vendors API
const handler = new AdminVendorsHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'admin-vendors-consolidation',
  consolidatedEndpoint: '/api/admin/vendors',
  oldEndpoints: [
    '/api/admin/vendors',
    '/api/admin/vendors/[id]',
    '/api/admin/vendors/approve',
    '/api/admin/vendors/reject',
    '/api/admin/vendors/commission',
    '/api/admin/vendors/bulk',
    '/api/admin/vendors/export'
  ],
  description: 'Consolidate admin vendor management into single comprehensive endpoint',
  expectedBenefits: [
    'Single endpoint for all vendor operations',
    'Approval workflow management',
    'Commission rate management',
    'Comprehensive vendor analytics'
  ],
  metadata: {
    version: '1.0',
    tags: ['admin', 'vendors', 'phase2'],
    priority: 'high',
    complexity: 'moderate',
    riskLevel: 'low'
  }
});

MigrationTracker.updateStatus('admin-vendors-consolidation', MigrationStatus.IN_PROGRESS);

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