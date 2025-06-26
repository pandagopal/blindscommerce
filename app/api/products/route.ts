import { NextRequest } from 'next/server';
import { ProductsHandler } from '@/lib/api/handlers/ProductsHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Consolidated Public Products API
const handler = new ProductsHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'products-public-consolidation',
  consolidatedEndpoint: '/api/products',
  oldEndpoints: [
    '/api/products',
    '/api/products/[id]',
    '/api/products/[slug]',
    '/api/products/search',
    '/api/products/compare',
    '/api/products/recommendations',
    '/api/products/pricing',
    '/api/products/availability',
    '/api/products/categories',
    '/api/products/filters',
    '/api/products/featured'
  ],
  description: 'Consolidate public product endpoints into comprehensive product API',
  expectedBenefits: [
    'Single endpoint for all product operations',
    'Advanced search and filtering',
    'Product comparison functionality',
    'Dynamic pricing calculations',
    'Smart caching with faceted search',
    'Recommendation engine integration'
  ],
  metadata: {
    version: '1.0',
    tags: ['products', 'public', 'phase4'],
    priority: 'high',
    complexity: 'high',
    riskLevel: 'low',
    consolidationRatio: 11
  }
});

MigrationTracker.updateStatus('products-public-consolidation', MigrationStatus.IN_PROGRESS);

export async function GET(req: NextRequest) {
  return handler.handle(req);
}

export async function POST(req: NextRequest) {
  return handler.handle(req);
}
