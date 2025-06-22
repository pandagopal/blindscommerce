import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProducts, createProduct } from '@/lib/services/products';

// GET /api/vendor/products - Get vendor's products
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const result = await getProducts({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: 'created_at',
      sortOrder: 'desc'
    }, user.userId, user.role);

    // Format response to match vendor component expectations
    const formattedProducts = result.products.map((product: any) => ({
      id: product.product_id,
      product_id: product.product_id,
      name: product.name,
      slug: product.slug || product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '',
      description: product.short_description,
      base_price: parseFloat(product.base_price?.toString() || '0'),
      price: parseFloat(product.base_price?.toString() || '0'),
      vendorPrice: parseFloat(product.vendor_price?.toString() || product.base_price?.toString() || '0'),
      category: product.category_names || '',
      status: product.stock_status,
      quantityAvailable: product.quantity_available || 0,
      is_active: Boolean(product.vendor_active ?? product.is_active),
      is_listing_enabled: Boolean(product.vendor_active ?? product.is_active),
      vendorActive: Boolean(product.vendor_active ?? product.is_active),
      totalSales: parseInt(product.total_sold?.toString() || '0'),
      avgRating: 0,
      created_at: product.created_at,
      createdAt: product.created_at,
      updated_at: product.updated_at,
      updatedAt: product.updated_at
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total: result.total,
        limit: parseInt(searchParams.get('limit') || '10'),
        offset: parseInt(searchParams.get('offset') || '0'),
        hasMore: result.page < result.totalPages
      }
    });

  } catch (error) {
    // Error fetching vendor products
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/vendor/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required' }, { status: 401 });
    }

    const body = await request.json();
    
    // Transform vendor request to match shared service format
    const productData = {
      basicInfo: {
        name: body.name,
        slug: body.slug,
        shortDescription: body.shortDescription || body.description,
        fullDescription: body.fullDescription || body.description,
        sku: body.sku || `SKU-${Date.now()}`,
        basePrice: body.basePrice || body.base_price,
        category: body.category || '',
        brand: body.brand || '',
        isActive: body.isActive !== false
      },
      features: body.features || [],
      images: body.images?.map((url: string, index: number) => ({
        url,
        isPrimary: index === 0
      })) || []
    };

    const result = await createProduct(productData, user.userId, user.role);

    return NextResponse.json({
      success: true,
      product_id: result.productId,
      message: result.message
    });

  } catch (error) {
    // Error creating product
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}