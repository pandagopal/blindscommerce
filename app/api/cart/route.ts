import { NextRequest } from 'next/server';
import { CartHandler } from '@/lib/api/handlers/CartHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Ultimate Cart Consolidation - 22 Endpoints → 1
const handler = new CartHandler();

// Register the most comprehensive consolidation migration
MigrationTracker.registerMigration({
  id: 'cart-ultimate-consolidation',
  consolidatedEndpoint: '/api/cart',
  oldEndpoints: [
    '/api/cart',
    '/api/cart/add',
    '/api/cart/update',
    '/api/cart/remove',  
    '/api/cart/clear',
    '/api/cart/totals',
    '/api/cart/coupon/apply',
    '/api/cart/coupon/remove',
    '/api/cart/save-for-later',
    '/api/cart/move-to-cart',
    '/api/cart/gift-wrapping',
    '/api/cart/installation',
    '/api/cart/samples',
    '/api/cart/bulk',
    '/api/cart/recommendations',
    '/api/cart/shipping-address',
    '/api/cart/merge',
    '/api/cart/validate',
    '/api/cart/sync',
    '/api/cart/enhanced',
    '/api/cart/analytics',
    '/api/cart/templates'
  ],
  description: 'Ultimate cart consolidation: 22 cart endpoints unified into single comprehensive API',
  expectedBenefits: [
    'Massive endpoint reduction: 22 → 1',
    'Action-based routing for all cart operations', 
    'Smart caching with real-time invalidation',
    'Complete cart lifecycle management',
    'Enhanced error handling and validation',
    'Performance monitoring and analytics'
  ],
  metadata: {
    version: '1.0',
    tags: ['cart', 'consolidation', 'phase4', 'ultimate'],
    priority: 'critical',
    complexity: 'high',
    riskLevel: 'medium',
    impact: 'highest',
    consolidationRatio: 22
  }
});

MigrationTracker.updateStatus('cart-ultimate-consolidation', MigrationStatus.IN_PROGRESS);

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