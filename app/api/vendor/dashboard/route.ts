import { NextRequest } from 'next/server';
import { VendorDashboardHandler } from '@/lib/api/handlers/VendorDashboardHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Vendor Dashboard API
const handler = new VendorDashboardHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'vendor-dashboard-consolidation',
  consolidatedEndpoint: '/api/vendor/dashboard',
  oldEndpoints: [
    '/api/vendor/dashboard',
    '/api/vendor/metrics',
    '/api/vendor/sales-summary',
    '/api/vendor/recent-activity',
    '/api/vendor/alerts',
    '/api/vendor/performance',
    '/api/vendor/financials',
    '/api/vendor/sales-team',
    '/api/vendor/settings',
    '/api/vendor/notifications'
  ],
  description: 'Consolidate vendor dashboard into comprehensive vendor portal',
  expectedBenefits: [
    'Single endpoint for complete vendor dashboard',
    'Real-time sales and performance metrics',
    'Comprehensive business analytics',
    'Integrated sales team management',
    'Financial tracking and payout management',
    'Smart caching for dashboard performance'
  ],
  metadata: {
    version: '1.0',
    tags: ['vendor', 'dashboard', 'phase3'],
    priority: 'high',
    complexity: 'high',
    riskLevel: 'low',
    consolidationRatio: 10
  }
});

MigrationTracker.updateStatus('vendor-dashboard-consolidation', MigrationStatus.IN_PROGRESS);

export async function GET(req: NextRequest) {
  return handler.handle(req);
}

export async function POST(req: NextRequest) {
  return handler.handle(req);
}