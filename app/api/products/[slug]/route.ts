import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug, getProductsBySlugPattern } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get all matching products using pattern matching
    const products = await getProductsBySlugPattern(slug);
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      );
    }
    
    // Check if we should show single product view or multiple products view
    // Only show single product if there's exactly one product and it's an exact slug match
    const exactMatch = products.find(p => p.slug === slug);
    const shouldShowSingle = products.length === 1 || (exactMatch && products.length === 1);
    
    // For category-like slugs (roller-blinds, vertical-blinds), always show multiple if more than 1 exists
    const isCategorySlug = slug.includes('-') && (slug.includes('blind') || slug.includes('shade') || slug.includes('shutter'));
    
    return NextResponse.json({ 
      products,
      count: products.length,
      isMultiple: isCategorySlug ? products.length > 1 : !shouldShowSingle,
      searchTerm: slug,
      exactMatch: exactMatch ? exactMatch.slug : null
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
