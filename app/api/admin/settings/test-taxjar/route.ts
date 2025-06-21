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

    const result = await testTaxJarConnection();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing TaxJar connection:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to test TaxJar connection' 
    }, { status: 500 });
  }
}