import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { vendor: string } }
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const vendor = params.vendor;

    // Call multiple APIs in parallel for better performance
    const [storefrontResponse, pageDataResponse] = await Promise.all([
      fetch(`${baseUrl}/api/storefront/${vendor}`, {
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/storefront/${vendor}/page-data`, {
        cache: 'no-store',
      })
    ]);

    // Check if storefront exists first
    if (!storefrontResponse.ok) {
      if (storefrontResponse.status === 404) {
        return NextResponse.json(
          { error: 'Storefront not found' },
          { status: 404 }
        );
      }
      throw new Error(`Storefront API failed: ${storefrontResponse.status}`);
    }

    const storefrontData = await storefrontResponse.json();
    
    let pageData = null;
    if (pageDataResponse.ok) {
      const pageDataResult = await pageDataResponse.json();
      if (pageDataResult.success) {
        pageData = pageDataResult.data;
      }
    }

    // Combine the data from both APIs
    const combinedData = {
      storefront: storefrontData.success ? storefrontData.data : null,
      homepage: pageData?.homepage || null,
      featuredProducts: pageData?.featuredProducts || []
    };

    return NextResponse.json({
      success: true,
      data: combinedData,
      meta: {
        page: 'storefront',
        vendor: vendor,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in storefront page API orchestrator:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch storefront page data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}