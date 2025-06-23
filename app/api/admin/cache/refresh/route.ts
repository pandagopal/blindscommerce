import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { refreshAllCaches, getAllCacheStats } from '@/lib/cache';

/**
 * Manual cache refresh endpoint for admin dashboard
 * POST /api/admin/cache/refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user and verify admin access
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Refresh all caches
    const refreshResult = refreshAllCaches();
    
    // Get current stats after refresh
    const currentStats = getAllCacheStats();

    return NextResponse.json({
      success: true,
      message: 'All caches refreshed successfully',
      refreshedBy: {
        userId: user.userId,
        email: user.email,
        role: user.role
      },
      refreshResult,
      currentStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh caches' },
      { status: 500 }
    );
  }
}

/**
 * Get cache statistics
 * GET /api/admin/cache/refresh
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user and verify admin access
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get current cache statistics
    const stats = getAllCacheStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    );
  }
}