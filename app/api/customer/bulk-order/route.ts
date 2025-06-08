import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { CommercialTemplateManager } from '@/lib/security/commercialTemplateManager';
import { apiRateLimiter } from '@/lib/security/validation';
import { getPool } from '@/lib/db';

// POST - Upload and validate bulk order CSV
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (apiRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check eligibility
    const eligibility = await CommercialTemplateManager.isCustomerEligibleForCommercial(user.userId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { 
          error: 'Commercial bulk order access denied',
          reason: eligibility.reason,
          requirements: eligibility.requirements
        },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const csvFile = formData.get('csvFile') as File;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    if (!csvFile) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!csvFile.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (csvFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'CSV file too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Read CSV content
    const csvContent = await csvFile.text();

    // Validate CSV against template
    const validationResult = await CommercialTemplateManager.validateUploadedCSV(
      user.userId,
      templateId,
      csvContent,
      csvFile.name
    );

    // Calculate estimated pricing if validation passed
    let estimatedPricing;
    if (validationResult.status === 'valid') {
      estimatedPricing = await calculateBulkOrderPricing(validationResult);
    }

    return NextResponse.json({
      success: true,
      upload: {
        uploadId: validationResult.uploadId,
        fileName: validationResult.fileName,
        status: validationResult.status,
        rowCount: validationResult.rowCount,
        validRows: validationResult.validRows,
        invalidRows: validationResult.invalidRows,
        validationErrors: validationResult.validationErrors,
        validationWarnings: validationResult.validationWarnings,
        estimatedPricing
      }
    });

  } catch (error) {
    console.error('Bulk order upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk order upload' },
      { status: 500 }
    );
  }
}

// GET - Retrieve bulk order status and history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    const pool = await getPool();

    if (uploadId) {
      // Get specific upload details
      const [rows] = await pool.execute(`
        SELECT upload_id, template_id, file_name, row_count, valid_rows, invalid_rows,
               status, validation_errors, validation_warnings, total_amount, created_at
        FROM customer_bulk_uploads 
        WHERE customer_id = ? AND upload_id = ?
      `, [user.userId, uploadId]);

      const uploads = rows as any[];
      if (uploads.length === 0) {
        return NextResponse.json(
          { error: 'Upload not found' },
          { status: 404 }
        );
      }

      const upload = uploads[0];
      return NextResponse.json({
        success: true,
        upload: {
          ...upload,
          validation_errors: JSON.parse(upload.validation_errors || '[]'),
          validation_warnings: JSON.parse(upload.validation_warnings || '[]')
        }
      });
    } else {
      // Get all uploads for customer
      const [rows] = await pool.execute(`
        SELECT upload_id, template_id, file_name, row_count, valid_rows, invalid_rows,
               status, total_amount, created_at
        FROM customer_bulk_uploads 
        WHERE customer_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `, [user.userId]);

      const uploads = rows as any[];
      
      return NextResponse.json({
        success: true,
        uploads
      });
    }

  } catch (error) {
    console.error('Bulk order retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bulk order information' },
      { status: 500 }
    );
  }
}

// Helper function to calculate bulk order pricing
async function calculateBulkOrderPricing(upload: any): Promise<{
  subtotal: number;
  bulkDiscount: number;
  discountPercentage: number;
  estimatedTotal: number;
  breakdown: any[];
}> {
  try {
    const pool = await getPool();
    
    // This is a simplified pricing calculation
    // In a real implementation, you would parse the CSV and calculate based on actual products
    
    const basePrice = 150; // Average price per blind
    const quantity = upload.validRows;
    const subtotal = basePrice * quantity;
    
    // Bulk discount tiers
    let discountPercentage = 0;
    if (quantity >= 100) {
      discountPercentage = 20;
    } else if (quantity >= 50) {
      discountPercentage = 15;
    } else if (quantity >= 25) {
      discountPercentage = 10;
    } else if (quantity >= 10) {
      discountPercentage = 5;
    }
    
    const bulkDiscount = subtotal * (discountPercentage / 100);
    const estimatedTotal = subtotal - bulkDiscount;
    
    return {
      subtotal,
      bulkDiscount,
      discountPercentage,
      estimatedTotal,
      breakdown: [
        {
          item: 'Blinds',
          quantity,
          unitPrice: basePrice,
          total: subtotal
        }
      ]
    };
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return {
      subtotal: 0,
      bulkDiscount: 0,
      discountPercentage: 0,
      estimatedTotal: 0,
      breakdown: []
    };
  }
}