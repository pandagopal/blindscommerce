import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const width = parseFloat(searchParams.get('width') || '0');
    const height = parseFloat(searchParams.get('height') || '0');

    if (!slug) {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
    }

    if (!width || !height || width <= 0 || height <= 0) {
      return NextResponse.json({ error: 'Valid width and height required' }, { status: 400 });
    }

    const pool = await getPool();

    // First, get the product's ID and base price as fallback
    const [productRows] = await pool.execute(
      'SELECT product_id, base_price FROM products WHERE slug = ?',
      [slug]
    );

    const product = (productRows as any[])[0];
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productId = product.product_id;

    // Try to find pricing matrix entry for this product and dimensions
    const [pricingRows] = await pool.execute(
      `SELECT base_price FROM product_pricing_matrix 
       WHERE product_id = ? 
       AND width_min <= ? AND width_max >= ?
       AND height_min <= ? AND height_max >= ?
       AND is_active = 1
       ORDER BY width_min ASC, height_min ASC
       LIMIT 1`,
      [productId, width, width, height, height]
    );

    let price = product.base_price;

    if ((pricingRows as any[]).length > 0) {
      price = (pricingRows as any[])[0].base_price;
    }

    return NextResponse.json({
      productId,
      slug,
      width,
      height,
      price: parseFloat(price) || 0,
      source: (pricingRows as any[]).length > 0 ? 'pricing_matrix' : 'base_price'
    });

  } catch (error) {
    console.error('Error fetching product pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}