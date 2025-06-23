import { NextRequest, NextResponse } from 'next/server';
import { getUserOrders, getUserOrdersCount } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the current user from the auth token
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get and validate query parameters (validated integers for safe string interpolation)
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '10', 10))); // 1-100 range
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10)); // Non-negative

    // Get total count of orders for this user
    const totalOrders = await getUserOrdersCount(user.userId);
    
    // Fetch paginated orders for the user (using validated integers for LIMIT/OFFSET)
    const orders = await getUserOrders(user.userId, limit, offset);

    return NextResponse.json(
      {
        orders: orders || [],
        total: totalOrders,
        limit,
        offset
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
