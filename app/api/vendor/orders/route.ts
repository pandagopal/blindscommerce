import { NextRequest } from 'next/server';
import { VendorOrdersHandler } from '@/lib/api/handlers/VendorOrdersHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Vendor Orders API
const handler = new VendorOrdersHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'vendor-orders-consolidation',
  consolidatedEndpoint: '/api/vendor/orders',
  oldEndpoints: [
    '/api/vendor/orders',
    '/api/vendor/orders/[id]',
    '/api/vendor/orders/[id]/status',
    '/api/vendor/orders/[id]/tracking',
    '/api/vendor/orders/[id]/cancel',
    '/api/vendor/orders/export',
    '/api/vendor/orders/summary'
  ],
  description: 'Consolidate vendor order management into comprehensive order operations',
  expectedBenefits: [
    'Single endpoint for all vendor order operations',
    'Order fulfillment and tracking management',
    'Status updates and cancellation requests',
    'Export capabilities for vendor reporting',
    'Real-time order monitoring'
  ],
  metadata: {
    version: '1.0',
    tags: ['vendor', 'orders', 'phase3'],
    priority: 'high',
    complexity: 'medium',
    riskLevel: 'low',
    consolidationRatio: 7
  }
});

MigrationTracker.updateStatus('vendor-orders-consolidation', MigrationStatus.IN_PROGRESS);

export async function GET(req: NextRequest) {
  return handler.handle(req);
}

export async function POST(req: NextRequest) {
  return handler.handle(req);
} 