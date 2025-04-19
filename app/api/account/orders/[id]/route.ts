import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the auth token
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const orderId = parseInt(params.id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Get order details - pass user ID to ensure the user can only see their own orders
    // Admin users can see all orders, handled in the getOrderById function
    const order = await getOrderById(orderId, user.role === 'admin' ? null : user.userId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { order },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
