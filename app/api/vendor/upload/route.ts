import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SecureVendorUpload, validateBusinessDocument, VENDOR_UPLOAD_LIMITS } from '@/lib/security/vendorUploadSecurity';
import { apiRateLimiter } from '@/lib/security/validation';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for vendor uploads
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (apiRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a vendor
    if (user.role !== 'vendor' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Verify vendor is active and approved
    const pool = await getPool();
    const [vendors] = await pool.execute(
      'SELECT vendor_info_id, is_active, verification_status FROM vendor_info WHERE user_id = ? AND is_active = 1',
      [user.userId]
    );

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found or inactive' },
        { status: 403 }
      );
    }

    const vendor = vendors[0] as { vendor_info_id: number; is_active: boolean; verification_status: string };
    
    // Parse form data
    const formData = await request.formData();
    const uploadType = formData.get('uploadType') as keyof typeof VENDOR_UPLOAD_LIMITS;
    const category = formData.get('category') as string;
    const files = formData.getAll('files') as File[];

    // Validate upload type
    if (!uploadType || !VENDOR_UPLOAD_LIMITS[uploadType]) {
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

    const limits = VENDOR_UPLOAD_LIMITS[uploadType];
    if (files.length > limits.maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${limits.maxFiles} files allowed for ${uploadType}` },
        { status: 400 }
      );
    }

    // Process files securely
    const secureUpload = new SecureVendorUpload(vendor.vendor_info_id, uploadType);
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // Special validation for business documents
        if (uploadType === 'businessDocuments') {
          const docValidation = await validateBusinessDocument(file, category);
          if (!docValidation.isValid) {
            errors.push(`${file.name}: ${docValidation.errors.join(', ')}`);
            continue;
          }
        }

        const result = await secureUpload.processFile(file);
        
        if (result.success) {
          // Store file metadata in database
          await storeFileMetadata({
            vendorId: vendor.vendor_info_id,
            fileId: result.fileId,
            originalName: result.originalName,
            uploadType,
            category: category || 'general',
            fileSize: result.metadata.size,
            fileFormat: result.metadata.format,
            fileHash: result.hash,
            scanResult: result.metadata.scanResult,
            requiresApproval: uploadType === 'businessDocuments' || uploadType === 'catalogs'
          });

          results.push({
            fileId: result.fileId,
            originalName: result.originalName,
            secureUrl: result.secureUrl,
            status: 'uploaded',
            requiresApproval: uploadType === 'businessDocuments' || uploadType === 'catalogs'
          });
        } else {
          errors.push(`${file.name}: ${result.errors?.join(', ')}`);
        }

      } catch (error) {
        errors.push(`${file.name}: Processing failed - ${error}`);
        
        // Safe error logging
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Vendor upload error for file ${file.name}:`, error);
        }
      }
    }

    // Log upload activity for audit trail
    await logUploadActivity({
      vendorId: vendor.vendor_info_id,
      userId: user.userId,
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
      requiresApproval: uploadType === 'businessDocuments' || uploadType === 'catalogs'
    });

  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Vendor upload processing error:', error);
    } else {
      console.error('Vendor upload processing failed');
    }

    return NextResponse.json(
      { error: 'Upload processing failed' },
      { status: 500 }
    );
  }
}

// Store file metadata in database
async function storeFileMetadata(metadata: {
  vendorId: number;
  fileId: string;
  originalName: string;
  uploadType: string;
  category: string;
  fileSize: number;
  fileFormat: string;
  fileHash: string;
  scanResult: string;
  requiresApproval: boolean;
}) {
  const pool = await getPool();
  
  await pool.execute(`
    INSERT INTO vendor_files (
      vendor_id, file_id, original_name, upload_type, category,
      file_size, file_format, file_hash, scan_result, 
      approval_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    metadata.vendorId,
    metadata.fileId,
    metadata.originalName,
    metadata.uploadType,
    metadata.category,
    metadata.fileSize,
    metadata.fileFormat,
    metadata.fileHash,
    metadata.scanResult,
    metadata.requiresApproval ? 'pending' : 'approved'
  ]);
}

// Log upload activity for security audit
async function logUploadActivity(activity: {
  vendorId: number;
  userId: number;
  uploadType: string;
  filesUploaded: number;
  filesRejected: number;
  clientIP: string;
}) {
  const pool = await getPool();
  
  await pool.execute(`
    INSERT INTO vendor_upload_logs (
      vendor_id, user_id, upload_type, files_uploaded, files_rejected,
      client_ip, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
  `, [
    activity.vendorId,
    activity.userId,
    activity.uploadType,
    activity.filesUploaded,
    activity.filesRejected,
    activity.clientIP
  ]);
}

// GET endpoint to retrieve vendor files
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uploadType = searchParams.get('uploadType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const pool = await getPool();
    
    let query = `
      SELECT file_id, original_name, upload_type, category, file_size,
             approval_status, scan_result, created_at
      FROM vendor_files 
      WHERE vendor_id = (SELECT vendor_info_id FROM vendor_info WHERE user_id = ?)
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
      console.error('Error retrieving vendor files:', error);
    }

    return NextResponse.json(
      { error: 'Failed to retrieve files' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove vendor files
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Vendor access required' },
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
      SELECT vf.file_id, vf.file_hash 
      FROM vendor_files vf
      JOIN vendor_info vi ON vf.vendor_id = vi.vendor_info_id
      WHERE vf.file_id = ? AND vi.user_id = ?
    `, [fileId, user.userId]);

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // Mark file as deleted (soft delete for audit trail)
    await pool.execute(`
      UPDATE vendor_files 
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
      console.error('Error deleting vendor file:', error);
    }

    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}