import { createHash } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { validateImage, validateVideo, validateCSV } from './fileValidators';

export interface VendorFileStructure {
  vendorId: number;
  vendorName: string;
  basePath: string;
  categoryFolders: Map<string, string>;
}

export interface FileUploadResult {
  success: boolean;
  fileId: string;
  filePath: string;
  isDuplicate: boolean;
  duplicateOfFileId?: string;
  errors?: string[];
}

export interface ExistingFile {
  fileId: string;
  originalName: string;
  category: string;
  fileHash: string;
  uploadDate: Date;
  fileSize: number;
  dimensions?: { width: number; height: number };
  url: string;
}

/**
 * Vendor File Manager with organized folder structure
 * Folder structure: uploads/vendor_{vendorId}_{vendorName}/category_name/files
 */
export class VendorFileManager {
  private vendorId: number;
  private vendorName: string;
  private basePath: string;
  private uploadsRoot: string;
  private authToken?: string;

  constructor(vendorId: number, vendorName: string, authToken?: string) {
    this.vendorId = vendorId; // This is vendor_info_id from database
    this.vendorName = this.sanitizeVendorName(vendorName);
    this.uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    this.basePath = path.join(this.uploadsRoot, `vendor_${vendorId}_${this.vendorName}`);
    this.authToken = authToken;
  }

  /**
   * Get auth headers for API calls
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else if (typeof window !== 'undefined') {
      // Try to get token from cookies in browser
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
      if (authCookie) {
        const token = authCookie.split('=')[1];
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  /**
   * Initialize vendor folder structure
   */
  async initializeVendorStructure(): Promise<void> {
    try {
      // Create main vendor folder
      await fs.mkdir(this.basePath, { recursive: true });

      // Create default category folders
      const defaultCategories = [
        'window_blinds',
        'roller_shades', 
        'cellular_shades',
        'wood_blinds',
        'vertical_blinds',
        'shutters',
        'curtains',
        'videos',
        'documents',
        'csv_data'
      ];

      for (const category of defaultCategories) {
        const categoryPath = path.join(this.basePath, category);
        await fs.mkdir(categoryPath, { recursive: true });
      }

      // Create thumbnails subfolder for each category
      for (const category of defaultCategories) {
        if (category !== 'csv_data' && category !== 'documents') {
          const thumbnailPath = path.join(this.basePath, category, 'thumbnails');
          await fs.mkdir(thumbnailPath, { recursive: true });
        }
      }

    } catch (error) {
      throw new Error(`Failed to initialize vendor folder structure: ${error}`);
    }
  }

  /**
   * Get all existing files for vendor with category organization
   */
  async getExistingFiles(category?: string): Promise<Map<string, ExistingFile[]>> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const headers = await this.getAuthHeaders();
      
      const url = new URL(`${apiUrl}/v2/vendors/files`);
      if (category) {
        url.searchParams.append('category', category);
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch files');
      }

      // Convert object to Map
      const filesByCategory = new Map<string, ExistingFile[]>();
      if (result.files) {
        for (const [cat, files] of Object.entries(result.files)) {
          filesByCategory.set(cat, files as ExistingFile[]);
        }
      }

      return filesByCategory;
    } catch (error) {
      console.error('Error fetching existing files:', error);
      return new Map();
    }
  }

  /**
   * Check if file is duplicate by hash
   */
  async checkDuplicate(fileBuffer: Buffer, category: string): Promise<{
    isDuplicate: boolean;
    existingFileId?: string;
    existingFileName?: string;
  }> {
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${apiUrl}/v2/vendors/files/duplicate-check`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileHash, category }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to check duplicate: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to check duplicate');
      }

      return {
        isDuplicate: result.isDuplicate,
        existingFileId: result.existingFileId,
        existingFileName: result.existingFileName
      };
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Upload file with organized storage and duplicate prevention
   */
  async uploadFile(
    file: File,
    category: string,
    uploadType: 'productImages' | 'productVideos' | 'csvFiles'
  ): Promise<FileUploadResult> {
    try {
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Check for duplicates first
      const duplicateCheck = await this.checkDuplicate(buffer, category);
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          fileId: '',
          filePath: '',
          isDuplicate: true,
          duplicateOfFileId: duplicateCheck.existingFileId,
          errors: [`File already exists: ${duplicateCheck.existingFileName}`]
        };
      }

      // Validate file based on type
      let validationResult;
      switch (uploadType) {
        case 'productImages':
          validationResult = await validateImage(buffer, {
            maxWidth: 1920,
            maxHeight: 1080,
            maxSize: 2 * 1024 * 1024, // 2MB
            allowedFormats: ['image/jpeg', 'image/png']
          });
          break;
        case 'productVideos':
          validationResult = await validateVideo(buffer, {
            maxWidth: 1920,
            maxHeight: 1080,
            maxSize: 50 * 1024 * 1024, // 50MB
            maxDuration: 120, // 2 minutes
            allowedFormats: ['video/mp4', 'video/webm']
          });
          break;
        case 'csvFiles':
          validationResult = await validateCSV(buffer, {
            maxSize: 10 * 1024 * 1024, // 10MB
            maxRows: 1000
          });
          break;
        default:
          throw new Error('Invalid upload type');
      }

      if (!validationResult.isValid) {
        return {
          success: false,
          fileId: '',
          filePath: '',
          isDuplicate: false,
          errors: validationResult.errors
        };
      }

      // Initialize vendor structure if needed
      await this.initializeVendorStructure();

      // Generate secure file ID and path
      const fileId = this.generateFileId();
      const sanitizedOriginalName = this.sanitizeFileName(file.name);
      const fileExtension = path.extname(sanitizedOriginalName);
      const secureFileName = `${fileId}${fileExtension}`;
      
      // Create category folder if it doesn't exist
      const categoryPath = path.join(this.basePath, category);
      await fs.mkdir(categoryPath, { recursive: true });

      // Full file path
      const filePath = path.join(categoryPath, secureFileName);

      // Write file securely
      await fs.writeFile(filePath, buffer, { mode: 0o644 });

      // Create thumbnail for images
      if (uploadType === 'productImages') {
        await this.createThumbnail(buffer, category, fileId, fileExtension);
      }

      // Store metadata in database
      await this.storeFileMetadata({
        fileId,
        vendorId: this.vendorId,
        originalName: sanitizedOriginalName,
        category,
        uploadType,
        fileSize: buffer.length,
        fileFormat: file.type,
        fileHash: createHash('sha256').update(buffer).digest('hex'),
        filePath: filePath,
        dimensions: validationResult.dimensions
      });

      return {
        success: true,
        fileId,
        filePath: this.generateFileUrl(fileId, category, sanitizedOriginalName),
        isDuplicate: false
      };

    } catch (error) {
      return {
        success: false,
        fileId: '',
        filePath: '',
        isDuplicate: false,
        errors: [`Upload failed: ${error}`]
      };
    }
  }

  /**
   * Get upload statistics and limits for vendor
   */
  async getUploadStats(): Promise<{
    totalFiles: number;
    filesByCategory: Map<string, number>;
    totalStorage: number;
    storageByCategory: Map<string, number>;
    limits: {
      maxFilesPerCategory: Map<string, number>;
      remainingQuota: Map<string, number>;
    };
  }> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${apiUrl}/v2/vendors/files/stats`, {
        method: 'GET',
        headers,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      // Convert objects to Maps
      const filesByCategory = new Map<string, number>();
      const storageByCategory = new Map<string, number>();
      const maxFilesPerCategory = new Map<string, number>();
      const remainingQuota = new Map<string, number>();

      if (result.filesByCategory) {
        for (const [cat, count] of Object.entries(result.filesByCategory)) {
          filesByCategory.set(cat, count as number);
        }
      }

      if (result.storageByCategory) {
        for (const [cat, size] of Object.entries(result.storageByCategory)) {
          storageByCategory.set(cat, size as number);
        }
      }

      if (result.limits?.maxFilesPerCategory) {
        for (const [cat, limit] of Object.entries(result.limits.maxFilesPerCategory)) {
          maxFilesPerCategory.set(cat, limit as number);
        }
      }

      if (result.limits?.remainingQuota) {
        for (const [cat, quota] of Object.entries(result.limits.remainingQuota)) {
          remainingQuota.set(cat, quota as number);
        }
      }

      return {
        totalFiles: result.totalFiles || 0,
        filesByCategory,
        totalStorage: result.totalStorage || 0,
        storageByCategory,
        limits: {
          maxFilesPerCategory,
          remainingQuota
        }
      };
    } catch (error) {
      console.error('Error fetching upload stats:', error);
      return {
        totalFiles: 0,
        filesByCategory: new Map(),
        totalStorage: 0,
        storageByCategory: new Map(),
        limits: {
          maxFilesPerCategory: new Map(),
          remainingQuota: new Map()
        }
      };
    }
  }

  /**
   * Delete file with cleanup
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const headers = await this.getAuthHeaders();
      
      // First get file info from API to get the file path
      const getResponse = await fetch(`${apiUrl}/v2/vendors/files/${fileId}`, {
        method: 'GET',
        headers,
        cache: 'no-store'
      });

      if (!getResponse.ok) {
        throw new Error('File not found');
      }

      const fileInfo = await getResponse.json();
      
      // Delete via API
      const response = await fetch(`${apiUrl}/v2/vendors/files/${fileId}`, {
        method: 'DELETE',
        headers,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete file');
      }

      // Remove physical file if we have the path
      if (fileInfo.file?.url) {
        try {
          const filePath = path.join(process.cwd(), 'public', fileInfo.file.url);
          await fs.unlink(filePath);
          
          // Remove thumbnail if exists
          const thumbnailPath = path.join(this.basePath, fileInfo.file.category, 'thumbnails', `${fileId}_thumb.jpg`);
          await fs.unlink(thumbnailPath).catch(() => {}); // Ignore if thumbnail doesn't exist
        } catch (error) {
          console.warn(`Could not delete physical file: ${error}`);
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to delete file ${fileId}:`, error);
      return false;
    }
  }

  // Private helper methods

  private sanitizeVendorName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 50);
  }

  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 100);
  }

  private generateFileId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${this.vendorId}_${timestamp}_${random}`;
  }

  private generateFileUrl(fileId: string, category: string, originalName: string): string {
    return `/uploads/vendor_${this.vendorId}_${this.vendorName}/${category}/${fileId}${path.extname(originalName)}`;
  }

  private async createThumbnail(buffer: Buffer, category: string, fileId: string, extension: string): Promise<void> {
    try {
      // This would use sharp or similar library to create thumbnails
      // For now, we'll just create the path structure
      const thumbnailPath = path.join(this.basePath, category, 'thumbnails');
      await fs.mkdir(thumbnailPath, { recursive: true });
      
      // TODO: Implement actual thumbnail generation with sharp
      // const thumbnail = await sharp(buffer)
      //   .resize(300, 300, { fit: 'cover' })
      //   .jpeg({ quality: 80 })
      //   .toBuffer();
      // 
      // await fs.writeFile(path.join(thumbnailPath, `${fileId}_thumb.jpg`), thumbnail);
    } catch (error) {
      console.warn(`Failed to create thumbnail: ${error}`);
    }
  }

  private async storeFileMetadata(metadata: {
    fileId: string;
    vendorId: number;
    originalName: string;
    category: string;
    uploadType: string;
    fileSize: number;
    fileFormat: string;
    fileHash: string;
    filePath: string;
    dimensions?: { width: number; height: number };
  }): Promise<void> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${apiUrl}/v2/vendors/files/metadata`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to store metadata: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to store metadata');
      }
    } catch (error) {
      console.error('Error storing file metadata:', error);
      throw error;
    }
  }
}