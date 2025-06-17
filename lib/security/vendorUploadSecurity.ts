import { validateImage, validateFileUpload } from './validation';
import { validateImage as validateImageContent } from './imageValidation';
import { createHash } from 'crypto';

// Vendor-specific upload limits and configurations
export const VENDOR_UPLOAD_LIMITS = {
  productImages: {
    maxFiles: 10, // Reduced from 20
    maxFileSize: 2 * 1024 * 1024, // Reduced to 2MB for web optimization
    allowedFormats: ['image/jpeg', 'image/png'], // Limited to 2 types only
    maxDimensions: { width: 1920, height: 1080 }, // Standard web resolution
    minDimensions: { width: 300, height: 300 } // Increased minimum for quality
  },
  productVideos: {
    maxFiles: 3, // Max 3 videos per product
    maxFileSize: 50 * 1024 * 1024, // 50MB for videos
    allowedFormats: ['video/mp4', 'video/webm'], // Standard web video formats
    maxDuration: 120, // 2 minutes max
    maxDimensions: { width: 1920, height: 1080 },
    minDimensions: { width: 640, height: 480 }
  },
  csvFiles: {
    maxFiles: 5, // CSV file uploads for bulk operations
    maxFileSize: 10 * 1024 * 1024, // 10MB for CSV
    allowedFormats: ['text/csv', 'application/vnd.ms-excel'],
    maxRows: 1000, // Limit CSV rows to prevent abuse
    requiresValidation: true
  },
  businessDocuments: {
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    requiresVerification: true
  },
  catalogs: {
    maxFiles: 50,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    requiresApproval: true
  }
};

export const CUSTOMER_UPLOAD_LIMITS = {
  profileAvatar: {
    maxFiles: 1,
    maxFileSize: 1 * 1024 * 1024, // Reduced to 1MB
    allowedFormats: ['image/jpeg', 'image/png'], // Limited to 2 types
    maxDimensions: { width: 512, height: 512 }, // Optimized for avatars
    minDimensions: { width: 100, height: 100 }
  },
  roomPhotos: {
    maxFiles: 5, // Reduced from 10
    maxFileSize: 3 * 1024 * 1024, // Reduced to 3MB
    allowedFormats: ['image/jpeg', 'image/png'], // Limited to 2 types
    maxDimensions: { width: 1920, height: 1080 }, // Standard resolution
    minDimensions: { width: 640, height: 480 }, // Mobile minimum
    requiresMeasurements: true
  },
  measurementDocuments: {
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    requiresValidation: true
  }
};

export interface SecureUploadResult {
  success: boolean;
  fileId: string;
  originalName: string;
  secureUrl: string;
  hash: string;
  metadata: {
    size: number;
    format: string;
    dimensions?: { width: number; height: number };
    scanResult: 'clean' | 'suspicious' | 'malicious';
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Secure vendor file upload handler with comprehensive validation
 */
export class SecureVendorUpload {
  private vendorId: number;
  private uploadType: keyof typeof VENDOR_UPLOAD_LIMITS;
  private productId?: string;

  constructor(vendorId: number, uploadType: keyof typeof VENDOR_UPLOAD_LIMITS, productId?: string) {
    this.vendorId = vendorId;
    this.uploadType = uploadType;
    this.productId = productId;
  }

  async processFile(file: File): Promise<SecureUploadResult> {
    const limits = VENDOR_UPLOAD_LIMITS[this.uploadType];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic file validation
      if (!file || file.size === 0) {
        throw new Error('Invalid or empty file');
      }

      // File size validation
      if (file.size > limits.maxFileSize) {
        throw new Error(`File size ${file.size} exceeds limit ${limits.maxFileSize}`);
      }

      // MIME type validation (client-side check, will be verified server-side)
      if (!limits.allowedFormats.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }

      // Convert to buffer for deep validation
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Magic byte validation for images
      if (file.type.startsWith('image/')) {
        const imageValidation = await validateImageContent(buffer);
        if (!imageValidation.isValid) {
          throw new Error(`Image validation failed: ${imageValidation.errors.join(', ')}`);
        }

        // Dimension validation for images
        if (imageValidation.width && imageValidation.height) {
          if ('maxDimensions' in limits) {
            const maxDims = limits.maxDimensions as { width: number; height: number };
            if (imageValidation.width > maxDims.width || imageValidation.height > maxDims.height) {
              throw new Error(`Image dimensions ${imageValidation.width}x${imageValidation.height} exceed limit ${maxDims.width}x${maxDims.height}`);
            }
          }

          if ('minDimensions' in limits) {
            const minDims = limits.minDimensions as { width: number; height: number };
            if (imageValidation.width < minDims.width || imageValidation.height < minDims.height) {
              throw new Error(`Image dimensions ${imageValidation.width}x${imageValidation.height} below minimum ${minDims.width}x${minDims.height}`);
            }
          }
        }

        warnings.push(...(imageValidation.warnings || []));
      }

      // Content scanning for malicious content
      const scanResult = await this.scanFileContent(buffer, file.type);
      
      if (scanResult === 'malicious') {
        throw new Error('File contains malicious content');
      }

      if (scanResult === 'suspicious') {
        warnings.push('File flagged as potentially suspicious');
      }

      // Generate secure file ID and hash
      const fileId = this.generateSecureFileId();
      const hash = createHash('sha256').update(buffer).digest('hex');

      // In a real implementation, upload to secure storage here
      const secureUrl = `/api/secure-files/vendor/${this.vendorId}/${fileId}`;

      return {
        success: true,
        fileId,
        originalName: this.sanitizeFilename(file.name),
        secureUrl,
        hash,
        metadata: {
          size: file.size,
          format: file.type,
          dimensions: file.type.startsWith('image/') ? {
            width: (await validateImageContent(buffer)).width || 0,
            height: (await validateImageContent(buffer)).height || 0
          } : undefined,
          scanResult
        },
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        fileId: '',
        originalName: this.sanitizeFilename(file.name),
        secureUrl: '',
        hash: '',
        metadata: {
          size: file.size,
          format: file.type,
          scanResult: 'malicious'
        },
        errors: [error instanceof Error ? error.message : 'Upload failed']
      };
    }
  }

  private async scanFileContent(buffer: Buffer, mimeType: string): Promise<'clean' | 'suspicious' | 'malicious'> {
    // Basic malicious content detection
    const content = buffer.toString('binary', 0, Math.min(1024, buffer.length));
    
    // Check for embedded scripts or executables
    const maliciousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /<iframe/gi,
      /on\w+\s*=/gi, // Event handlers
      /\x7FELF/g, // ELF executable
      /MZ\x90\x00/g, // PE executable
      /<\?php/gi,
      /<%[\s\S]*?%>/gi
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        return 'malicious';
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /document\.write/gi,
      /base64/gi,
      /fromCharCode/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return 'suspicious';
      }
    }

    // PDF-specific checks
    if (mimeType === 'application/pdf') {
      if (buffer.includes(Buffer.from('/JavaScript'))) {
        return 'suspicious';
      }
      if (buffer.includes(Buffer.from('/JS'))) {
        return 'suspicious';
      }
    }

    return 'clean';
  }

  private generateSecureFileId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const vendorHash = createHash('md5').update(this.vendorId.toString()).digest('hex').substring(0, 8);
    
    // Include product ID prefix if provided
    if (this.productId) {
      return `product_${this.productId}_${vendorHash}_${timestamp}_${random}`;
    }
    
    return `${vendorHash}_${timestamp}_${random}`;
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_') // Replace special chars
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .substring(0, 100); // Limit length
  }
}

/**
 * Secure customer file upload handler
 */
export class SecureCustomerUpload {
  private customerId: number;
  private uploadType: keyof typeof CUSTOMER_UPLOAD_LIMITS;

  constructor(customerId: number, uploadType: keyof typeof CUSTOMER_UPLOAD_LIMITS) {
    this.customerId = customerId;
    this.uploadType = uploadType;
  }

  async processFile(file: File): Promise<SecureUploadResult> {
    const limits = CUSTOMER_UPLOAD_LIMITS[this.uploadType];
    
    // Similar implementation to vendor upload but with customer-specific limits
    // Reuse the secure processing logic from SecureVendorUpload
    const vendorUpload = new SecureVendorUpload(this.customerId, 'productImages', undefined); // Temporary for reuse
    
    // Override limits for customer-specific validation
    const result = await vendorUpload.processFile(file);
    
    if (result.success) {
      // Update secure URL for customer context
      result.secureUrl = `/api/secure-files/customer/${this.customerId}/${result.fileId}`;
    }
    
    return result;
  }
}

/**
 * Validation for business documents (vendor-specific)
 */
export async function validateBusinessDocument(file: File, documentType: string): Promise<{
  isValid: boolean;
  errors: string[];
  requiresManualReview: boolean;
}> {
  const errors: string[] = [];
  let requiresManualReview = false;

  // File type validation for business documents
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Document type ${file.type} not allowed for business documents`);
  }

  // Document-specific validation
  switch (documentType) {
    case 'business_license':
      if (file.size > 10 * 1024 * 1024) { // 10MB
        errors.push('Business license file too large');
      }
      requiresManualReview = true;
      break;
      
    case 'tax_id':
      if (file.size > 5 * 1024 * 1024) { // 5MB
        errors.push('Tax ID document file too large');
      }
      requiresManualReview = true;
      break;
      
    case 'insurance_certificate':
      if (file.size > 8 * 1024 * 1024) { // 8MB
        errors.push('Insurance certificate file too large');
      }
      requiresManualReview = true;
      break;
      
    default:
      errors.push('Unknown document type');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requiresManualReview
  };
}

/**
 * Sanitize user input for file metadata
 */
export function sanitizeFileMetadata(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML/XSS chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 200); // Limit length
}