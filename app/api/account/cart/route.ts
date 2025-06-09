import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const userId = 1; // Demo user

async function getOrCreateCart(pool: any) {
  // Try to find an existing cart for the user
  const [carts] = await pool.execute(
    'SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  if (carts.length > 0) return carts[0];
  // Create a new cart
  const [result] = await pool.execute(
    'INSERT INTO carts (user_id) VALUES (?)',
    [userId]
  );
  const cart_id = result.insertId;
  return { cart_id, user_id: userId };
}

export async function GET(req: NextRequest) {
  const pool = await getPool();
  const cart = await getOrCreateCart(pool);
  const [items] = await pool.execute(
    'SELECT * FROM cart_items WHERE cart_id = ?',
    [cart.cart_id]
  );
  return NextResponse.json({ cart, items });
}

export async function POST(req: NextRequest) {
  const pool = await getPool();
  const cart = await getOrCreateCart(pool);
  const body = await req.json();
  const [result] = await pool.execute(
    `INSERT INTO cart_items (cart_id, product_id, quantity, width, height, color_id, material_id, unit_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [cart.cart_id, body.product_id, body.quantity, body.width, body.height, body.color_id, body.material_id, body.unit_price]
  );
  const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_item_id = ?', [result.insertId]);
  return NextResponse.json({ success: true, item: rows[0] });
}

export async function PUT(req: NextRequest) {
  const pool = await getPool();
  const cart = await getOrCreateCart(pool);
  const body = await req.json();
  const [result] = await pool.execute(
    `UPDATE cart_items SET quantity = ?, width = ?, height = ?, color_id = ?, material_id = ?, unit_price = ?, updated_at = NOW()
     WHERE cart_item_id = ? AND cart_id = ?`,
    [body.quantity, body.width, body.height, body.color_id, body.material_id, body.unit_price, body.cart_item_id, cart.cart_id]
  );
  if (result.affectedRows === 0) {
    return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
  }
  const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_item_id = ?', [body.cart_item_id]);
  return NextResponse.json({ success: true, item: rows[0] });
}

export async function DELETE(req: NextRequest) {
  const pool = await getPool();
  const cart = await getOrCreateCart(pool);
  const { cart_item_id } = await req.json();
  await pool.execute(
    'DELETE FROM cart_items WHERE cart_item_id = ? AND cart_id = ?',
    [cart_item_id, cart.cart_id]
  );
  return NextResponse.json({ success: true });
} 