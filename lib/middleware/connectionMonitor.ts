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
        console.log(`[Pool Monitor] ${request.url} - Before: ${poolInfoBefore.used}/${poolInfoBefore.total} connections (${usage.toFixed(1)}% usage)`);
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
      console.log(`[Pool Stats - ${context}] Used: ${poolInfo.used}, Free: ${poolInfo.free}, Queued: ${poolInfo.queued}, Total: ${poolInfo.total}`);
    }
  }
}