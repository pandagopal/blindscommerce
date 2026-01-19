/**
 * Input Validation Utility
 * Centralized validation functions for user inputs across the application
 */

/**
 * Validate and sanitize a pagination limit value
 * Ensures it's a positive integer within allowed bounds
 */
export function validateLimit(value: unknown, defaultLimit = 20, maxLimit = 100): number {
  const num = Number(value);
  if (isNaN(num) || num < 1) return defaultLimit;
  return Math.min(Math.floor(num), maxLimit);
}

/**
 * Validate and sanitize a pagination offset value
 * Ensures it's a non-negative integer
 */
export function validateOffset(value: unknown, defaultOffset = 0): number {
  const num = Number(value);
  if (isNaN(num) || num < 0) return defaultOffset;
  return Math.floor(num);
}

/**
 * Validate sort column against a whitelist
 * Prevents SQL injection through dynamic ORDER BY
 */
export function validateSortColumn(
  value: string | null | undefined,
  allowedColumns: string[],
  defaultColumn: string
): string {
  if (!value) return defaultColumn;
  const normalized = value.toLowerCase().trim();
  return allowedColumns.includes(normalized) ? normalized : defaultColumn;
}

/**
 * Validate sort direction
 */
export function validateSortOrder(
  value: string | null | undefined,
  defaultOrder: 'ASC' | 'DESC' = 'ASC'
): 'ASC' | 'DESC' {
  if (!value) return defaultOrder;
  const normalized = value.toUpperCase().trim();
  return normalized === 'DESC' ? 'DESC' : 'ASC';
}

/**
 * Validate an ID parameter (numeric)
 * Returns null if invalid, allowing caller to handle the error
 */
export function validateId(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1) return null;
  return num;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (flexible, US-focused)
 */
export function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Check for valid length (10-15 digits, optionally starting with +)
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Sanitize a search string
 * Removes potentially dangerous characters while keeping useful search terms
 */
export function sanitizeSearchTerm(term: string | null | undefined): string {
  if (!term) return '';
  return term
    .trim()
    .substring(0, 200) // Limit length
    .replace(/[<>\"\'`;]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate a slug (URL-safe string)
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 100;
}

/**
 * Sanitize a slug
 */
export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Validate status value against allowed values
 */
export function validateStatus(
  status: string | null | undefined,
  allowedStatuses: string[],
  defaultStatus?: string
): string | null {
  if (!status) return defaultStatus || null;
  const normalized = status.toLowerCase().trim();
  if (allowedStatuses.includes(normalized)) {
    return normalized;
  }
  return defaultStatus || null;
}

/**
 * Validate price/amount value
 * Returns null if invalid
 */
export function validateAmount(value: unknown): number | null {
  const num = Number(value);
  if (isNaN(num) || num < 0) return null;
  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

/**
 * Validate quantity (positive integer)
 */
export function validateQuantity(value: unknown, min = 1, max = 1000): number | null {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) return null;
  return Math.floor(num);
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate date range
 * Ensures start date is before or equal to end date
 */
export function validateDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { start: Date; end: Date } | null {
  if (!startDate || !endDate) return null;
  if (!isValidDate(startDate) || !isValidDate(endDate)) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) return null;
  return { start, end };
}

/**
 * Sanitize a filename
 * Removes path traversal characters and dangerous file extensions
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and traversal attempts
  const sanitized = filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim();

  // Ensure reasonable length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 240 - ext.length);
    return `${name}.${ext}`;
  }

  return sanitized;
}

/**
 * Validate file extension against allowed list
 */
export function isAllowedFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  return allowedExtensions.includes(`.${ext}`) || allowedExtensions.includes(ext);
}

/**
 * Validate JSON string
 * Returns parsed object or null if invalid
 */
export function validateJSON<T = unknown>(jsonStr: string): T | null {
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Validate URL format
 */
export function isValidURL(url: string, allowedProtocols = ['http:', 'https:']): boolean {
  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate IP address format (IPv4)
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}
