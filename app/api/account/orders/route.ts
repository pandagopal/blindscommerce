import { NextRequest, NextResponse } from 'next/server';
import { getUserOrders } from '@/lib/db';
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Fetch orders for the user
    const orders = await getUserOrders(user.userId);

    // Apply pagination
    const paginatedOrders = orders.slice(offset, offset + limit);

    return NextResponse.json(
      {
        orders: paginatedOrders,
        total: orders.length,
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
