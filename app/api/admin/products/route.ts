import { NextRequest } from 'next/server';
import { AdminProductsHandler } from '@/lib/api/handlers/AdminProductsHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Admin Products API
const handler = new AdminProductsHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'admin-products-consolidation',
  consolidatedEndpoint: '/api/admin/products',
  oldEndpoints: [
    '/api/admin/products',
    '/api/admin/products/[id]',
    '/api/admin/products/create',
    '/api/admin/products/[id]/edit',
    '/api/admin/products/approve',
    '/api/admin/products/reject',
    '/api/admin/products/bulk',
    '/api/admin/products/duplicate',
    '/api/admin/products/import',
    '/api/admin/products/export',
    '/api/admin/products/analytics'
  ],
  description: 'Consolidate admin product management into single comprehensive endpoint',
  expectedBenefits: [
    'Single endpoint for all product operations',
    'Complete product lifecycle management',
    'Bulk operations and import/export',
    'Advanced analytics and reporting',
    'Inventory management integration',
    'Multi-vendor product support'
  ],
  metadata: {
    version: '1.0',
    tags: ['admin', 'products', 'phase2'],
    priority: 'high',
    complexity: 'high',
    riskLevel: 'medium',
    consolidationRatio: 11
  }
});

MigrationTracker.updateStatus('admin-products-consolidation', MigrationStatus.IN_PROGRESS);

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