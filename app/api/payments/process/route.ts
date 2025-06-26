import { NextRequest } from 'next/server';
import { PaymentsHandler } from '@/lib/api/handlers/PaymentsHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Consolidated Payments Processing API
const handler = new PaymentsHandler();

// Register and track this migration
MigrationTracker.registerMigration({
  id: 'payments-processing-consolidation',
  consolidatedEndpoint: '/api/payments/process',
  oldEndpoints: [
    '/api/payments/process',
    '/api/payments/confirm',
    '/api/payments/capture',
    '/api/payments/refund',
    '/api/payments/methods/save',
    '/api/payments/methods/validate', 
    '/api/payments/methods/delete',
    '/api/payments/fees/calculate',
    '/api/payments/fraud/check',
    '/api/payments/retry',
    '/api/payments/cancel',
    '/api/payments/history',
    '/api/payments/status'
  ],
  description: 'Consolidate payment processing into comprehensive payment management API',
  expectedBenefits: [
    'Single endpoint for all payment operations',
    'Complete payment lifecycle management',
    'Multi-provider payment processing',
    'Advanced fraud detection integration',
    'Payment method management',
    'Refund and dispute handling',
    'Real-time payment status tracking'
  ],
  metadata: {
    version: '1.0',
    tags: ['payments', 'processing', 'phase4'],
    priority: 'critical',
    complexity: 'high',
    riskLevel: 'high',
    consolidationRatio: 13
  }
});

MigrationTracker.updateStatus('payments-processing-consolidation', MigrationStatus.IN_PROGRESS);

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