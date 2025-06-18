import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Call the homepage data API
    const response = await fetch(`${baseUrl}/api/homepage/data`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Homepage data API failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      meta: {
        page: 'homepage',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in homepage API orchestrator:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch homepage data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}