import { NextRequest } from 'next/server';
import { validateFileUpload } from './validation';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

// Allowed file types with their MIME types and extensions
const ALLOWED_FILE_TYPES = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  documents: {
    mimeTypes: ['application/pdf', 'text/plain'],
    extensions: ['.pdf', '.txt'],
    maxSize: 10 * 1024 * 1024 // 10MB
  }
};

// Upload directories
const UPLOAD_DIRS = {
  products: '/public/images/products',
  users: '/public/images/users',
  documents: '/public/documents',
  temp: '/tmp/uploads'
};

export interface UploadOptions {
  category: keyof typeof UPLOAD_DIRS;
  fileType: keyof typeof ALLOWED_FILE_TYPES;
  maxFiles?: number;
  customPath?: string;
}

export interface UploadResult {
  success: boolean;
  files?: {
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }[];
  errors?: string[];
}

/**
 * Secure file upload handler
 */
export class SecureFileUpload {
  private uploadDir: string;
  private options: UploadOptions;

  constructor(options: UploadOptions) {
    this.options = options;
    this.uploadDir = options.customPath || UPLOAD_DIRS[options.category];
  }

  /**
   * Process file upload from FormData
   */
  async processUpload(request: NextRequest): Promise<UploadResult> {
    try {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      
      if (!files || files.length === 0) {
        return { success: false, errors: ['No files provided'] };
      }

      // Check file count limit
      if (this.options.maxFiles && files.length > this.options.maxFiles) {
        return { 
          success: false, 
          errors: [`Too many files. Maximum allowed: ${this.options.maxFiles}`] 
        };
      }

      const results: UploadResult['files'] = [];
      const errors: string[] = [];

      // Process each file
      for (const file of files) {
        try {
          const result = await this.processFile(file);
          if (result.success && result.file) {
            results.push(result.file);
          } else {
            errors.push(result.error || 'Unknown error');
          }
        } catch (error) {
          errors.push(`Failed to process file ${file.name}: ${error}`);
        }
      }

      return {
        success: results.length > 0,
        files: results.length > 0 ? results : undefined,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Upload processing failed: ${error}`]
      };
    }
  }

  /**
   * Process individual file
   */
  private async processFile(file: File): Promise<{
    success: boolean;
    file?: UploadResult['files'][0];
    error?: string;
  }> {
    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check file type
    const allowedTypes = ALLOWED_FILE_TYPES[this.options.fileType];
    if (!allowedTypes.mimeTypes.includes(file.type)) {
      return { 
        success: false, 
        error: `File type ${file.type} not allowed for ${this.options.fileType}` 
      };
    }

    // Check file size
    if (file.size > allowedTypes.maxSize) {
      return {
        success: false,
        error: `File size exceeds limit of ${allowedTypes.maxSize / (1024 * 1024)}MB`
      };
    }

    // Check file extension
    const fileExt = path.extname(file.name).toLowerCase();
    if (!allowedTypes.extensions.includes(fileExt)) {
      return {
        success: false,
        error: `File extension ${fileExt} not allowed`
      };
    }

    // Generate secure filename
    const secureFileName = await this.generateSecureFileName(file.name);
    const filePath = path.join(this.uploadDir, secureFileName);

    try {
      // Ensure upload directory exists
      await this.ensureDirectoryExists(this.uploadDir);

      // Read file content
      const arrayBuffer = await file.arrayBuffer();
      const fileContent = Buffer.from(arrayBuffer);

      // Additional security: Scan file content for malicious patterns
      if (this.containsMaliciousContent(fileContent)) {
        return {
          success: false,
          error: 'File contains potentially malicious content'
        };
      }

      // Write file securely
      await fs.writeFile(filePath, fileContent, { mode: 0o644 });

      return {
        success: true,
        file: {
          originalName: file.name,
          fileName: secureFileName,
          filePath: filePath,
          fileSize: file.size,
          mimeType: file.type
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to save file: ${error}`
      };
    }
  }

  /**
   * Generate secure filename
   */
  private async generateSecureFileName(originalName: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    
    // Sanitize original name (keep only alphanumeric and some safe chars)
    const baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9\-_]/g, '')
      .substring(0, 20);
    
    return `${baseName}_${timestamp}_${randomBytes}${ext}`;
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
    }
  }

  /**
   * Basic malicious content detection
   */
  private containsMaliciousContent(fileContent: Buffer): boolean {
    const content = fileContent.toString('utf8', 0, Math.min(1024, fileContent.length));
    
    // Check for common malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /<?php/i,
      /<%/i,
      /#!/i // Shebang for scripts
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Ensure file is within allowed directories
      const normalizedPath = path.normalize(filePath);
      const isAllowed = Object.values(UPLOAD_DIRS).some(dir => 
        normalizedPath.startsWith(path.normalize(dir))
      );

      if (!isAllowed) {
        throw new Error('File not in allowed directory');
      }

      await fs.unlink(normalizedPath);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }
}

/**
 * Middleware for secure file uploads
 */
export function createUploadMiddleware(options: UploadOptions) {
  return async (request: NextRequest): Promise<UploadResult> => {
    const uploader = new SecureFileUpload(options);
    return await uploader.processUpload(request);
  };
}

// Pre-configured upload handlers
export const productImageUpload = createUploadMiddleware({
  category: 'products',
  fileType: 'images',
  maxFiles: 10
});

export const userAvatarUpload = createUploadMiddleware({
  category: 'users',
  fileType: 'images',
  maxFiles: 1
});

export const documentUpload = createUploadMiddleware({
  category: 'documents',
  fileType: 'documents',
  maxFiles: 5
});