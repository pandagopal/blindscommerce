/**
 * Connection Pool Monitoring Middleware
 * Tracks and logs database connection pool usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPoolInfo } from '@/lib/db';

export async function connectionMonitorMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  // Log pool info before request
  if (process.env.NODE_ENV === 'development') {
    const poolInfoBefore = await getPoolInfo();
    if (poolInfoBefore) {
      const usage = (poolInfoBefore.used / poolInfoBefore.total) * 100;
      if (usage > 60) {
        // High pool usage - can enable logging for debugging if needed
      }
    }
  }

  // Add cleanup on response
  response.headers.set('X-Pool-Monitor', 'active');
  
  return response;
}

// Helper to log pool stats
export async function logPoolStats(context: string) {
  if (process.env.NODE_ENV === 'development') {
    const poolInfo = await getPoolInfo();
    if (poolInfo) {
      // Pool stats available - can enable logging for debugging if needed
    }
  }
}