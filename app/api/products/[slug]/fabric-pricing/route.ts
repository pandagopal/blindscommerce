import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const materialId = parseInt(searchParams.get('materialId') || '0');
    const width = parseFloat(searchParams.get('width') || '0');
    const height = parseFloat(searchParams.get('height') || '0');

    if (!slug) {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
    }

    if (!materialId || isNaN(materialId)) {
      return NextResponse.json({ error: 'Valid material ID required' }, { status: 400 });
    }

    if (!width || !height || width <= 0 || height <= 0) {
      return NextResponse.json({ error: 'Valid width and height required' }, { status: 400 });
    }

    const pool = await getPool();

    // First get the product ID from slug
    const [productRows] = await pool.execute(
      'SELECT product_id FROM products WHERE slug = ?',
      [slug]
    );

    const product = (productRows as any[])[0];
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productId = product.product_id;

    // Get fabric pricing for this product and material based on width range
    const [fabricRows] = await pool.execute(
      `SELECT pfp.price_per_sqft 
       FROM product_fabric_pricing pfp
       JOIN product_fabric_options pfo ON pfp.fabric_option_id = pfo.fabric_option_id
       WHERE pfo.product_id = ? 
       AND pfo.material_id = ?
       AND pfp.min_width <= ? AND pfp.max_width >= ?
       ORDER BY pfp.min_width ASC
       LIMIT 1`,
      [productId, materialId, width, width]
    );

    let pricePerSqft = 0;

    if ((fabricRows as any[]).length > 0) {
      pricePerSqft = (fabricRows as any[])[0].price_per_sqft || 0;
    }

    const area = (width * height) / 144; // Convert square inches to square feet
    const totalFabricPrice = pricePerSqft * area;

    return NextResponse.json({
      productId,
      slug,
      materialId,
      width,
      height,
      pricePerSqft: parseFloat(pricePerSqft) || 0,
      area: parseFloat(area.toFixed(2)),
      totalFabricPrice: parseFloat(totalFabricPrice.toFixed(2))
    });

  } catch (error) {
    console.error('Error fetching fabric pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fabric pricing' },
      { status: 500 }
    );
  }
}