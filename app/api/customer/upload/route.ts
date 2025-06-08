import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SecureCustomerUpload, CUSTOMER_UPLOAD_LIMITS, sanitizeFileMetadata } from '@/lib/security/vendorUploadSecurity';
import { apiRateLimiter } from '@/lib/security/validation';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for customer uploads
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // More strict rate limiting for customers
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

    // Check if user is a customer or has customer permissions
    if (!['customer', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Customer access required' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const uploadType = formData.get('uploadType') as keyof typeof CUSTOMER_UPLOAD_LIMITS;
    const description = formData.get('description') as string;
    const files = formData.getAll('files') as File[];

    // Validate upload type
    if (!uploadType || !CUSTOMER_UPLOAD_LIMITS[uploadType]) {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      );
    }

    // Validate file count
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const limits = CUSTOMER_UPLOAD_LIMITS[uploadType];
    if (files.length > limits.maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${limits.maxFiles} files allowed for ${uploadType}` },
        { status: 400 }
      );
    }

    // Check customer upload quota
    const uploadQuota = await checkCustomerUploadQuota(user.userId, uploadType);
    if (!uploadQuota.allowed) {
      return NextResponse.json(
        { error: uploadQuota.reason || 'Upload quota exceeded' },
        { status: 429 }
      );
    }

    // Process files securely
    const secureUpload = new SecureCustomerUpload(user.userId, uploadType);
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await secureUpload.processFile(file);
        
        if (result.success) {
          // Store file metadata in database
          await storeCustomerFileMetadata({
            customerId: user.userId,
            fileId: result.fileId,
            originalName: result.originalName,
            uploadType,
            description: sanitizeFileMetadata(description || ''),
            fileSize: result.metadata.size,
            fileFormat: result.metadata.format,
            fileHash: result.hash,
            scanResult: result.metadata.scanResult,
            dimensions: result.metadata.dimensions
          });

          results.push({
            fileId: result.fileId,
            originalName: result.originalName,
            secureUrl: result.secureUrl,
            status: 'uploaded',
            requiresProcessing: uploadType === 'roomPhotos'
          });
        } else {
          errors.push(`${file.name}: ${result.errors?.join(', ')}`);
        }

      } catch (error) {
        errors.push(`${file.name}: Processing failed - ${error}`);
        
        // Safe error logging
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Customer upload error for file ${file.name}:`, error);
        }
      }
    }

    // Update customer upload quota
    await updateCustomerUploadQuota(user.userId, uploadType, results.length);

    // Log upload activity
    await logCustomerUploadActivity({
      customerId: user.userId,
      uploadType,
      filesUploaded: results.length,
      filesRejected: errors.length,
      clientIP
    });

    return NextResponse.json({
      success: true,
      uploaded: results,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: results.length,
      totalErrors: errors.length,
      quotaRemaining: uploadQuota.remaining - results.length
    });

  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Customer upload processing error:', error);
    } else {
      console.error('Customer upload processing failed');
    }

    return NextResponse.json(
      { error: 'Upload processing failed' },
      { status: 500 }
    );
  }
}

// Check customer upload quota to prevent abuse
async function checkCustomerUploadQuota(customerId: number, uploadType: string): Promise<{
  allowed: boolean;
  remaining: number;
  reason?: string;
}> {
  const pool = await getPool();
  
  // Define daily upload limits per type
  const dailyLimits = {
    profileAvatar: 5,
    roomPhotos: 20,
    measurementDocuments: 10
  };

  const limit = dailyLimits[uploadType as keyof typeof dailyLimits] || 5;
  
  // Check uploads in last 24 hours
  const [uploads] = await pool.execute(`
    SELECT COUNT(*) as upload_count
    FROM customer_files 
    WHERE customer_id = ? 
      AND upload_type = ? 
      AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND deleted_at IS NULL
  `, [customerId, uploadType]);

  const uploadCount = (uploads as any)[0]?.upload_count || 0;
  const remaining = Math.max(0, limit - uploadCount);

  if (uploadCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Daily upload limit of ${limit} files reached for ${uploadType}`
    };
  }

  return {
    allowed: true,
    remaining
  };
}

// Store customer file metadata
async function storeCustomerFileMetadata(metadata: {
  customerId: number;
  fileId: string;
  originalName: string;
  uploadType: string;
  description: string;
  fileSize: number;
  fileFormat: string;
  fileHash: string;
  scanResult: string;
  dimensions?: { width: number; height: number };
}) {
  const pool = await getPool();
  
  await pool.execute(`
    INSERT INTO customer_files (
      customer_id, file_id, original_name, upload_type, description,
      file_size, file_format, file_hash, scan_result, 
      width, height, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    metadata.customerId,
    metadata.fileId,
    metadata.originalName,
    metadata.uploadType,
    metadata.description,
    metadata.fileSize,
    metadata.fileFormat,
    metadata.fileHash,
    metadata.scanResult,
    metadata.dimensions?.width || null,
    metadata.dimensions?.height || null
  ]);
}

// Update customer upload quota tracking
async function updateCustomerUploadQuota(customerId: number, uploadType: string, filesUploaded: number) {
  const pool = await getPool();
  
  await pool.execute(`
    INSERT INTO customer_upload_quota (
      customer_id, upload_type, files_uploaded, last_upload_date
    ) VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      files_uploaded = files_uploaded + VALUES(files_uploaded),
      last_upload_date = NOW()
  `, [customerId, uploadType, filesUploaded]);
}

// Log customer upload activity for security monitoring
async function logCustomerUploadActivity(activity: {
  customerId: number;
  uploadType: string;
  filesUploaded: number;
  filesRejected: number;
  clientIP: string;
}) {
  const pool = await getPool();
  
  await pool.execute(`
    INSERT INTO customer_upload_logs (
      customer_id, upload_type, files_uploaded, files_rejected,
      client_ip, created_at
    ) VALUES (?, ?, ?, ?, ?, NOW())
  `, [
    activity.customerId,
    activity.uploadType,
    activity.filesUploaded,
    activity.filesRejected,
    activity.clientIP
  ]);
}

// GET endpoint to retrieve customer files
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['customer', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Customer access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uploadType = searchParams.get('uploadType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    const pool = await getPool();
    
    let query = `
      SELECT file_id, original_name, upload_type, description, file_size,
             width, height, scan_result, created_at
      FROM customer_files 
      WHERE customer_id = ? AND deleted_at IS NULL
    `;
    const params = [user.userId];

    if (uploadType) {
      query += ' AND upload_type = ?';
      params.push(uploadType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [files] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        page,
        limit,
        hasMore: Array.isArray(files) && files.length === limit
      }
    });

  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error retrieving customer files:', error);
    }

    return NextResponse.json(
      { error: 'Failed to retrieve files' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for customer files
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['customer', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Customer access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    const pool = await getPool();
    
    // Verify file ownership
    const [files] = await pool.execute(`
      SELECT file_id, file_hash 
      FROM customer_files
      WHERE file_id = ? AND customer_id = ? AND deleted_at IS NULL
    `, [fileId, user.userId]);

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete for audit trail
    await pool.execute(`
      UPDATE customer_files 
      SET deleted_at = NOW(), deleted_by = ?
      WHERE file_id = ?
    `, [user.userId, fileId]);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error deleting customer file:', error);
    }

    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}