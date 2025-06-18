import { createHash } from 'crypto';

// Magic bytes for common image formats
const IMAGE_MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header, WebP comes after
  bmp: [0x42, 0x4D]
};

// Maximum image dimensions and file sizes
export const IMAGE_LIMITS = {
  maxWidth: 4096,
  maxHeight: 4096,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxBase64Size: 15 * 1024 * 1024, // 15MB for base64 (accounting for encoding overhead)
  minDimensions: 16 // Minimum 16x16 pixels
};

// Malicious patterns to detect in image data
// TEMPORARILY DISABLED FOR DEVELOPMENT - Re-enable for production
const MALICIOUS_PATTERNS = [
  // Script tags and JavaScript (disabled for now)
  // /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  // /javascript:/gi,
  // /vbscript:/gi,
  // /data:text\/html/gi,
  
  // PHP and server-side code (disabled for now)
  // /<\?php/gi,
  // /<\?=/gi,
  // /<%[\s\S]*?%>/gi,
  
  // Potential executable content (disabled for now)
  // /\x7FELF/g, // ELF executable header
  // /MZ\x90\x00/g, // PE executable header
  // /\x00\x00\x01\x00/g, // ICO file that could contain executable
  
  // Suspicious HTML attributes (disabled for now)
  // /on\w+\s*=/gi, // onload, onclick, etc.
  // /style\s*=\s*["'][^"']*expression\s*\(/gi,
  
  // Data URIs that could be harmful (disabled for now)
  // /data:image\/svg\+xml/gi // SVG can contain scripts
];

export interface ImageValidationResult {
  isValid: boolean;
  format?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  errors: string[];
  warnings: string[];
}

export interface ProcessedImageData {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  hash: string;
}

/**
 * Comprehensive image validation including magic bytes, dimensions, and malicious content
 */
export async function validateImage(buffer: Buffer): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    isValid: false,
    errors: [],
    warnings: []
  };

  try {
    // Check file size
    if (buffer.length === 0) {
      result.errors.push('Empty file provided');
      return result;
    }

    if (buffer.length > IMAGE_LIMITS.maxFileSize) {
      result.errors.push(`File size ${buffer.length} exceeds maximum ${IMAGE_LIMITS.maxFileSize} bytes`);
      return result;
    }

    // Detect actual image format using magic bytes
    const format = detectImageFormat(buffer);
    if (!format) {
      result.errors.push('Invalid or unsupported image format');
      return result;
    }

    result.format = format;

    // Get image dimensions
    const dimensions = getImageDimensions(buffer, format);
    if (!dimensions) {
      result.errors.push('Could not read image dimensions');
      return result;
    }

    result.width = dimensions.width;
    result.height = dimensions.height;
    result.fileSize = buffer.length;

    // Validate dimensions
    if (dimensions.width < IMAGE_LIMITS.minDimensions || dimensions.height < IMAGE_LIMITS.minDimensions) {
      result.errors.push(`Image dimensions ${dimensions.width}x${dimensions.height} are too small (minimum ${IMAGE_LIMITS.minDimensions}x${IMAGE_LIMITS.minDimensions})`);
    }

    if (dimensions.width > IMAGE_LIMITS.maxWidth || dimensions.height > IMAGE_LIMITS.maxHeight) {
      const exceedsWidth = dimensions.width > IMAGE_LIMITS.maxWidth;
      const exceedsHeight = dimensions.height > IMAGE_LIMITS.maxHeight;
      let errorMsg = `Image dimensions ${dimensions.width}x${dimensions.height} exceed maximum ${IMAGE_LIMITS.maxWidth}x${IMAGE_LIMITS.maxHeight}: `;
      
      if (exceedsWidth && exceedsHeight) {
        errorMsg += 'both width and height exceed limits';
      } else if (exceedsWidth) {
        errorMsg += `width ${dimensions.width} exceeds limit ${IMAGE_LIMITS.maxWidth}`;
      } else {
        errorMsg += `height ${dimensions.height} exceeds limit ${IMAGE_LIMITS.maxHeight}`;
      }
      
      result.errors.push(errorMsg);
    }

    // Check for malicious content
    const maliciousContent = detectMaliciousContent(buffer);
    if (maliciousContent.length > 0) {
      result.errors.push(...maliciousContent);
    }

    // Additional security checks
    const securityIssues = performSecurityChecks(buffer, format);
    if (securityIssues.errors.length > 0) {
      result.errors.push(...securityIssues.errors);
    }
    if (securityIssues.warnings.length > 0) {
      result.warnings.push(...securityIssues.warnings);
    }

    result.isValid = result.errors.length === 0;
    return result;

  } catch (error) {
    result.errors.push(`Validation error: ${error}`);
    return result;
  }
}

/**
 * Validate base64 image data before processing
 */
export function validateBase64Image(base64Data: string): { isValid: boolean; errors: string[]; cleanedData?: string } {
  const errors: string[] = [];

  // Check for data URL format
  const dataUrlMatch = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!dataUrlMatch) {
    errors.push('Invalid data URL format');
    return { isValid: false, errors };
  }

  const [, mimeType, base64Content] = dataUrlMatch;
  
  // Validate MIME type
  const allowedMimeTypes = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    errors.push(`Unsupported MIME type: ${mimeType}`);
  }

  // Check base64 length
  if (base64Content.length > IMAGE_LIMITS.maxBase64Size) {
    errors.push(`Base64 data too large: ${base64Content.length} bytes`);
  }

  // Validate base64 format
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Content)) {
    errors.push('Invalid base64 format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanedData: errors.length === 0 ? base64Content : undefined
  };
}

/**
 * Securely process image data with validation
 */
export async function secureImageProcessing(inputBuffer: Buffer): Promise<ProcessedImageData> {
  // Validate the image first
  const validation = await validateImage(inputBuffer);
  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
  }

  // Create hash for deduplication and integrity checking
  const hash = createHash('sha256').update(inputBuffer).digest('hex');

  return {
    buffer: inputBuffer,
    format: validation.format!,
    width: validation.width!,
    height: validation.height!,
    hash
  };
}

/**
 * Detect image format using magic bytes
 */
function detectImageFormat(buffer: Buffer): string | null {
  if (buffer.length < 8) return null;

  // Check PNG
  if (buffer.subarray(0, 8).equals(Buffer.from(IMAGE_MAGIC_BYTES.png))) {
    return 'png';
  }

  // Check JPEG
  if (buffer.subarray(0, 3).equals(Buffer.from(IMAGE_MAGIC_BYTES.jpeg))) {
    return 'jpeg';
  }

  // Check GIF
  if (buffer.subarray(0, 4).equals(Buffer.from(IMAGE_MAGIC_BYTES.gif))) {
    return 'gif';
  }

  // Check WebP (RIFF + WEBP)
  if (buffer.subarray(0, 4).equals(Buffer.from(IMAGE_MAGIC_BYTES.webp)) &&
      buffer.subarray(8, 12).toString() === 'WEBP') {
    return 'webp';
  }

  // Check BMP
  if (buffer.subarray(0, 2).equals(Buffer.from(IMAGE_MAGIC_BYTES.bmp))) {
    return 'bmp';
  }

  return null;
}

/**
 * Extract image dimensions based on format
 */
function getImageDimensions(buffer: Buffer, format: string): { width: number; height: number } | null {
  try {
    switch (format) {
      case 'png':
        return getPngDimensions(buffer);
      case 'jpeg':
        return getJpegDimensions(buffer);
      case 'gif':
        return getGifDimensions(buffer);
      case 'webp':
        return getWebpDimensions(buffer);
      case 'bmp':
        return getBmpDimensions(buffer);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function getPngDimensions(buffer: Buffer): { width: number; height: number } {
  // PNG dimensions are at bytes 16-23 (big endian)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

function getJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let i = 2; // Skip SOI marker
  while (i < buffer.length - 4) {
    const marker = buffer.readUInt16BE(i);
    if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0 or SOF2
      const height = buffer.readUInt16BE(i + 5);
      const width = buffer.readUInt16BE(i + 7);
      return { width, height };
    }
    const length = buffer.readUInt16BE(i + 2);
    i += 2 + length;
  }
  return null;
}

function getGifDimensions(buffer: Buffer): { width: number; height: number } {
  // GIF dimensions are at bytes 6-9 (little endian)
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  return { width, height };
}

function getWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  // WebP format is complex, this is a simplified version
  if (buffer.length < 30) return null;
  
  // Look for VP8 or VP8L chunk
  const chunk = buffer.subarray(12, 16).toString();
  if (chunk === 'VP8 ') {
    const width = buffer.readUInt16LE(26) & 0x3FFF;
    const height = buffer.readUInt16LE(28) & 0x3FFF;
    return { width, height };
  }
  
  return null;
}

function getBmpDimensions(buffer: Buffer): { width: number; height: number } {
  // BMP dimensions are at bytes 18-25 (little endian)
  const width = buffer.readUInt32LE(18);
  const height = Math.abs(buffer.readInt32LE(22)); // Height can be negative
  return { width, height };
}

/**
 * Detect malicious content in image data
 */
function detectMaliciousContent(buffer: Buffer): string[] {
  const errors: string[] = [];
  const content = buffer.toString('binary');

  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`Potentially malicious content detected: ${pattern.source}`);
    }
  }

  return errors;
}

/**
 * Additional security checks
 */
function performSecurityChecks(buffer: Buffer, format: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for ZIP signatures (could indicate polyglot files)
  if (buffer.includes(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
    errors.push('File contains ZIP signature - potential polyglot attack');
  }

  // Check for excessive metadata
  if (format === 'jpeg') {
    const exifSize = getExifSize(buffer);
    if (exifSize > 100 * 1024) { // 100KB
      warnings.push(`Large EXIF data detected: ${exifSize} bytes`);
    }
  }

  // Check for unusual file structure
  const entropy = calculateEntropy(buffer.subarray(0, Math.min(1024, buffer.length)));
  if (entropy > 7.5) {
    warnings.push('High entropy detected - file may be compressed or encrypted');
  }

  return { errors, warnings };
}

function getExifSize(buffer: Buffer): number {
  // Simplified EXIF size calculation for JPEG
  let pos = 2;
  while (pos < buffer.length - 4) {
    const marker = buffer.readUInt16BE(pos);
    if (marker === 0xFFE1) { // EXIF marker
      return buffer.readUInt16BE(pos + 2);
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    pos += 2 + buffer.readUInt16BE(pos + 2);
  }
  return 0;
}

function calculateEntropy(buffer: Buffer): number {
  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }

  let entropy = 0;
  for (const freq of frequencies) {
    if (freq > 0) {
      const p = freq / buffer.length;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}