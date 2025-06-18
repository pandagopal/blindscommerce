import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Call the products data API
    const productsApiUrl = new URL(`${baseUrl}/api/products/data`);
    
    // Forward all search parameters to the products API
    searchParams.forEach((value, key) => {
      productsApiUrl.searchParams.set(key, value);
    });

    const response = await fetch(productsApiUrl.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Products API failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      meta: {
        page: 'products',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in products page API orchestrator:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products page data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}