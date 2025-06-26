import { NextRequest } from 'next/server';
import { AdminDashboardHandler } from '@/lib/api/handlers/AdminDashboardHandler';
import { MigrationTracker, MigrationStatus } from '@/lib/api/migration';

// Enhanced Consolidated Admin Dashboard API using new infrastructure
const handler = new AdminDashboardHandler();

// Mark migration as in progress
MigrationTracker.updateStatus('admin-dashboard-consolidation', MigrationStatus.IN_PROGRESS);

export async function GET(req: NextRequest) {
  return handler.handle(req);
}

export async function POST(req: NextRequest) {
  return handler.handle(req);
}