import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { VendorFileManager } from '@/lib/security/vendorFileManager';
import { apiRateLimiter } from '@/lib/security/validation';
import { getPool } from '@/lib/db';

// POST - Upload new files with duplicate prevention
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

    // Authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'vendor' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Get vendor info
    const pool = await getPool();
    const [vendors] = await pool.execute(
      'SELECT vi.vendor_info_id, vi.business_name FROM vendor_info vi WHERE vi.user_id = ? AND vi.is_active = 1',
      [user.userId]
    );

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found or inactive' },
        { status: 403 }
      );
    }

    const vendor = vendors[0] as { vendor_info_id: number; business_name: string };

    // Parse form data
    const formData = await request.formData();
    const uploadType = formData.get('uploadType') as 'productImages' | 'productVideos' | 'csvFiles';
    const category = formData.get('category') as string;
    const files = formData.getAll('files') as File[];

    // Validate upload type
    if (!['productImages', 'productVideos', 'csvFiles'].includes(uploadType)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be productImages, productVideos, or csvFiles' },
        { status: 400 }
      );
    }

    // Validate category
    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Check upload limits based on type
    const limits = {
      productImages: 10,
      productVideos: 3,
      csvFiles: 5
    };

    if (files.length > limits[uploadType]) {
      return NextResponse.json(
        { error: `Maximum ${limits[uploadType]} files allowed for ${uploadType}` },
        { status: 400 }
      );
    }

    // Initialize vendor file manager
    const fileManager = new VendorFileManager(vendor.vendor_info_id, vendor.business_name);

    // Check current upload stats
    const stats = await fileManager.getUploadStats();
    const remainingQuota = stats.limits.remainingQuota.get(uploadType) || 0;

    if (files.length > remainingQuota) {
      return NextResponse.json(
        { 
          error: `Upload quota exceeded. You can upload ${remainingQuota} more ${uploadType}`,
          currentStats: {
            uploaded: stats.filesByCategory.get(category) || 0,
            limit: limits[uploadType],
            remaining: remainingQuota
          }
        },
        { status: 429 }
      );
    }

    // Process each file
    const results = [];
    const errors = [];
    const duplicates = [];

    for (const file of files) {
      try {
        const result = await fileManager.uploadFile(file, category, uploadType);
        
        if (result.success) {
          results.push({
            fileId: result.fileId,
            originalName: file.name,
            url: result.filePath,
            category,
            uploadType,
            size: file.size
          });
        } else if (result.isDuplicate) {
          duplicates.push({
            originalName: file.name,
            duplicateOfFileId: result.duplicateOfFileId,
            message: result.errors?.[0] || 'File already exists'
          });
        } else {
          errors.push({
            fileName: file.name,
            errors: result.errors || ['Upload failed']
          });
        }

      } catch (error) {
        errors.push({
          fileName: file.name,
          errors: [`Processing failed: ${error}`]
        });
      }
    }

    // Get updated stats
    const updatedStats = await fileManager.getUploadStats();

    return NextResponse.json({
      success: true,
      uploaded: results,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        totalUploaded: results.length,
        totalDuplicates: duplicates.length,
        totalErrors: errors.length,
        remainingQuota: updatedStats.limits.remainingQuota.get(uploadType) || 0
      }
    });

  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Vendor file upload error:', error);
    } else {
      console.error('File upload processing failed');
    }

    return NextResponse.json(
      { error: 'Upload processing failed' },
      { status: 500 }
    );
  }
}

// GET - Retrieve vendor files with category organization
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Vendor access required' },
        { status: 403 }
      );
    }

    // Get vendor info
    const pool = await getPool();
    const [vendors] = await pool.execute(
      'SELECT vi.vendor_info_id, vi.business_name FROM vendor_info vi WHERE vi.user_id = ? AND vi.is_active = 1',
      [user.userId]
    );

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      );
    }

    const vendor = vendors[0] as { vendor_info_id: number; business_name: string };

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const uploadType = searchParams.get('uploadType');
    const showStats = searchParams.get('stats') === 'true';

    // Initialize file manager
    const fileManager = new VendorFileManager(vendor.vendor_info_id, vendor.business_name);

    // Get existing files
    const filesByCategory = await fileManager.getExistingFiles(category || undefined);

    // Filter by upload type if specified
    let filteredFiles = filesByCategory;
    if (uploadType) {
      filteredFiles = new Map();
      for (const [cat, files] of filesByCategory) {
        const filtered = files.filter(file => {
          // This would require storing upload_type in the existing files query
          // For now, we'll use simple filtering based on file extension
          if (uploadType === 'productImages') {
            return file.url.match(/\.(jpg|jpeg|png)$/i);
          } else if (uploadType === 'productVideos') {
            return file.url.match(/\.(mp4|webm)$/i);
          } else if (uploadType === 'csvFiles') {
            return file.url.match(/\.csv$/i);
          }
          return false;
        });
        if (filtered.length > 0) {
          filteredFiles.set(cat, filtered);
        }
      }
    }

    // Convert Map to object for JSON response
    const filesResponse: { [category: string]: any[] } = {};
    for (const [cat, files] of filteredFiles) {
      filesResponse[cat] = files;
    }

    // Get stats if requested
    let stats;
    if (showStats) {
      stats = await fileManager.getUploadStats();
      // Convert Maps to objects for JSON response
      stats = {
        totalFiles: stats.totalFiles,
        totalStorage: stats.totalStorage,
        filesByCategory: Object.fromEntries(stats.filesByCategory),
        storageByCategory: Object.fromEntries(stats.storageByCategory),
        limits: {
          maxFilesPerCategory: Object.fromEntries(stats.limits.maxFilesPerCategory),
          remainingQuota: Object.fromEntries(stats.limits.remainingQuota)
        }
      };
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.vendor_info_id,
        name: vendor.business_name
      },
      files: filesResponse,
      stats,
      folderStructure: `vendor_${vendor.vendor_info_id}_${vendor.business_name.replace(/[^a-zA-Z0-9\-_]/g, '_')}`
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

// DELETE - Remove files
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

    // Get vendor info
    const pool = await getPool();
    const [vendors] = await pool.execute(
      'SELECT vi.vendor_info_id, vi.business_name FROM vendor_info vi WHERE vi.user_id = ? AND vi.is_active = 1',
      [user.userId]
    );

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor account not found' },
        { status: 404 }
      );
    }

    const vendor = vendors[0] as { vendor_info_id: number; business_name: string };

    // Initialize file manager and delete file
    const fileManager = new VendorFileManager(vendor.vendor_info_id, vendor.business_name);
    const success = await fileManager.deleteFile(fileId);

    if (!success) {
      return NextResponse.json(
        { error: 'File not found or deletion failed' },
        { status: 404 }
      );
    }

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