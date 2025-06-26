import { NextRequest } from 'next/server';
import { AdminOrdersHandler } from '@/lib/api/handlers/AdminOrdersHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Admin Orders API
const handler = new AdminOrdersHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'admin-orders-consolidation',
  consolidatedEndpoint: '/api/admin/orders',
  oldEndpoints: [
    '/api/admin/orders',
    '/api/admin/orders/[id]',
    '/api/admin/orders/[id]/status',
    '/api/admin/orders/[id]/notes',
    '/api/admin/orders/[id]/refund',
    '/api/admin/orders/[id]/fulfill',
    '/api/admin/orders/[id]/install',
    '/api/admin/orders/bulk',
    '/api/admin/orders/export',
    '/api/admin/orders/analytics',
    '/api/admin/orders/notifications'
  ],
  description: 'Consolidate admin order management into single comprehensive endpoint',
  expectedBenefits: [
    'Single endpoint for all order operations',
    'Complete order lifecycle management',
    'Status tracking and fulfillment',
    'Refund and cancellation processing',
    'Installation scheduling',
    'Bulk operations and analytics',
    'Real-time order monitoring'
  ],
  metadata: {
    version: '1.0',
    tags: ['admin', 'orders', 'phase2'],
    priority: 'high',
    complexity: 'high',
    riskLevel: 'medium',
    consolidationRatio: 11
  }
});

MigrationTracker.updateStatus('admin-orders-consolidation', MigrationStatus.IN_PROGRESS);

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