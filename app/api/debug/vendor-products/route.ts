import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const pool = await getPool();

    // Check vendor info
    const [vendorInfo] = await pool.execute(
      'SELECT vendor_info_id, business_name FROM vendor_info WHERE user_id = ?',
      [user.userId]
    );

    // Check vendor products
    const [vendorProducts] = await pool.execute(
      `SELECT 
        vp.vendor_id, vp.product_id, vp.vendor_sku, vp.vendor_price,
        p.name, p.slug, p.base_price
       FROM vendor_products vp
       LEFT JOIN products p ON vp.product_id = p.product_id
       WHERE vp.vendor_id = (SELECT vendor_info_id FROM vendor_info WHERE user_id = ?)`,
      [user.userId]
    );

    // Check all products in database
    const [allProducts] = await pool.execute(
      'SELECT product_id, name, slug, base_price FROM products ORDER BY created_at DESC LIMIT 10'
    );

    // Check vendor-a-roller-shade specifically
    const [rollerShade] = await pool.execute(
      `SELECT 
        p.product_id, p.name, p.slug, p.base_price,
        vp.vendor_id, vp.vendor_price,
        fo.fabric_option_id, fo.fabric_type, fo.fabric_name
       FROM products p
       LEFT JOIN vendor_products vp ON p.product_id = vp.product_id
       LEFT JOIN product_fabric_options fo ON p.product_id = fo.product_id
       WHERE p.slug = 'vendor-a-roller-shade'`
    );

    return NextResponse.json({
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role
      },
      vendorInfo: vendorInfo,
      vendorProducts: vendorProducts,
      allProducts: allProducts,
      rollerShadeData: rollerShade
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    );
  }
}