import { NextRequest } from 'next/server';
import { VendorProductsHandler } from '@/lib/api/handlers/VendorProductsHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Vendor Products API
const handler = new VendorProductsHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'vendor-products-consolidation',
  consolidatedEndpoint: '/api/vendor/products',
  oldEndpoints: [
    '/api/vendor/products',
    '/api/vendor/products/[id]',
    '/api/vendor/products/create',
    '/api/vendor/products/[id]/edit',
    '/api/vendor/products/bulk',
    '/api/vendor/products/duplicate',
    '/api/vendor/products/images',
    '/api/vendor/products/analytics'
  ],
  description: 'Consolidate vendor product management into comprehensive product operations',
  expectedBenefits: [
    'Single endpoint for all vendor product operations',
    'Complete product lifecycle management for vendors',
    'Bulk operations and product duplication',
    'Integrated image management',
    'Product analytics and performance tracking'
  ],
  metadata: {
    version: '1.0',
    tags: ['vendor', 'products', 'phase3'],
    priority: 'high',
    complexity: 'medium',
    riskLevel: 'low',
    consolidationRatio: 8
  }
});

MigrationTracker.updateStatus('vendor-products-consolidation', MigrationStatus.IN_PROGRESS);

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