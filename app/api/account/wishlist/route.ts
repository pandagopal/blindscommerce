import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// In-memory wishlist store (replace with DB in production)
let wishlist: any[] = [];

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied. Wishlist is only available to customers.' }, { status: 403 });
    }

    // Return wishlist for authenticated user
    return NextResponse.json({ wishlist: wishlist.filter(item => item.userId === user.userId) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load wishlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied. Wishlist is only available to customers.' }, { status: 403 });
    }

    const body = await req.json();
    const item = { ...body, id: Date.now(), userId: user.userId };
    wishlist.push(item);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add item to wishlist' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Access denied. Wishlist is only available to customers.' }, { status: 403 });
    }

    const { id } = await req.json();
    // Only allow deletion of items belonging to the authenticated user
    wishlist = wishlist.filter(item => item.id !== id || item.userId !== user.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove item from wishlist' }, { status: 500 });
  }
} 