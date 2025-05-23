import { NextRequest, NextResponse } from 'next/server';

// In-memory wishlist store (replace with DB in production)
let wishlist: any[] = [];
const userId = 1; // Demo user

export async function GET(req: NextRequest) {
  // Return wishlist for user
  return NextResponse.json({ wishlist: wishlist.filter(item => item.userId === userId) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = { ...body, id: Date.now(), userId };
  wishlist.push(item);
  return NextResponse.json({ success: true, item });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  wishlist = wishlist.filter(item => item.id !== id || item.userId !== userId);
  return NextResponse.json({ success: true });
} 