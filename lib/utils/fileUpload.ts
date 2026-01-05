/**
 * File Upload Utility
 * Centralized file upload functionality to prevent code duplication
 */

import { randomBytes } from 'crypto';

export interface UploadOptions {
  type: 'categories' | 'hero-banners' | 'rooms' | 'products' | 'fabric';
  maxSizeInMB?: number;
  allowedTypes?: string[];
  filenamePrefix?: string;
  userId?: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  filename: string;
  size?: number;
  type?: string;
}

export class FileUploadService {
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  private static readonly DEFAULT_MAX_SIZE_MB = 5;

  /**
   * Upload a file to the specified directory
   */
  static async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    // Validate file exists
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES;
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type. Only ${allowedTypes.join(', ')} are allowed`
      );
    }

    // Validate file size
    const maxSizeInBytes = (options.maxSizeInMB || this.DEFAULT_MAX_SIZE_MB) * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new Error(
        `File size too large. Maximum size is ${options.maxSizeInMB || this.DEFAULT_MAX_SIZE_MB}MB`
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = file.name.split('.').pop() || 'jpg';

    let filename: string;
    if (options.filenamePrefix) {
      filename = `${options.filenamePrefix}-${timestamp}-${randomString}.${extension}`;
    } else if (options.userId) {
      filename = `vendor-${options.userId}-${timestamp}-${randomString}.${extension}`;
    } else {
      filename = `${options.type}_${timestamp}_${randomString}.${extension}`;
    }

    // Determine upload directory
    const uploadDir = this.getUploadDirectory(options.type);

    // Save file to filesystem
    const fs = require('fs').promises;
    const path = require('path');
    const fullUploadDir = path.join(process.cwd(), 'public', uploadDir);
    const filePath = path.join(fullUploadDir, filename);

    // Ensure directory exists
    await fs.mkdir(fullUploadDir, { recursive: true });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Return public URL
    const url = `/${uploadDir}/${filename}`;

    return {
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type
    };
  }

  /**
   * Get upload directory based on type
   */
  private static getUploadDirectory(type: string): string {
    const directoryMap: Record<string, string> = {
      'categories': 'uploads/categories',
      'hero-banners': 'uploads/hero-banners',
      'rooms': 'uploads/rooms',
      'products': 'uploads/products',
      'fabric': 'uploads/fabric'
    };

    return directoryMap[type] || 'uploads/misc';
  }

  /**
   * Extract file from FormData
   */
  static async extractFileFromFormData(formData: FormData): Promise<File> {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided in form data');
    }
    return file;
  }
}
