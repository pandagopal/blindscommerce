import { createHash } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getPool } from '@/lib/db';
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

  constructor(vendorId: number, vendorName: string) {
    this.vendorId = vendorId; // This is vendor_info_id from database
    this.vendorName = this.sanitizeVendorName(vendorName);
    this.uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    this.basePath = path.join(this.uploadsRoot, `vendor_${vendorId}_${this.vendorName}`);
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
    const pool = await getPool();
    
    let query = `
      SELECT vf.file_id, vf.original_name, vf.category, vf.file_hash,
             vf.file_size, vf.width, vf.height, vf.created_at,
             vf.upload_type, vf.file_format
      FROM vendor_files vf
      WHERE vf.vendor_info_id = ? AND vf.deleted_at IS NULL
    `;
    const params = [this.vendorId];

    if (category) {
      query += ' AND vf.category = ?';
      params.push(category);
    }

    query += ' ORDER BY vf.category, vf.created_at DESC';

    const [rows] = await pool.execute(query, params);
    const files = rows as any[];

    const filesByCategory = new Map<string, ExistingFile[]>();

    for (const file of files) {
      const existingFile: ExistingFile = {
        fileId: file.file_id,
        originalName: file.original_name,
        category: file.category,
        fileHash: file.file_hash,
        uploadDate: file.created_at,
        fileSize: file.file_size,
        dimensions: file.width && file.height ? { width: file.width, height: file.height } : undefined,
        url: this.generateFileUrl(file.file_id, file.category, file.original_name)
      };

      if (!filesByCategory.has(file.category)) {
        filesByCategory.set(file.category, []);
      }
      filesByCategory.get(file.category)!.push(existingFile);
    }

    return filesByCategory;
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
    const pool = await getPool();

    const [rows] = await pool.execute(`
      SELECT file_id, original_name 
      FROM vendor_files 
      WHERE vendor_info_id = ? AND category = ? AND file_hash = ? AND deleted_at IS NULL
      LIMIT 1
    `, [this.vendorId, category, fileHash]);

    const duplicateFiles = rows as any[];

    if (duplicateFiles.length > 0) {
      return {
        isDuplicate: true,
        existingFileId: duplicateFiles[0].file_id,
        existingFileName: duplicateFiles[0].original_name
      };
    }

    return { isDuplicate: false };
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
    const pool = await getPool();
    
    const [rows] = await pool.execute(`
      SELECT category, upload_type, COUNT(*) as file_count, SUM(file_size) as total_size
      FROM vendor_files 
      WHERE vendor_info_id = ? AND deleted_at IS NULL
      GROUP BY category, upload_type
    `, [this.vendorId]);

    const stats = rows as any[];
    const filesByCategory = new Map<string, number>();
    const storageByCategory = new Map<string, number>();
    let totalFiles = 0;
    let totalStorage = 0;

    for (const stat of stats) {
      filesByCategory.set(stat.category, stat.file_count);
      storageByCategory.set(stat.category, stat.total_size);
      totalFiles += stat.file_count;
      totalStorage += stat.total_size;
    }

    // Define limits per category
    const maxFilesPerCategory = new Map([
      ['productImages', 10],
      ['productVideos', 3],
      ['csvFiles', 5]
    ]);

    const remainingQuota = new Map<string, number>();
    for (const [category, limit] of maxFilesPerCategory) {
      const used = filesByCategory.get(category) || 0;
      remainingQuota.set(category, Math.max(0, limit - used));
    }

    return {
      totalFiles,
      filesByCategory,
      totalStorage,
      storageByCategory,
      limits: {
        maxFilesPerCategory,
        remainingQuota
      }
    };
  }

  /**
   * Delete file with cleanup
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const pool = await getPool();
      
      // Get file info
      const [rows] = await pool.execute(`
        SELECT file_path, category FROM vendor_files 
        WHERE vendor_info_id = ? AND file_id = ? AND deleted_at IS NULL
      `, [this.vendorId, fileId]);

      const files = rows as any[];
      if (files.length === 0) {
        throw new Error('File not found');
      }

      const file = files[0];

      // Mark as deleted in database (soft delete)
      await pool.execute(`
        UPDATE vendor_files 
        SET deleted_at = NOW(), deleted_by = ?
        WHERE file_id = ?
      `, [this.vendorId, fileId]);

      // Remove physical file
      try {
        await fs.unlink(file.file_path);
        
        // Remove thumbnail if exists
        const thumbnailPath = path.join(this.basePath, file.category, 'thumbnails', `${fileId}_thumb.jpg`);
        await fs.unlink(thumbnailPath).catch(() => {}); // Ignore if thumbnail doesn't exist
      } catch (error) {
        console.warn(`Could not delete physical file: ${error}`);
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
    const pool = await getPool();
    
    await pool.execute(`
      INSERT INTO vendor_files (
        vendor_info_id, file_id, original_name, category, upload_type,
        file_size, file_format, file_hash, file_path,
        width, height, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      metadata.vendorId,
      metadata.fileId,
      metadata.originalName,
      metadata.category,
      metadata.uploadType,
      metadata.fileSize,
      metadata.fileFormat,
      metadata.fileHash,
      metadata.filePath,
      metadata.dimensions?.width || null,
      metadata.dimensions?.height || null
    ]);
  }
}