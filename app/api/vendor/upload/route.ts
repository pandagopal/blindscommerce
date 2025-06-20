import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SecureVendorUpload, validateBusinessDocument, VENDOR_UPLOAD_LIMITS } from '@/lib/security/vendorUploadSecurity';
import { apiRateLimiter } from '@/lib/security/validation';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  console.log('=== VENDOR UPLOAD API START ===');
  try {
    // Rate limiting for vendor uploads
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    console.log('Client IP:', clientIP);
    
    if (apiRateLimiter.isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication and authorization
    console.log('Checking user authentication...');
    const user = await getCurrentUser();
    console.log('User authenticated:', user?.email, user?.role);
    
    if (!user) {
      console.log('No user found - authentication required');
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
      'SELECT vendor_info_id, is_active FROM vendor_info WHERE user_id = ? AND is_active = 1',
      [user.userId]
    );

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found or inactive' },
        { status: 403 }
      );
    }

    const vendor = vendors[0] as { vendor_info_id: number; is_active: boolean };
    
    // Parse form data
    console.log('Parsing form data...');
    const formData = await request.formData();
    const uploadType = formData.get('uploadType') as keyof typeof VENDOR_UPLOAD_LIMITS;
    const category = formData.get('category') as string;
    const productId = formData.get('productId') as string;
    const files = formData.getAll('files') as File[];
    
    console.log('Form data parsed:', {
      uploadType,
      category,
      productId,
      filesCount: files.length,
      fileNames: files.map(f => f.name)
    });

    // Validate upload type
    console.log('Validating upload type...');
    if (!uploadType || !VENDOR_UPLOAD_LIMITS[uploadType]) {
      console.log('Invalid upload type:', uploadType);
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      );
    }

    // Validate file count
    console.log('Validating file count...');
    if (!files || files.length === 0) {
      console.log('No files provided');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const limits = VENDOR_UPLOAD_LIMITS[uploadType];
    console.log('Upload limits:', limits);
    if (files.length > limits.maxFiles) {
      console.log(`Too many files: ${files.length} > ${limits.maxFiles}`);
      return NextResponse.json(
        { error: `Maximum ${limits.maxFiles} files allowed for ${uploadType}` },
        { status: 400 }
      );
    }
    
    console.log('Validation passed, starting file processing...');

    // Process files securely
    console.log('Creating SecureVendorUpload instance...');
    const secureUpload = new SecureVendorUpload(vendor.vendor_info_id, uploadType, productId);
    const results = [];
    const errors = [];

    console.log(`Processing ${files.length} files...`);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        // Special validation for business documents
        if (uploadType === 'businessDocuments') {
          console.log('Validating business document...');
          const docValidation = await validateBusinessDocument(file, category);
          if (!docValidation.isValid) {
            console.log('Business document validation failed:', docValidation.errors);
            errors.push(`${file.name}: ${docValidation.errors.join(', ')}`);
            continue;
          }
        }

        console.log('Processing file with SecureVendorUpload...');
        const result = await secureUpload.processFile(file);
        console.log('File processing result:', result);
        
        if (result.success) {
          console.log('File processing successful, storing metadata...');
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
            secureUrl: result.secureUrl,
            requiresApproval: uploadType === 'businessDocuments' || uploadType === 'catalogs'
          });
          console.log('Metadata stored successfully');

          results.push({
            fileId: result.fileId,
            originalName: result.originalName,
            secureUrl: result.secureUrl,
            status: 'uploaded',
            requiresApproval: uploadType === 'businessDocuments' || uploadType === 'catalogs'
          });
          console.log('File added to results:', result.secureUrl);
        } else {
          console.log('File processing failed:', result.errors);
          errors.push(`${file.name}: ${result.errors?.join(', ')}`);
        }

      } catch (error) {
        console.error(`Processing error for file ${file.name}:`, error);
        errors.push(`${file.name}: Processing failed - ${error}`);
        
        // Safe error logging
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Vendor upload error for file ${file.name}:`, error);
        }
      }
    }

    console.log('File processing complete. Results:', results.length, 'Errors:', errors.length);

    // Upload activity logging removed - table doesn't exist in database

    console.log('Returning response...');
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
  secureUrl: string;
  requiresApproval: boolean;
}) {
  const pool = await getPool();
  
  await pool.execute(`
    INSERT INTO vendor_files (
      vendor_id, file_id, original_name, upload_type, category,
      file_size, file_format, file_hash, scan_result, file_path,
      approval_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
    metadata.secureUrl, // file_path
    metadata.requiresApproval ? 'pending' : 'approved'
  ]);
}

// Upload activity logging function removed - table doesn't exist in database

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