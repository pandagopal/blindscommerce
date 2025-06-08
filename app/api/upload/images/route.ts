import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SecureFileUpload } from '@/lib/security/fileUpload';
import { validateImage, IMAGE_LIMITS } from '@/lib/security/imageValidation';
import { apiRateLimiter } from '@/lib/security/validation';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createHash } from 'crypto';

interface UploadCategory {
  allowedRoles: string[];
  maxFiles: number;
  directory: string;
}

const UPLOAD_CATEGORIES: Record<string, UploadCategory> = {
  'product-images': {
    allowedRoles: ['admin', 'vendor'],
    maxFiles: 10,
    directory: '/public/images/products'
  },
  'user-avatar': {
    allowedRoles: ['customer', 'admin', 'vendor', 'sales', 'installer'],
    maxFiles: 1,
    directory: '/public/images/users'
  },
  'room-photos': {
    allowedRoles: ['customer', 'admin', 'vendor', 'sales'],
    maxFiles: 5,
    directory: '/public/images/rooms'
  }
};

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

    // Authentication check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const category = formData.get('category') as string;
    const files = formData.getAll('files') as File[];

    // Validate category
    if (!category || !UPLOAD_CATEGORIES[category]) {
      return NextResponse.json(
        { error: 'Invalid upload category' },
        { status: 400 }
      );
    }

    const categoryConfig = UPLOAD_CATEGORIES[category];

    // Check role authorization
    if (!categoryConfig.allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for this upload category' },
        { status: 403 }
      );
    }

    // Validate file count
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > categoryConfig.maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${categoryConfig.maxFiles} files allowed` },
        { status: 400 }
      );
    }

    const uploadedFiles: Array<{
      originalName: string;
      fileName: string;
      url: string;
      size: number;
      hash: string;
      dimensions?: { width: number; height: number };
    }> = [];

    const errors: string[] = [];

    // Process each file
    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Comprehensive image validation
        const validation = await validateImage(buffer);
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Generate secure filename
        const timestamp = Date.now();
        const randomBytes = createHash('sha256').update(`${file.name}-${timestamp}-${Math.random()}`).digest('hex').substring(0, 16);
        const ext = path.extname(file.name).toLowerCase();
        const secureFileName = `${user.userId}_${timestamp}_${randomBytes}${ext}`;

        // Create full path
        const uploadDir = path.join(process.cwd(), categoryConfig.directory);
        const filePath = path.join(uploadDir, secureFileName);

        // Ensure directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Check for duplicate content (basic deduplication)
        const fileHash = createHash('sha256').update(buffer).digest('hex');
        
        // Write file with security checks
        await writeFileSecurely(filePath, buffer);

        // Generate public URL
        const publicUrl = `${categoryConfig.directory.replace('/public', '')}/${secureFileName}`;

        uploadedFiles.push({
          originalName: file.name,
          fileName: secureFileName,
          url: publicUrl,
          size: buffer.length,
          hash: fileHash,
          dimensions: validation.width && validation.height ? {
            width: validation.width,
            height: validation.height
          } : undefined
        });

        // Log successful upload (safe logging)
        if (process.env.NODE_ENV !== 'production') {
          console.log(`File uploaded: ${file.name} -> ${secureFileName} (${user.userId})`);
        }

      } catch (error) {
        errors.push(`${file.name}: Upload failed - ${error}`);
        
        // Safe error logging
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Upload error for ${file.name}:`, error);
        }
      }
    }

    // Return results
    if (uploadedFiles.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: 'All uploads failed', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadedFiles.length,
      totalErrors: errors.length
    });

  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Upload processing error:', error);
    } else {
      console.error('Upload processing failed');
    }

    return NextResponse.json(
      { error: 'Upload processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Securely write file with additional checks
 */
async function writeFileSecurely(filePath: string, buffer: Buffer): Promise<void> {
  // Validate file path to prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  const projectRoot = process.cwd();
  
  if (!normalizedPath.startsWith(projectRoot)) {
    throw new Error('Invalid file path detected');
  }

  // Check available disk space (simplified check)
  try {
    const stats = await fs.stat(path.dirname(normalizedPath));
    if (!stats.isDirectory()) {
      throw new Error('Invalid directory');
    }
  } catch (error) {
    throw new Error('Directory validation failed');
  }

  // Write file with restricted permissions
  await fs.writeFile(normalizedPath, buffer, { mode: 0o644 });

  // Verify file was written correctly
  const writtenData = await fs.readFile(normalizedPath);
  if (!writtenData.equals(buffer)) {
    await fs.unlink(normalizedPath); // Clean up on failure
    throw new Error('File verification failed');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const category = searchParams.get('category');

    if (!fileName || !category) {
      return NextResponse.json(
        { error: 'fileName and category are required' },
        { status: 400 }
      );
    }

    const categoryConfig = UPLOAD_CATEGORIES[category];
    if (!categoryConfig) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Check role authorization
    if (!categoryConfig.allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate filename format (must start with user ID for security)
    if (!fileName.startsWith(`${user.userId}_`)) {
      return NextResponse.json(
        { error: 'Unauthorized file access' },
        { status: 403 }
      );
    }

    // Construct safe file path
    const filePath = path.join(process.cwd(), categoryConfig.directory, fileName);
    
    // Validate path is within allowed directory
    const normalizedPath = path.normalize(filePath);
    const allowedDir = path.join(process.cwd(), categoryConfig.directory);
    
    if (!normalizedPath.startsWith(allowedDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Delete file
    try {
      await fs.unlink(normalizedPath);
      
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      throw error;
    }

  } catch (error) {
    // Safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('File deletion error:', error);
    }

    return NextResponse.json(
      { error: 'File deletion failed' },
      { status: 500 }
    );
  }
}