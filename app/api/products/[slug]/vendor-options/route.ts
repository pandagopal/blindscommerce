import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
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

    // Get vendor options for this product
    const [optionsRows] = await pool.execute(
      'SELECT options_data FROM product_options WHERE product_id = ?',
      [productId]
    );

    let vendorOptions = {
      dimensions: {
        minWidth: 12,
        maxWidth: 96,
        minHeight: 12,
        maxHeight: 120,
        widthIncrement: 0.125,
        heightIncrement: 0.125
      },
      mountTypes: [],
      controlTypes: {
        liftSystems: [],
        wandSystem: [],
        stringSystem: [],
        remoteControl: []
      },
      valanceOptions: [],
      bottomRailOptions: []
    };

    if ((optionsRows as any[]).length > 0) {
      const optionsData = (optionsRows as any[])[0].options_data;
      if (optionsData) {
        try {
          const parsedOptions = typeof optionsData === 'string' ? JSON.parse(optionsData) : optionsData;
          vendorOptions = { ...vendorOptions, ...parsedOptions };
        } catch (parseError) {
          console.error('Error parsing options data:', parseError);
        }
      }
    }

    return NextResponse.json(vendorOptions);

  } catch (error) {
    console.error('Error fetching vendor options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor options' },
      { status: 500 }
    );
  }
}