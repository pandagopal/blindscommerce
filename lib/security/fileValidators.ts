import { validateImage as validateImageContent } from './imageValidation';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  dimensions?: { width: number; height: number };
  duration?: number; // For videos
  rowCount?: number; // For CSV
}

export interface ImageValidationOptions {
  maxWidth: number;
  maxHeight: number;
  maxSize: number;
  allowedFormats: string[];
}

export interface VideoValidationOptions {
  maxWidth: number;
  maxHeight: number;
  maxSize: number;
  maxDuration: number; // in seconds
  allowedFormats: string[];
}

export interface CSVValidationOptions {
  maxSize: number;
  maxRows: number;
  requiredColumns?: string[];
}

/**
 * Validate image files with strict limitations
 */
export async function validateImage(
  buffer: Buffer, 
  options: ImageValidationOptions
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Use comprehensive image validation from imageValidation.ts
    const baseValidation = await validateImageContent(buffer);
    
    if (!baseValidation.isValid) {
      return {
        isValid: false,
        errors: baseValidation.errors,
        warnings: baseValidation.warnings
      };
    }

    const { width, height, fileSize, format } = baseValidation;

    // Check file size
    if (buffer.length > options.maxSize) {
      errors.push(`Image size ${buffer.length} bytes exceeds limit of ${options.maxSize} bytes`);
    }

    // Check format is allowed (only JPEG and PNG)
    if (!options.allowedFormats.includes(`image/${format}`)) {
      errors.push(`Image format ${format} not allowed. Only JPEG and PNG are permitted.`);
    }

    // Check dimensions
    if (width && height) {
      if (width > options.maxWidth || height > options.maxHeight) {
        errors.push(`Image dimensions ${width}x${height} exceed maximum ${options.maxWidth}x${options.maxHeight}`);
      }

      // Web optimization warnings
      if (width > 1920 || height > 1080) {
        warnings.push('Image resolution higher than recommended for web (1920x1080)');
      }

      // Mobile optimization check
      if (width < 640 || height < 480) {
        warnings.push('Image resolution may be too small for mobile display');
      }

      // Aspect ratio validation for product images
      const aspectRatio = width / height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        warnings.push('Unusual aspect ratio detected. Recommended aspect ratio between 1:2 and 2:1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      dimensions: width && height ? { width, height } : undefined
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Image validation failed: ${error}`]
    };
  }
}

/**
 * Validate video files with size and duration limits
 */
export async function validateVideo(
  buffer: Buffer,
  options: VideoValidationOptions
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check file size first
    if (buffer.length > options.maxSize) {
      errors.push(`Video size ${buffer.length} bytes exceeds limit of ${options.maxSize} bytes`);
    }

    // Basic video format detection using magic bytes
    const videoFormat = detectVideoFormat(buffer);
    if (!videoFormat) {
      errors.push('Invalid video format or corrupted file');
      return { isValid: false, errors };
    }

    // Check if format is allowed
    if (!options.allowedFormats.includes(videoFormat)) {
      errors.push(`Video format ${videoFormat} not allowed. Only MP4 and WebM are permitted.`);
    }

    // Basic video metadata extraction (simplified)
    const metadata = await extractVideoMetadata(buffer, videoFormat);
    
    if (metadata.width && metadata.height) {
      if (metadata.width > options.maxWidth || metadata.height > options.maxHeight) {
        errors.push(`Video dimensions ${metadata.width}x${metadata.height} exceed maximum ${options.maxWidth}x${options.maxHeight}`);
      }

      // Mobile compatibility warnings
      if (metadata.width < 640 || metadata.height < 480) {
        warnings.push('Video resolution may be too small for mobile devices');
      }
    }

    if (metadata.duration && metadata.duration > options.maxDuration) {
      errors.push(`Video duration ${metadata.duration}s exceeds maximum ${options.maxDuration}s`);
    }

    // Additional video security checks
    const securityCheck = performVideoSecurityScan(buffer);
    if (!securityCheck.passed) {
      errors.push(...securityCheck.issues);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      dimensions: metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : undefined,
      duration: metadata.duration
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Video validation failed: ${error}`]
    };
  }
}

/**
 * Validate CSV files for bulk operations
 */
export async function validateCSV(
  buffer: Buffer,
  options: CSVValidationOptions
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check file size
    if (buffer.length > options.maxSize) {
      errors.push(`CSV size ${buffer.length} bytes exceeds limit of ${options.maxSize} bytes`);
    }

    // Convert buffer to string and validate CSV format
    const csvContent = buffer.toString('utf8');
    
    // Basic CSV validation
    if (!csvContent.trim()) {
      errors.push('CSV file is empty');
      return { isValid: false, errors };
    }

    // Check for malicious content in CSV
    const securityScan = scanCSVForMaliciousContent(csvContent);
    if (!securityScan.clean) {
      errors.push(...securityScan.issues);
    }

    // Parse CSV and count rows
    const lines = csvContent.split('\n').filter(line => line.trim());
    const rowCount = Math.max(0, lines.length - 1); // Exclude header

    if (rowCount > options.maxRows) {
      errors.push(`CSV contains ${rowCount} rows, exceeding limit of ${options.maxRows} rows`);
    }

    // Validate CSV structure
    if (lines.length < 2) {
      errors.push('CSV must contain at least a header and one data row');
    }

    // Check for required columns if specified
    if (options.requiredColumns && lines.length > 0) {
      const header = lines[0].toLowerCase();
      const missingColumns = options.requiredColumns.filter(col => 
        !header.includes(col.toLowerCase())
      );
      
      if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      }
    }

    // Additional CSV warnings
    if (rowCount < 1) {
      warnings.push('CSV contains no data rows');
    }

    if (rowCount > 500) {
      warnings.push('Large CSV file may take longer to process');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      rowCount
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`CSV validation failed: ${error}`]
    };
  }
}

// Helper functions

function detectVideoFormat(buffer: Buffer): string | null {
  // MP4 magic bytes
  if (buffer.length >= 12) {
    const ftypBox = buffer.subarray(4, 12).toString('ascii');
    if (ftypBox.includes('mp4') || ftypBox.includes('isom')) {
      return 'video/mp4';
    }
  }

  // WebM magic bytes (EBML header)
  if (buffer.length >= 4) {
    const webmSignature = buffer.subarray(0, 4);
    if (webmSignature[0] === 0x1A && webmSignature[1] === 0x45 && 
        webmSignature[2] === 0xDF && webmSignature[3] === 0xA3) {
      return 'video/webm';
    }
  }

  return null;
}

async function extractVideoMetadata(buffer: Buffer, format: string): Promise<{
  width?: number;
  height?: number;
  duration?: number;
}> {
  // Simplified metadata extraction
  // In a real implementation, you would use a library like ffprobe or node-ffmpeg
  
  const metadata: { width?: number; height?: number; duration?: number } = {};

  try {
    if (format === 'video/mp4') {
      // Basic MP4 metadata extraction (simplified)
      // This is a very basic implementation - in production, use proper video parsing libraries
      metadata.width = 1920; // Default assumption
      metadata.height = 1080;
      metadata.duration = 60; // Default assumption
    } else if (format === 'video/webm') {
      // Basic WebM metadata extraction (simplified)
      metadata.width = 1920;
      metadata.height = 1080;
      metadata.duration = 60;
    }
  } catch (error) {
    console.warn('Could not extract video metadata:', error);
  }

  return metadata;
}

function performVideoSecurityScan(buffer: Buffer): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for suspicious patterns in video files
  const content = buffer.toString('binary', 0, Math.min(1024, buffer.length));

  // Check for embedded scripts or executables
  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /\x7FELF/g, // ELF executable
    /MZ\x90\x00/g, // PE executable
    /<iframe/gi,
    /eval\s*\(/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      issues.push('Video file contains suspicious content patterns');
      break;
    }
  }

  // Check file size ratio (videos should not be too small for their claimed type)
  if (buffer.length < 1024) {
    issues.push('Video file suspiciously small');
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

function scanCSVForMaliciousContent(csvContent: string): { clean: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for formula injection (CSV injection)
  const formulaPatterns = [
    /^[=@+-]/gm, // Excel formula starters
    /cmd\|/gi,
    /powershell/gi,
    /system\(/gi,
    /exec\(/gi
  ];

  for (const pattern of formulaPatterns) {
    if (pattern.test(csvContent)) {
      issues.push('CSV contains potentially malicious formulas');
      break;
    }
  }

  // Check for suspicious URLs or scripts
  const urlPattern = /(https?:\/\/[^\s,]+)/gi;
  const urls = csvContent.match(urlPattern);
  if (urls && urls.length > 10) {
    issues.push('CSV contains excessive number of URLs');
  }

  // Check for suspicious file paths
  if (csvContent.includes('../') || csvContent.includes('..\\')) {
    issues.push('CSV contains path traversal patterns');
  }

  // Check for script injection
  const scriptPatterns = [
    /<script/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi
  ];

  for (const pattern of scriptPatterns) {
    if (pattern.test(csvContent)) {
      issues.push('CSV contains script injection patterns');
      break;
    }
  }

  return {
    clean: issues.length === 0,
    issues
  };
}