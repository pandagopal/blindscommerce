import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { testTaxJarConnection } from '@/lib/services/taxjarIntegration';

// POST /api/admin/settings/test-taxjar - Test TaxJar API connection
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taxjar_api_key, taxjar_environment } = body;

    // Test with provided credentials instead of database values
    const result = await testTaxJarConnectionWithCredentials(taxjar_api_key, taxjar_environment);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing TaxJar connection:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to test TaxJar connection' 
    }, { status: 500 });
  }
}

// Test TaxJar connection with provided credentials
async function testTaxJarConnectionWithCredentials(apiKey: string, environment: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!apiKey) {
      return { success: false, message: 'TaxJar API key is required' };
    }

    const baseUrl = environment === 'production' 
      ? 'https://api.taxjar.com' 
      : 'https://api.sandbox.taxjar.com';

    // Test with a simple rate lookup for Austin, TX
    const response = await fetch(`${baseUrl}/v2/rates/78701`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { 
        success: false, 
        message: `TaxJar API error: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Connection successful! Rate for Austin, TX: ${data.rate.combined_rate}% (${environment} environment)` 
    };

  } catch (error) {
    return { 
      success: false, 
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}