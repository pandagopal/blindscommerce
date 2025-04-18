import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const categoryId = url.searchParams.get('category')
      ? parseInt(url.searchParams.get('category') as string, 10)
      : null;
    const search = url.searchParams.get('search');
    const minPrice = url.searchParams.get('minPrice')
      ? parseFloat(url.searchParams.get('minPrice') as string)
      : null;
    const maxPrice = url.searchParams.get('maxPrice')
      ? parseFloat(url.searchParams.get('maxPrice') as string)
      : null;
    const sortBy = url.searchParams.get('sortBy') || 'name';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';

    const products = await getProducts({
      limit,
      offset,
      categoryId,
      search,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder
    });

    return NextResponse.json({ products, count: products.length }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
